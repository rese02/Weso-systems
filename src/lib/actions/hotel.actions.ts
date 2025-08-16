
'use server';

import { dbAdmin, authAdmin, storageAdmin } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
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
        const hotelsCollectionRef = dbAdmin.collection('hotels');
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
        const hotelsCollectionRef = dbAdmin.collection('hotels');
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
    
    const hotelDocRef = dbAdmin.doc(`hotels/${hotelId}`);
    const hotelDocToDelete = await hotelDocRef.get();
    if (!hotelDocToDelete.exists) {
        return { success: false, error: "Hotel not found." };
    }

    const hotelData = hotelDocToDelete.data() as Hotel;

    try {
        const batch = dbAdmin.batch();

        // --- Delete all sub-collections (bookings, bookingLinks) ---
        const bookingsCollectionRef = dbAdmin.collection(`hotels/${hotelId}/bookings`);
        const bookingsSnapshot = await bookingsCollectionRef.get();
        bookingsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        const linksCollectionRef = dbAdmin.collection(`hotels/${hotelId}/bookingLinks`);
        const linksSnapshot = await linksCollectionRef.get();
        linksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Commit the batch deletion of Firestore documents
        await batch.commit();
        
        // --- Delete associated files from Firebase Storage ---
        const bucket = storageAdmin.bucket();
        const hotelStoragePath = `hotels/${hotelId}/`;
        await bucket.deleteFiles({ prefix: hotelStoragePath });
        
        // --- Delete the main hotel document ---
        await hotelDocRef.delete();
        
        // --- Delete the Firebase Auth user ---
        if (hotelData.ownerUid) {
            try {
                await authAdmin.deleteUser(hotelData.ownerUid);
            } catch (authError: any) {
                // It's possible the user was already deleted, so we don't want this to fail the whole operation.
                if (authError.code !== 'auth/user-not-found') {
                    throw authError;
                }
                console.warn(`Auth user with UID ${hotelData.ownerUid} not found. May have been deleted previously.`);
            }
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
        const hotelRef = dbAdmin.doc(`hotels/${hotelId}`);
        const snapshot = await hotelRef.get();

        if (!snapshot.exists) {
            return { error: "Hotel nicht gefunden." };
        }

        const data = snapshot.data();
        const hotel = { 
            id: snapshot.id, 
            ...data,
            createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
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
        const q = dbAdmin.collection('hotels').where('ownerEmail', '==', email).limit(1);
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
        const hotelRef = dbAdmin.doc(`hotels/${hotelId}`);
        await hotelRef.update(validation.data);
        revalidatePath(`/dashboard/${hotelId}/settings`);
        revalidatePath(`/dashboard/${hotelId}`);

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }

}
