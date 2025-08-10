
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, writeBatch, query, where, Timestamp, orderBy, deleteDoc, collectionGroup, limit } from 'firebase/firestore';
import { z } from 'zod';
import type { Booking, BookingLink, BookingPrefill, RoomDetails } from '@/lib/definitions';
import { addDays } from 'date-fns';

// Schema for booking creation form
const BookingFormSchema = z.object({
  guestFirstName: z.string().min(1),
  guestLastName: z.string().min(1),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  verpflegungsart: z.string(),
  price: z.number(),
  guestLanguage: z.string(),
  rooms: z.array(z.object({
    roomType: z.string(),
    adults: z.number().int(),
    children: z.number().int().optional(),
    infants: z.number().int().optional(),
    childrenAges: z.array(z.number()).optional(),
  })),
  interneBemerkungen: z.string().optional(),
});

type BookingFormValues = z.infer<typeof BookingFormSchema>;

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

    const batch = writeBatch(db);

    try {
        // 1. Create the new booking document
        const newBookingRef = doc(collection(db, `hotels/${hotelId}/bookings`));
        
        const newBooking: Omit<Booking, 'id'> = {
            hotelId,
            status: 'Sent', // 'Sent' because we are creating a link right away
            createdAt: Timestamp.now(),
            firstName: bookingData.guestFirstName,
            lastName: bookingData.guestLastName,
            checkIn: bookingData.checkInDate.toISOString(),
            checkOut: bookingData.checkOutDate.toISOString(),
            boardType: bookingData.verpflegungsart,
            priceTotal: bookingData.price,
            internalNotes: bookingData.interneBemerkungen,
            guestLanguage: bookingData.guestLanguage,
            rooms: bookingData.rooms.map(r => ({
                roomType: r.roomType,
                adults: r.adults,
                children: r.children || 0,
                infants: r.infants || 0,
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

    try {
        const bookingRef = doc(db, `hotels/${hotelId}/bookings`, bookingId);

        const updatedBookingData = {
            firstName: bookingData.guestFirstName,
            lastName: bookingData.guestLastName,
            checkIn: bookingData.checkInDate.toISOString(),
            checkOut: bookingData.checkOutDate.toISOString(),
            boardType: bookingData.verpflegungsart,
            priceTotal: bookingData.price,
            internalNotes: bookingData.interneBemerkungen,
            guestLanguage: bookingData.guestLanguage,
            rooms: bookingData.rooms.map(r => ({
                roomType: r.roomType,
                adults: r.adults,
                children: r.children || 0,
                infants: r.infants || 0,
                childrenAges: r.childrenAges || [],
            })),
            updatedAt: Timestamp.now(), // Add an update timestamp
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
            // Ensure createdAt and updatedAt are Timestamps for consistent sorting later
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : new Timestamp(0, 0);
            const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt : createdAt;

            return { id: doc.id, ...data, createdAt, updatedAt } as Booking;
        });
        
        return { success: true, bookings };
    } catch (error) {
        console.error("Error fetching bookings:", error);
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
        const bookingRef = doc(db, `hotels/${hotelId}/bookings`, bookingId);
        await deleteDoc(bookingRef);
        
        const linkQuery = query(collection(db, `hotels/${hotelId}/bookingLinks`), where("bookingId", "==", bookingId));
        const linkSnapshot = await getDocs(linkQuery);
        if (!linkSnapshot.empty) {
            const linkDocRef = linkSnapshot.docs[0].ref;
            await deleteDoc(linkDocRef);
        }

        return { success: true };
    } catch (error) {
        console.error("Error deleting booking:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Fetches the details for a given booking link ID, including hotel name.
 */
export async function getBookingLinkDetails(linkId: string): Promise<{ success: boolean, data?: (BookingLink & { hotelName: string }), error?: string }> {
  if (!linkId) return { success: false, error: "Link ID is required." };
  
  try {
    const linksCollectionGroup = collectionGroup(db, 'bookingLinks');
    const q = query(linksCollectionGroup, where('__name__', '==', `/${linkId}`), limit(1));
    const querySnapshot = await getDocs(q);

    let linkDoc;
    if (querySnapshot.empty) {
        const hotelsSnapshot = await getDocs(collection(db, 'hotels'));
        for (const hotelDoc of hotelsSnapshot.docs) {
            const potentialLinkRef = doc(db, `hotels/${hotelDoc.id}/bookingLinks`, linkId);
            const potentialLinkSnap = await getDoc(potentialLinkRef);
            if (potentialLinkSnap.exists()) {
                linkDoc = potentialLinkSnap;
                break;
            }
        }
    } else {
        linkDoc = querySnapshot.docs[0];
    }

    if (!linkDoc || !linkDoc.exists()) {
      return { success: false, error: "Link not found." };
    }
    
    const linkData = { id: linkDoc.id, ...linkDoc.data() } as BookingLink;
    
    const hotelDocRef = doc(db, 'hotels', linkData.hotelId);
    const hotelSnap = await getDoc(hotelDocRef);

    if (!hotelSnap.exists()) {
        return { success: false, error: "Associated hotel not found." };
    }

    const hotelName = hotelSnap.data().name || 'Hotel';
    
    const serializableLinkData = {
        ...linkData,
        createdAt: (linkData.createdAt as Timestamp).toDate().toISOString(),
        expiresAt: (linkData.expiresAt as Timestamp).toDate().toISOString(),
        hotelName,
    };
    
    return { success: true, data: serializableLinkData as any };

  } catch (error) {
    console.error("Error fetching link details:", error);
    if (error instanceof Error && error.message.includes("Invalid query")) {
        return { success: false, error: "Could not perform lookup for the link. The query is invalid." };
    }
    return { success: false, error: (error as Error).message };
  }
}
