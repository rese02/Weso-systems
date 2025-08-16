
'use server';

import { dbAdmin as db, authAdmin } from '@/lib/firebase-admin';
import { storage } from '@/lib/firebase.client';
import { Timestamp } from 'firebase-admin/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import type { Hotel } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const HotelSchema = z.object({
  name: z.string().min(1, 'Hotelname ist erforderlich.'),
  ownerEmail: z.string().email('Ungültige E-Mail-Adresse.'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein.'),
  domain: z.string().min(1, 'Domain ist erforderlich.'),
  logoUrl: z.string().url('Ungültige Logo-URL.').optional().or(z.literal('')),
  // Public Contact Details
  contactEmail: z.string().email('Ungültige Kontakt E-Mail-Adresse.').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
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
    hotelData: Omit<Hotel, 'id' | 'createdAt' | 'agencyId'> & { password?: string }
): Promise<{ success: boolean; hotelId?: string; error?: string }> {
    const validation = HotelSchema.safeParse(hotelData);
    if (!validation.success) {
        const errorMessage = Object.values(validation.error.flatten().fieldErrors).map(e => e.join(', ')).join('; ');
        return { success: false, error: errorMessage || "Validierung fehlgeschlagen." };
    }
    
    const { password, ...firestoreData } = validation.data;

    try {
        // Create Firebase Auth user for the hotelier
        const hotelUser = await authAdmin.createUser({
            email: firestoreData.ownerEmail,
            password: password,
            displayName: firestoreData.name,
        });

        // Create the hotel document in Firestore first to get an ID
        const hotelsCollectionRef = db.collection('hotels');
        const docRef = await hotelsCollectionRef.add({ 
            ...firestoreData, 
            agencyId: 'agency_weso_systems', // Simulated static agency ID
            ownerUid: hotelUser.uid, // Link to the Auth user
            createdAt: Timestamp.now(),
        });
        
        // Set custom claims for the new hotelier user, now including the hotelId
        await authAdmin.setCustomUserClaims(hotelUser.uid, { role: 'hotelier', hotelId: docRef.id });

        revalidatePath('/admin');
        return { success: true, hotelId: docRef.id };
    } catch (error) {
        console.error("Error creating hotel:", error);
        return { success: false, error: (error as Error).message };
    }
}


export async function getHotels(): Promise<{ hotels?: Hotel[]; error?: string }> {
    try {
        const hotelsCollectionRef = db.collection('hotels');
        // Simplified query to avoid needing a composite index. Filtering will be done client-side.
        const q = hotelsCollectionRef.orderBy("createdAt", "desc");
        const querySnapshot = await q.get();
        
        const hotels = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                ownerEmail: data.ownerEmail,
                domain: data.domain,
                agencyId: data.agencyId,
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
    
    const hotelDocRef = db.doc(`hotels/${hotelId}`);
    const hotelDocToDelete = await hotelDocRef.get();
    if (!hotelDocToDelete.exists) {
        return { success: false, error: "Hotel not found." };
    }

    const hotelData = hotelDocToDelete.data() as Hotel;

    try {
        const batch = db.batch();

        const bookingsCollectionRef = db.collection(`hotels/${hotelId}/bookings`);
        const bookingsSnapshot = await bookingsCollectionRef.get();
        for (const bookingDoc of bookingsSnapshot.docs) {
            const storageFolderRef = ref(storage, `hotels/${hotelId}/bookings/${bookingDoc.id}`);
            const res = await listAll(storageFolderRef);
            await Promise.all(res.items.map((itemRef) => deleteObject(itemRef)));
            batch.delete(bookingDoc.ref);
        }

        const linksCollectionRef = db.collection(`hotels/${hotelId}/bookingLinks`);
        const linksSnapshot = await linksCollectionRef.get();
        linksSnapshot.forEach(linkDoc => {
            batch.delete(linkDoc.ref);
        });
        
        await batch.commit();

        await hotelDocRef.delete();
        
        if (hotelData.ownerUid) {
            await authAdmin.deleteUser(hotelData.ownerUid);
        }


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
        const hotelRef = db.doc(`hotels/${hotelId}`);
        const snapshot = await hotelRef.get();

        if (!snapshot.exists) {
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

export async function getHotelByOwnerEmail(email: string): Promise<{ success: boolean; hotelId?: string; error?: string }> {
    if (!email) {
        return { success: false, error: 'E-Mail ist erforderlich.' };
    }
    try {
        const q = db.collection('hotels').where('ownerEmail', '==', email).limit(1);
        const querySnapshot = await q.get();
        if (querySnapshot.empty) {
            return { success: false, error: 'Kein Hotel mit dieser E-Mail-Adresse gefunden.' };
        }
        const hotelDoc = querySnapshot.docs[0];
        return { success: true, hotelId: hotelDoc.id };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}


const SettingsSchema = z.object({
    name: z.string().min(1, 'Hotelname ist erforderlich.'),
    domain: z.string().min(1, 'Domain ist erforderlich.'),
    ownerEmail: z.string().email('Ungültige E-Mail-Adresse.'),
    logoUrl: z.string().url('Ungültige Logo-URL.').optional().or(z.literal('')),
    // Public Contact Details
    contactEmail: z.string().email('Ungültige Kontakt E-Mail-Adresse.').optional().or(z.literal('')),
    contactPhone: z.string().optional().nullable(),
    contactAddress: z.string().optional().nullable(),
    // Booking Configurations
    boardTypes: z.array(z.string()).optional(),
    roomCategories: z.array(z.string()).optional(),
    // Bank Details
    bankAccountHolder: z.string().optional().nullable(),
    bankIBAN: z.string().optional().nullable(),
    bankBIC: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    // SMTP Settings
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
        const hotelRef = db.doc(`hotels/${hotelId}`);
        await hotelRef.update(validation.data);
        revalidatePath(`/dashboard/${hotelId}/settings`);
        revalidatePath(`/dashboard/${hotelId}`);

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }

}
