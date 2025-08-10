
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
    const validation = HotelSchema.safeParse(hotelData);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten().fieldErrors.toString() };
    }
    
    try {
        const hotelsCollectionRef = collection(db, 'hotels');
        const docRef = await addDoc(hotelsCollectionRef, { ...validation.data, createdAt: Timestamp.now() });
        revalidatePath('/admin');
        return { success: true, hotelId: docRef.id };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}


export async function getHotels(): Promise<{ hotels?: Hotel[]; error?: string }> {
    try {
        const hotelsCollectionRef = collection(db, 'hotels');
        const q = query(hotelsCollectionRef, orderBy('createdAt', 'desc'));
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
