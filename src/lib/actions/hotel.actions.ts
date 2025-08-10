
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Hotel } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';


const HotelSchema = z.object({
  name: z.string().min(1, 'Hotel name is required.'),
  ownerEmail: z.string().email('Invalid email address.'),
  domain: z.string().min(1, 'Domain is required.'),
});

export async function createHotel(
    hotelData: Omit<Hotel, 'id' | 'createdAt'>
): Promise<{ success: boolean; hotelId?: string; error?: string }> {
    console.log("createHotel called with data:", hotelData); 
    const validation = HotelSchema.safeParse(hotelData);
    if (!validation.success) {
        const errorMessage = Object.values(validation.error.flatten().fieldErrors).map(e => e.join(', ')).join('; ');
        console.error("Validation failed:", errorMessage); 
        return { success: false, error: errorMessage || "Validation failed." };
    }
    
    try {
        const hotelsCollectionRef = collection(db, 'hotels');
        console.log("Attempting to add document to Firestore..."); 
        const docRef = await addDoc(hotelsCollectionRef, { ...validation.data, createdAt: Timestamp.now() });
        console.log("Document added with ID:", docRef.id); 
        revalidatePath('/admin');
        return { success: true, hotelId: docRef.id };
    } catch (error) {
        console.error("Error in createHotel:", error); 
        return { success: false, error: (error as Error).message };
    }
}


export async function getHotels(): Promise<{ hotels?: Hotel[]; error?: string }> {
    try {
        const hotelsCollectionRef = collection(db, 'hotels');
        // Removed orderBy to prevent crashes if some documents are missing the 'createdAt' field.
        const q = query(hotelsCollectionRef);
        const querySnapshot = await getDocs(q);
        const hotels = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as Hotel));
        return { hotels };
    } catch (error) {
        console.error("Error fetching hotels:", error);
        return { error: (error as Error).message };
    }
}


export async function deleteHotel(hotelId: string): Promise<{ success: boolean; error?: string }> {
    if (!hotelId) {
        return { success: false, error: 'Hotel ID is required.' };
    }
    try {
        // Note: In a real-world app, you must implement a Cloud Function to recursively
        // delete all sub-collections (bookings, bookingLinks, etc.) for this hotel.
        // Directly deleting a document from the client/server does NOT delete its sub-collections.
        await deleteDoc(doc(db, 'hotels', hotelId));
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
