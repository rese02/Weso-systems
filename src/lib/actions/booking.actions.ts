
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, writeBatch, query, where, Timestamp, orderBy, deleteDoc, collectionGroup, limit } from 'firebase/firestore';
import { z } from 'zod';
import type { Booking, BookingLink, BookingPrefill, BookingFormValues } from '@/lib/definitions';
import { bookingFormSchema } from '@/lib/definitions';
import { addDays } from 'date-fns';


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
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            checkIn: validatedData.checkInDate.toISOString(), // Convert Date to ISO string
            checkOut: validatedData.checkOutDate.toISOString(), // Convert Date to ISO string
            boardType: validatedData.boardType,
            priceTotal: validatedData.priceTotal,
            internalNotes: validatedData.internalNotes,
            guestLanguage: validatedData.guestLanguage,
            rooms: validatedData.rooms.map((r: any) => ({ 
                roomType: r.roomType || 'Standard',
                adults: Number(r.adults) || 0,
                children: Number(r.children) || 0,
                infants: Number(r.infants) || 0,
                childrenAges: r.childrenAges || [],
            })),
            // bookingLinkId will be set later
        };
        batch.set(newBookingRef, newBooking);

        // 2. Create the booking link (token) document
        const newLinkRef = doc(collection(db, `hotels/${hotelId}/bookingLinks`));
        const now = new Date();
        
        const prefill: BookingPrefill = {
            roomType: newBooking.rooms[0]?.roomType || 'Standard',
            checkIn: newBooking.checkIn,
            checkOut: newBooking.checkOut,
            priceTotal: newBooking.priceTotal,
            bookingId: newBookingRef.id,
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
            priceTotal: validatedData.priceTotal,
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
                if (data[key] instanceof Timestamp) {
                    serializableData[key] = data[key].toDate().toISOString();
                } else {
                    serializableData[key] = data[key];
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
            if (data[key] instanceof Timestamp) {
                serializableData[key] = data[key].toDate().toISOString();
            } else {
                serializableData[key] = data[key];
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
 * Deletes a booking from a hotel's sub-collection.
 */
export async function deleteBooking({ bookingId, hotelId }: { bookingId: string, hotelId: string }): Promise<{ success: boolean, error?: string }> {
     if (!hotelId || !bookingId) {
        return { success: false, error: "Hotel ID and Booking ID are required." };
    }
    try {
        const batch = writeBatch(db);
        const bookingRef = doc(db, `hotels/${hotelId}/bookings`, bookingId);
        batch.delete(bookingRef);
        
        // Also delete the associated booking link if it exists
        const linkQuery = query(collection(db, `hotels/${hotelId}/bookingLinks`), where("bookingId", "==", bookingId), limit(1));
        const linkSnapshot = await getDocs(linkQuery);
        if (!linkSnapshot.empty) {
            const linkDocRef = linkSnapshot.docs[0].ref;
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
 * This function uses a collection group query to find the link across all hotels.
 */
export async function getBookingLinkDetails(linkId: string): Promise<{ success: boolean, data?: (BookingLink & { hotelName: string }), error?: string }> {
  if (!linkId) return { success: false, error: "Link ID is required." };
  
  try {
    const linksCollectionGroup = collectionGroup(db, 'bookingLinks');
    const q = query(linksCollectionGroup, where(doc(collectionGroup(db, 'bookingLinks'), linkId).id, '==', linkId), limit(1));

    let linkDoc;
    // This is a workaround for development environments where collection group queries
    // can be slow to index. In production, the first branch should almost always work.
    
    // The collectionGroup query seems to have issues in some emulated environments.
    // A more robust, albeit less efficient, fallback is to iterate.
    // This should only be hit if the collection group index is not yet ready.
    const hotelsSnapshot = await getDocs(collection(db, 'hotels'));
    for (const hotelDoc of hotelsSnapshot.docs) {
        const potentialLinkRef = doc(db, `hotels/${hotelDoc.id}/bookingLinks`, linkId);
        const potentialLinkSnap = await getDoc(potentialLinkRef);
        if (potentialLinkSnap.exists()) {
            linkDoc = potentialLinkSnap;
            break;
        }
    }


    if (!linkDoc || !linkDoc.exists()) {
      return { success: false, error: "Link not found." };
    }
    
    const linkData = { id: linkDoc.id, ...linkDoc.data() } as BookingLink;
    
    // The hotelId is in the link data, so we can directly fetch the hotel.
    const hotelDocRef = doc(db, 'hotels', linkData.hotelId);
    const hotelSnap = await getDoc(hotelDocRef);

    if (!hotelSnap.exists()) {
        return { success: false, error: "Associated hotel not found." };
    }

    const hotelName = hotelSnap.data().name || 'Hotel';
    
    // Convert Timestamps to ISO strings for client-side serialization
    const serializableLinkData = {
        ...linkData,
        createdAt: (linkData.createdAt as Timestamp).toDate().toISOString(),
        expiresAt: (linkData.expiresAt as Timestamp).toDate().toISOString(),
        hotelName,
    };
    
    return { success: true, data: serializableLinkData as any };

  } catch (error) {
    console.error("Error fetching link details:", error);
    const e = error as Error;
    return { success: false, error: e.message };
  }
}
