
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, Timestamp, getDoc } from 'firebase/firestore';
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


export async function getHotels(): Promise<{ hotels?: any[]; error?: string }> {
    try {
        const hotelsCollectionRef = collection(db, 'hotels');
        const q = query(hotelsCollectionRef);
        const querySnapshot = await getDocs(q);
        
        const hotels = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                // Convert Timestamp to a serializable format (ISO string)
                createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : null,
            };
        });

        // Sort in code to handle documents without createdAt gracefully
        hotels.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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


export async function getHotelById(hotelId: string): Promise<{ hotel?: Hotel, error?: string }> {
    if (!hotelId) return { error: "Hotel ID is required." };
    try {
        const hotelRef = doc(db, 'hotels', hotelId);
        const snapshot = await getDoc(hotelRef);

        if (!snapshot.exists()) {
            return { error: "Hotel not found." };
        }

        const data = snapshot.data();
        const hotel = { 
            id: snapshot.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
        } as Hotel;

        return { hotel };
    } catch (error) {
        console.error("Error fetching hotel by ID:", error);
        return { error: (error as Error).message };
    }
}
