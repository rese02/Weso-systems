
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, Timestamp, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import type { Hotel } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';


const HotelSchema = z.object({
  name: z.string().min(1, 'Hotelname ist erforderlich.'),
  ownerEmail: z.string().email('Ungültige E-Mail-Adresse.'),
  domain: z.string().min(1, 'Domain ist erforderlich.'),
});

export async function createHotel(
    hotelData: Omit<Hotel, 'id' | 'createdAt'>
): Promise<{ success: boolean; hotelId?: string; error?: string }> {
    const validation = HotelSchema.safeParse(hotelData);
    if (!validation.success) {
        const errorMessage = Object.values(validation.error.flatten().fieldErrors).map(e => e.join(', ')).join('; ');
        return { success: false, error: errorMessage || "Validierung fehlgeschlagen." };
    }
    
    try {
        const hotelsCollectionRef = collection(db, 'hotels');
        const docRef = await addDoc(hotelsCollectionRef, { 
            ...validation.data, 
            createdAt: Timestamp.now(),
            boardTypes: ['Frühstück', 'Halbpension', 'Vollpension'],
            roomCategories: ['Einzelzimmer', 'Doppelzimmer', 'Suite']
        });
        revalidatePath('/admin');
        return { success: true, hotelId: docRef.id };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}


export async function getHotels(): Promise<{ hotels?: Hotel[]; error?: string }> {
    try {
        const hotelsCollectionRef = collection(db, 'hotels');
        const q = query(hotelsCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const hotels = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                ownerEmail: data.ownerEmail,
                domain: data.domain,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
            } as Hotel;
        });
        
        return { hotels };
    } catch (error) {
        console.error("Fehler beim Abrufen der Hotels:", error);
        return { error: (error as Error).message };
    }
}


export async function deleteHotel(hotelId: string): Promise<{ success: boolean; error?: string }> {
    if (!hotelId) {
        return { success: false, error: 'Hotel-ID ist erforderlich.' };
    }
    try {
        await deleteDoc(doc(db, 'hotels', hotelId));
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}


export async function getHotelById(hotelId: string): Promise<{ hotel?: any, error?: string }> {
    if (!hotelId) return { error: "Hotel-ID ist erforderlich." };
    try {
        const hotelRef = doc(db, 'hotels', hotelId);
        const snapshot = await getDoc(hotelRef);

        if (!snapshot.exists()) {
            return { error: "Hotel nicht gefunden." };
        }

        const data = snapshot.data();
        const hotel = { 
            id: snapshot.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
        };

        return { hotel };
    } catch (error) {
        console.error("Fehler beim Abrufen des Hotels nach ID:", error);
        return { error: (error as Error).message };
    }
}

const SettingsSchema = z.object({
    name: z.string().min(1, 'Hotelname ist erforderlich.'),
    boardTypes: z.array(z.string()).optional(),
    roomCategories: z.array(z.string()).optional(),
});

export async function updateHotelSettings(hotelId: string, settings: any): Promise<{success: boolean, error?: string}> {
    if(!hotelId) return { success: false, error: 'Hotel-ID ist erforderlich.'};

    const validation = SettingsSchema.safeParse(settings);
    if (!validation.success) {
        return { success: false, error: 'Validierung fehlgeschlagen.' };
    }

    try {
        const hotelRef = doc(db, 'hotels', hotelId);
        await updateDoc(hotelRef, validation.data);
        revalidatePath(`/dashboard/${hotelId}/settings`);
        revalidatePath(`/dashboard/${hotelId}`);

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }

}
