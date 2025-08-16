
'use server';

import { dbAdmin as db } from '@/lib/firebase-admin'; // Use Admin SDK for server actions
import { storage } from '@/lib/firebase.client'; // Storage client can be used on server
import { Timestamp } from 'firebase-admin/firestore';
import { ref, deleteObject } from 'firebase/storage';
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

    const batch = db.batch();

    try {
        // 1. Create the new booking document reference
        const newBookingRef = db.collection(`hotels/${hotelId}/bookings`).doc();
        
        // 2. Create the booking link reference
        const newLinkRef = db.collection(`hotels/${hotelId}/bookingLinks`).doc();
        
        // 3. Prepare Booking Data
        const newBooking: Omit<Booking, 'id'> = {
            hotelId,
            agencyId: 'agency_weso_systems',
            status: 'Sent', // Set status to 'Sent' as a link is being generated
            bookingLinkId: newLinkRef.id,
            createdAt: Timestamp.now().toDate().toISOString(),
            updatedAt: Timestamp.now().toDate().toISOString(),
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
        };

        const firestoreBookingData = {
            ...newBooking,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
        batch.set(newBookingRef, firestoreBookingData);

        // 4. Prepare Link Data
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
            id: newLinkRef.id, // Store the ID also as a field for reliable querying
            bookingId: newBookingRef.id,
            hotelId: hotelId,
            createdBy: 'system',
            createdAt: Timestamp.fromDate(now),
            expiresAt: Timestamp.fromDate(addDays(now, 7)),
            status: 'active',
            prefill: prefill
        };
        batch.set(newLinkRef, newLink);

        // 5. Create a global index entry for direct lookup without collectionGroup queries
        const indexRef = db.doc(`bookingLinkIndex/${newLinkRef.id}`);
        batch.set(indexRef, { hotelId: hotelId });


        // 6. Commit all operations at once
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
        const bookingRef = db.doc(`hotels/${hotelId}/bookings/${bookingId}`);

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
        
        await bookingRef.update(updatedBookingData);

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
        const bookingsCol = db.collection(`hotels/${hotelId}/bookings`);
        const q = bookingsCol.orderBy("createdAt", "desc");
        const snapshot = await q.get();
        
        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
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
        const bookingRef = db.doc(`hotels/${hotelId}/bookings/${bookingId}`);
        const snapshot = await bookingRef.get();
        
        if (!snapshot.exists) {
            return { success: false, error: "Booking not found." };
        }
        
        const data = snapshot.data();
        const serializableData: { [key: string]: any } = {};
        for (const key in data!) {
            const value = data[key];
            if (value instanceof Timestamp) {
                serializableData[key] = value.toDate().toISOString();
            } else if (Array.isArray(value)) {
                if (key === 'companions') {
                    serializableData[key] = value.map(item => {
                        if (item && typeof item === 'object' && item.dateOfBirth instanceof Timestamp) {
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
        const bookingRef = db.doc(`hotels/${hotelId}/bookings/${bookingId}`);
        const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists) {
             return { success: false, error: "Booking to delete not found." };
        }

        const bookingData = bookingSnap.data() as Booking;
        
        const batch = db.batch();

        // --- Delete files, booking, link, and index entry ---

        // Delete associated files from Firebase Storage
        const docUrls = [
            bookingData.documents?.idFront,
            bookingData.documents?.idBack,
            bookingData.documents?.paymentProof
        ].filter(Boolean);

        bookingData.companions?.forEach(c => {
            if (c.documents?.idFront) docUrls.push(c.documents.idFront);
            if (c.documents?.idBack) docUrls.push(c.documents.idBack);
        })

        for (const url of docUrls) {
            if (url) {
                try {
                    const fileRef = ref(storage, url);
                    await deleteObject(fileRef);
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                       console.error(`Failed to delete file from storage: ${url}`, storageError);
                    }
                }
            }
        }
        
        // Delete the booking document
        batch.delete(bookingRef);
        
        // Delete the booking link document
        if(bookingData.bookingLinkId) {
            const linkDocRef = db.doc(`hotels/${hotelId}/bookingLinks/${bookingData.bookingLinkId}`);
            batch.delete(linkDocRef);

            // Delete the global index entry
            const indexRef = db.doc(`bookingLinkIndex/${bookingData.bookingLinkId}`);
            batch.delete(indexRef);
        }

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error deleting booking and its data:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Fetches the details for a given booking link ID using a robust, index-free, two-step lookup.
 */
export async function getBookingLinkDetails(linkId: string): Promise<{ success: boolean, data?: BookingLinkWithHotel, error?: string }> {
  if (!linkId) return { success: false, error: "Link ID is required." };
  
  try {
    // Step 1: Look up the hotelId from the global index. This is a fast, direct read.
    const indexRef = db.doc(`bookingLinkIndex/${linkId}`);
    const indexSnap = await indexRef.get();

    if (!indexSnap.exists) {
        return { success: false, error: "Ungültiger oder nicht gefundener Buchungslink." };
    }
    const { hotelId } = indexSnap.data() as { hotelId: string };

    if (!hotelId) {
        return { success: false, error: "Fehlerhafte Link-Daten." };
    }

    // Step 2: Now that we have the hotelId, perform a direct read on the specific booking link document.
    const linkDocRef = db.doc(`hotels/${hotelId}/bookingLinks/${linkId}`);
    const linkDoc = await linkDocRef.get();
    
    if (!linkDoc.exists) {
       return { success: false, error: "Detail des Buchungslinks nicht gefunden." };
    }
    
    const linkData = { id: linkDoc.id, ...linkDoc.data() } as BookingLink;
    
    const hotelResult = await getHotelById(linkData.hotelId);
    if (!hotelResult.hotel) {
        return { success: false, error: "Zugehöriges Hotel nicht gefunden." };
    }
    const hotel = hotelResult.hotel;
    
    const serializableLinkData = {
        ...linkData,
        createdAt: (linkData.createdAt as Timestamp).toDate().toISOString(),
        expiresAt: (linkData.expiresAt as Timestamp).toDate().toISOString(),
        hotelName: hotel.name,
        prefill: {
            ...linkData.prefill,
            logoUrl: hotel.logoUrl || null,
        }
    };
    
    return { success: true, data: serializableLinkData as BookingLinkWithHotel };

  } catch (error) {
    console.error("Error fetching link details:", error);
    const e = error as Error;
    return { success: false, error: "Ein unerwarteter Serverfehler ist aufgetreten." };
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
        const bookingRef = db.doc(`hotels/${hotelId}/bookings/${bookingId}`);
        await bookingRef.update({
            status: status,
            updatedAt: Timestamp.now(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating booking status:", error);
        return { success: false, error: (error as Error).message };
    }
}
