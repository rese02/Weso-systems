
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, writeBatch, query, where, Timestamp, orderBy, deleteDoc, collectionGroup, limit } from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { z } from 'zod';
import type { Booking, BookingLink, BookingPrefill, BookingFormValues, BookingLinkWithHotel, BookingStatus } from '@/lib/definitions';
import { bookingFormSchema } from '@/lib/definitions';
import { addDays } from 'date-fns';
import { getHotelById } from './hotel.actions';


/**
 * Creates a new booking and a corresponding booking link.
 * This is a single, atomic operation to ensure data consistency.
 */
export async function createBookingWithLink(
    { hotelId, bookingData }: { hotelId: string, bookingData: BookingFormValues }
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    if (!hotelId) {
        return { success: false, error: "Hotel ID is required." };
    }

    const validation = bookingFormSchema.safeParse(bookingData);
    if (!validation.success) {
        console.error("Zod validation failed:", validation.error.flatten());
        const flatErrors = validation.error.flatten();
        const errorMessages = Object.entries(flatErrors.fieldErrors).map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ');
        return { success: false, error: `Validation failed: ${errorMessages}` };
    }
    
    const validatedData = validation.data;

    const batch = writeBatch(db);

    try {
        // 1. Create the new booking document
        const newBookingRef = doc(collection(db, `hotels/${hotelId}/bookings`));
        
        const newBooking: Omit<Booking, 'id'> = {
            hotelId,
            status: 'Sent', // 'Sent' because we are creating a link right away
            createdAt: Timestamp.now().toDate().toISOString(),
            updatedAt: Timestamp.now().toDate().toISOString(),
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            checkIn: validatedData.checkInDate.toISOString(), // Convert Date to ISO string
            checkOut: validatedData.checkOutDate.toISOString(), // Convert Date to ISO string
            boardType: validatedData.boardType,
            priceTotal: validatedData.priceTotal ?? 0,
            internalNotes: validatedData.internalNotes,
            guestLanguage: validatedData.guestLanguage as any,
            rooms: validatedData.rooms.map((r: any) => ({ 
                roomType: r.roomType || 'Standard',
                adults: Number(r.adults) || 0,
                children: Number(r.children) || 0,
                infants: Number(r.infants) || 0,
                childrenAges: r.childrenAges || [],
            })),
            // bookingLinkId will be set later
        };
        // Use an object that matches the structure for a write operation, not the final Booking type
        const firestoreBookingData = {
            ...newBooking,
            priceTotal: newBooking.priceTotal ?? null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
        batch.set(newBookingRef, firestoreBookingData);

        // 2. Create the booking link (token) document
        const newLinkRef = doc(collection(db, `hotels/${hotelId}/bookingLinks`));
        const now = new Date();
        
        const prefill: BookingPrefill = {
            firstName: newBooking.firstName,
            lastName: newBooking.lastName,
            checkIn: newBooking.checkIn,
            checkOut: newBooking.checkOut,
            boardType: newBooking.boardType,
            priceTotal: newBooking.priceTotal,
            bookingId: newBookingRef.id,
            rooms: newBooking.rooms,
            guestLanguage: newBooking.guestLanguage,
        };

        const newLink: Omit<BookingLink, 'id'> = {
            bookingId: newBookingRef.id,
            hotelId: hotelId,
            createdBy: 'hotel-admin-uid', // Placeholder
            createdAt: Timestamp.fromDate(now),
            expiresAt: Timestamp.fromDate(addDays(now, 7)),
            status: 'active',
            prefill: prefill
        };
        batch.set(newLinkRef, newLink);

        // 3. Update the booking with the link ID
        batch.update(newBookingRef, { bookingLinkId: newLinkRef.id });

        // 4. Commit all operations at once
        await batch.commit();

        return { success: true, bookingId: newBookingRef.id };

    } catch (error) {
        console.error("Error creating booking with link:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Updates an existing booking.
 */
export async function updateBooking(
    { hotelId, bookingId, bookingData }: { hotelId: string, bookingId: string, bookingData: BookingFormValues }
): Promise<{ success: boolean; error?: string }> {
    if (!hotelId || !bookingId) {
        return { success: false, error: "Hotel ID and Booking ID are required." };
    }
    
    const validation = bookingFormSchema.safeParse(bookingData);
    if (!validation.success) {
        return { success: false, error: `Validation failed: ${validation.error.message}` };
    }
    
    const validatedData = validation.data;

    try {
        const bookingRef = doc(db, `hotels/${hotelId}/bookings`, bookingId);

        const updatedBookingData = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            checkIn: validatedData.checkInDate.toISOString(),
            checkOut: validatedData.checkOutDate.toISOString(),
            boardType: validatedData.boardType,
            priceTotal: validatedData.priceTotal ?? 0,
            internalNotes: validatedData.internalNotes,
            guestLanguage: validatedData.guestLanguage,
            rooms: validatedData.rooms.map((r: any) => ({
                roomType: r.roomType || 'Standard',
                adults: Number(r.adults) || 0,
                children: Number(r.children) || 0,
                infants: Number(r.infants) || 0,
                childrenAges: r.childrenAges || [],
            })),
            updatedAt: Timestamp.now(),
        };
        
        await updateDoc(bookingRef, updatedBookingData);

        return { success: true };
    } catch (error) {
        console.error("Error updating booking:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Fetches all bookings for a given hotel.
 */
export async function getBookingsForHotel(hotelId: string): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
    if (!hotelId) return { success: false, error: "Hotel ID is required." };

    try {
        const bookingsCol = collection(db, `hotels/${hotelId}/bookings`);
        const q = query(bookingsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Timestamp fields to ISO strings for serialization
            const serializableData: { [key: string]: any } = {};
            for (const key in data) {
                 const value = data[key];
                if (value instanceof Timestamp) {
                    serializableData[key] = value.toDate().toISOString();
                } else if (key === 'companions' && Array.isArray(value)) {
                     serializableData[key] = value.map(item => {
                        if (item && item.dateOfBirth instanceof Timestamp) {
                            return { ...item, dateOfBirth: item.dateOfBirth.toDate().toISOString() };
                        }
                        return item;
                    });
                } else {
                    serializableData[key] = value;
                }
            }
            return { 
                id: doc.id,
                ...serializableData,
             } as Booking;
        });
        
        return { success: true, bookings: bookings };

    } catch (error) {
        console.error("Error fetching bookings:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Fetches a single booking by its ID for a given hotel.
 */
export async function getBookingById({ hotelId, bookingId }: { hotelId: string, bookingId: string }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    if (!hotelId || !bookingId) return { success: false, error: "Hotel and Booking ID are required." };

    try {
        const bookingRef = doc(db, `hotels/${hotelId}/bookings`, bookingId);
        const snapshot = await getDoc(bookingRef);
        
        if (!snapshot.exists()) {
            return { success: false, error: "Booking not found." };
        }
        
        const data = snapshot.data();
        const serializableData: { [key: string]: any } = {};
        for (const key in data) {
            const value = data[key];
            if (value instanceof Timestamp) {
                serializableData[key] = value.toDate().toISOString();
            } else if (Array.isArray(value)) {
                // Specifically handle companions array with Timestamps
                if (key === 'companions') {
                    serializableData[key] = value.map(item => {
                        if (item && item.dateOfBirth instanceof Timestamp) {
                            return { ...item, dateOfBirth: item.dateOfBirth.toDate().toISOString() };
                        }
                        return item;
                    });
                } else {
                    serializableData[key] = value;
                }
            } else {
                serializableData[key] = value;
            }
        }
        
        const booking = { id: snapshot.id, ...serializableData } as Booking;
        
        return { success: true, booking: booking };

    } catch (error) {
        console.error("Error fetching booking by ID:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Deletes a booking from a hotel's sub-collection, including associated files in Storage.
 */
export async function deleteBooking({ bookingId, hotelId }: { bookingId: string, hotelId: string }): Promise<{ success: boolean, error?: string }> {
     if (!hotelId || !bookingId) {
        return { success: false, error: "Hotel ID and Booking ID are required." };
    }
    try {
        const bookingRef = doc(db, `hotels/${hotelId}/bookings`, bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) {
             return { success: false, error: "Booking to delete not found." };
        }

        const bookingData = bookingSnap.data() as Booking;

        // Delete associated files from Firebase Storage
        const docUrls = [
            bookingData.documents?.idFront,
            bookingData.documents?.idBack,
            bookingData.documents?.paymentProof
        ].filter(Boolean); // Filter out any undefined/null values

        for (const url of docUrls) {
            if (url) {
                try {
                    const fileRef = ref(storage, url);
                    await deleteObject(fileRef);
                } catch (storageError: any) {
                    // Log error but continue deletion process
                    if (storageError.code !== 'storage/object-not-found') {
                       console.error(`Failed to delete file from storage: ${url}`, storageError);
                    }
                }
            }
        }
        
        // Use a batch to delete Firestore documents atomically
        const batch = writeBatch(db);
        batch.delete(bookingRef);
        
        // Also delete the associated booking link if it exists
        if(bookingData.bookingLinkId) {
            const linkDocRef = doc(db, `hotels/${hotelId}/bookingLinks`, bookingData.bookingLinkId);
            batch.delete(linkDocRef);
        }

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error deleting booking:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Fetches the details for a given booking link ID, including hotel name.
 * This function uses a fallback scan method to find the link across all hotels,
 * which is more reliable than a collection group query without a pre-configured index.
 */
export async function getBookingLinkDetails(linkId: string): Promise<{ success: boolean, data?: BookingLinkWithHotel, error?: string }> {
  if (!linkId) return { success: false, error: "Link ID is required." };
  
  try {
    let foundLink: BookingLink | null = null;
    let foundHotelId: string | null = null;

    // Scan through all hotels to find the booking link.
    // This is less efficient but more reliable without a specific index.
    const hotelsSnapshot = await getDocs(collection(db, 'hotels'));
    for (const hotelDoc of hotelsSnapshot.docs) {
        const hotelId = hotelDoc.id;
        const linkDocRef = doc(db, 'hotels', hotelId, 'bookingLinks', linkId);
        const docSnap = await getDoc(linkDocRef);
        if (docSnap.exists()) {
            foundLink = { id: docSnap.id, ...docSnap.data() } as BookingLink;
            foundHotelId = hotelId;
            break; // Exit the loop once the link is found
        }
    }

    if (!foundLink || !foundHotelId) {
        return { success: false, error: "Ungültiger oder nicht gefundener Buchungslink." };
    }
    
    const hotelResult = await getHotelById(foundHotelId);

    if (!hotelResult.hotel) {
        return { success: false, error: "Zugehöriges Hotel nicht gefunden." };
    }

    const hotel = hotelResult.hotel;
    
    // Convert Timestamps to ISO strings for client-side serialization
    const serializableLinkData = {
        ...foundLink,
        createdAt: (foundLink.createdAt as Timestamp).toDate().toISOString(),
        expiresAt: (foundLink.expiresAt as Timestamp).toDate().toISOString(),
        hotelName: hotel.name,
        prefill: {
            ...foundLink.prefill,
            logoUrl: hotel.logoUrl || null,
        }
    };
    
    return { success: true, data: serializableLinkData as BookingLinkWithHotel };

  } catch (error) {
    console.error("Error fetching link details:", error);
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Updates the status of a single booking.
 */
export async function updateBookingStatus(
    { hotelId, bookingId, status }: { hotelId: string, bookingId: string, status: BookingStatus }
): Promise<{ success: boolean; error?: string }> {
    if (!hotelId || !bookingId || !status) {
        return { success: false, error: "Hotel ID, Booking ID, and Status are required." };
    }

    try {
        const bookingRef = doc(db, `hotels/${hotelId}/bookings`, bookingId);
        await updateDoc(bookingRef, {
            status: status,
            updatedAt: Timestamp.now(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating booking status:", error);
        return { success: false, error: (error as Error).message };
    }
}
