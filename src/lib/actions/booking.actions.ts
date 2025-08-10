
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, writeBatch, query, where, Timestamp, orderBy, deleteDoc, collectionGroup, limit } from 'firebase/firestore';
import { z } from 'zod';
import type { Booking, BookingLink, BookingPrefill, RoomDetails, BookingFormValues } from '@/lib/definitions';
import { addDays } from 'date-fns';

// Schema for booking creation form - This runs on the server!
const roomSchema = z.object({
  roomType: z.string({ required_error: "Zimmertyp ist erforderlich." }),
  adults: z.coerce.number({invalid_type_error: "Anzahl Erwachsene muss eine Zahl sein."}).int().min(0, "Anzahl Erwachsene darf nicht negativ sein."),
  children: z.coerce.number({invalid_type_error: "Anzahl Kinder muss eine Zahl sein."}).int().min(0).optional(),
  infants: z.coerce.number({invalid_type_error: "Anzahl Kleinkinder muss eine Zahl sein."}).int().min(0).optional(),
  childrenAges: z.array(z.number()).optional(),
});

const bookingFormSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  checkInDate: z.date({ required_error: "Anreisedatum ist erforderlich." }),
  checkOutDate: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  verpflegungsart: z.string(),
  price: z.coerce.number(),
  guestLanguage: z.string(),
  rooms: z.array(roomSchema),
  interneBemerkungen: z.string().optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Abreisedatum muss nach dem Anreisedatum liegen.",
  path: ["checkOutDate"],
});


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
        return { success: false, error: `Validation failed: ${validation.error.message}` };
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
            boardType: validatedData.verpflegungsart,
            priceTotal: validatedData.price,
            internalNotes: validatedData.interneBemerkungen,
            guestLanguage: validatedData.guestLanguage,
            rooms: validatedData.rooms.map((r) => ({
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
            boardType: validatedData.verpflegungsart,
            priceTotal: validatedData.price,
            internalNotes: validatedData.interneBemerkungen,
            guestLanguage: validatedData.guestLanguage,
            rooms: validatedData.rooms.map((r) => ({
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
            return { 
                id: doc.id,
                ...data,
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
        
        const booking = { id: snapshot.id, ...snapshot.data() } as Booking;
        
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
 */
export async function getBookingLinkDetails(linkId: string): Promise<{ success: boolean, data?: (BookingLink & { hotelName: string }), error?: string }> {
  if (!linkId) return { success: false, error: "Link ID is required." };
  
  try {
    const linksCollectionGroup = collectionGroup(db, 'bookingLinks');
    const q = query(linksCollectionGroup, where(documentId(), '==', linkId), limit(1));
    const querySnapshot = await getDocs(q);

    let linkDoc;
    if (querySnapshot.empty) {
        // Fallback for environments where collection group queries might be slow to index
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
    const e = error as Error;
    if (e.message.includes("documentId")) { // A more specific check
        return { success: false, error: "Could not perform lookup for the link. The query is invalid." };
    }
    return { success: false, error: e.message };
  }
}
// Helper function to get documentId, as it's not directly available in web SDK
const documentId = () => {
    return '__name__';
};
