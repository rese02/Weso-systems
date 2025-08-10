
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
        const errorMessage = Object.values(validation.error.flatten().fieldErrors).map(e => e.join(', ')).join('; ');
        return { success: false, error: errorMessage || "Validation failed." };
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
        // Remove orderby from query to prevent crashes if createdAt is missing
        const q = query(hotelsCollectionRef);
        const querySnapshot = await getDocs(q);
        const hotels = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as Hotel));

        // Sort in code to handle documents without createdAt gracefully
        hotels.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });
        
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
        // In a real app, you should also delete subcollections and related storage files.
        // This is a simplified deletion for now.
        await deleteDoc(doc(db, 'hotels', hotelId));
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
