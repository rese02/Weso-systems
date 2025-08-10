'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, collectionGroup, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { addDays } from 'date-fns';

// This is the data that will be pre-filled in the guest form.
// It's a subset of the main Booking interface.
export interface BookingPrefill {
    roomType: string;
    checkIn: string; // ISO date string
    checkOut: string; // ISO date string
    priceTotal: number;
    bookingId: string; // The ID of the booking document to be updated
}

// Corresponds to the Firestore data model /hotels/{hotelId}/bookingTokens/{tokenId}
export interface BookingLink {
  id: string; // Firestore document ID
  bookingId: string; // The ID of the booking this link belongs to
  hotelId: string; // The ID of the hotel this link belongs to
  
  createdBy: string; // For now, a placeholder for user UID
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: 'active' | 'used' | 'expired';

  prefill: BookingPrefill;
}

// This hook now requires the hotelId to work with the correct sub-collection.
export function useBookingLinks(hotelId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const addLinkFromBooking = useCallback(async (prefill: BookingPrefill, validityDays: number): Promise<BookingLink> => {
    if (!hotelId) {
      throw new Error("Hotel ID is not specified to create a booking link.");
    }
    
    setIsLoading(true);
    const now = new Date();
    const newLinkData: Omit<BookingLink, 'id'> = {
      bookingId: prefill.bookingId,
      hotelId: hotelId,
      createdBy: 'hotel-admin-uid', // Placeholder for user auth
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(addDays(now, validityDays)),
      status: 'active',
      prefill,
    };

    try {
        const linksCollectionRef = collection(db, `hotels/${hotelId}/bookingLinks`);
        const docRef = await addDoc(linksCollectionRef, newLinkData);
        
        return { id: docRef.id, ...newLinkData };
    } catch (error) {
        console.error("Error creating booking link:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [hotelId]);

  // This function can remain as is, since it needs to search across all hotels
  // for a given linkId/token. This is the only place we need a collectionGroup query.
  const getLink = useCallback(async (linkId: string): Promise<BookingLink | null> => {
    if (!linkId) return null;
    setIsLoading(true);
    try {
      const linksCollectionGroup = collectionGroup(db, 'bookingLinks');
      const q = query(linksCollectionGroup, where('__name__', '==', linkId), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`No link found with ID: ${linkId}`);
        return null;
      }
      
      const linkDoc = querySnapshot.docs[0];
      const linkData = { id: linkDoc.id, ...linkDoc.data() } as BookingLink;
      
      const bookingDocRef = doc(db, `hotels/${linkData.hotelId}/bookings`, linkData.bookingId);
      const bookingSnap = await getDoc(bookingDocRef);
      if (!bookingSnap.exists()) {
        console.error(`Booking with ID ${linkData.bookingId} not found for this link.`);
        return null;
      }

      return linkData;
    } catch (error) {
      console.error("Error fetching booking link by ID with collection group:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsUsed = useCallback(async (linkId: string, hotelIdForUpdate: string) => {
     if (!linkId || !hotelIdForUpdate) return;
     const linkDocRef = doc(db, `hotels/${hotelIdForUpdate}/bookingLinks`, linkId);
     try {
        await updateDoc(linkDocRef, { status: 'used' });
     } catch (error) {
        console.error("Error marking link as used:", error);
        throw error; // Re-throw to be handled by the caller
     }
  }, []);

  return { addLinkFromBooking, getLink, markAsUsed, isLoading };
}
