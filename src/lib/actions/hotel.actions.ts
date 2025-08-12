
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, Timestamp, getDoc, updateDoc, orderBy, writeBatch } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import type { Hotel } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';


const HotelSchema = z.object({
  name: z.string().min(1, 'Hotelname ist erforderlich.'),
  ownerEmail: z.string().email('Ungültige E-Mail-Adresse.'),
  domain: z.string().min(1, 'Domain ist erforderlich.'),
  // Bank details are optional
  bankAccountHolder: z.string().optional(),
  bankIBAN: z.string().optional(),
  bankBIC: z.string().optional(),
  bankName: z.string().optional(),
  // SMTP details are optional
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  // Booking configs
  boardTypes: z.array(z.string()).optional(),
  roomCategories: z.array(z.string()).optional(),
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
        const batch = writeBatch(db);

        // 1. Delete all bookings and their associated storage files
        const bookingsCollectionRef = collection(db, `hotels/${hotelId}/bookings`);
        const bookingsSnapshot = await getDocs(bookingsCollectionRef);
        for (const bookingDoc of bookingsSnapshot.docs) {
            // Delete associated files from Storage
            const storageFolderRef = ref(storage, `hotels/${hotelId}/bookings/${bookingDoc.id}`);
            const res = await listAll(storageFolderRef);
            await Promise.all(res.items.map((itemRef) => deleteObject(itemRef)));
             // Add booking doc to batch delete
            batch.delete(bookingDoc.ref);
        }

        // 2. Delete all booking links
        const linksCollectionRef = collection(db, `hotels/${hotelId}/bookingLinks`);
        const linksSnapshot = await getDocs(linksCollectionRef);
        linksSnapshot.forEach(linkDoc => {
            batch.delete(linkDoc.ref);
        });
        
        // 3. Commit the batch deletion of all subcollection documents
        await batch.commit();

        // 4. Delete the main hotel document
        await deleteDoc(doc(db, 'hotels', hotelId));

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Error deleting hotel and its data:", error);
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
    domain: z.string().min(1, 'Domain ist erforderlich.'),
    ownerEmail: z.string().email('Ungültige E-Mail-Adresse.'),
    boardTypes: z.array(z.string()).optional(),
    roomCategories: z.array(z.string()).optional(),
    bankAccountHolder: z.string().optional().nullable(),
    bankIBAN: z.string().optional().nullable(),
    bankBIC: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    smtpUser: z.string().optional().nullable(),
    smtpPass: z.string().optional().nullable(),
}).partial();

export async function updateHotelSettings(hotelId: string, settings: Partial<Hotel>): Promise<{success: boolean, error?: string}> {
    if(!hotelId) return { success: false, error: 'Hotel-ID ist erforderlich.'};

    const validation = SettingsSchema.safeParse(settings);
    if (!validation.success) {
        console.error("Validation failed", validation.error.flatten());
        return { success: false, error: 'Validierung fehlgeschlagen.' };
    }

    try {
        const hotelRef = doc(db, 'hotels', hotelId);
        // We only pass validated data to updateDoc
        await updateDoc(hotelRef, validation.data);
        revalidatePath(`/dashboard/${hotelId}/settings`);
        revalidatePath(`/dashboard/${hotelId}`);

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }

}
