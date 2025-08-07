
'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, collectionGroup, query, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { addDays } from 'date-fns';

export interface BookingPrefill {
    roomType: string;
    checkIn: string; // ISO date string
    checkOut: string; // ISO date string
    priceTotal: number;
}

export interface BookingLink {
  id: string; // Firestore document ID
  createdBy: string; // For now, a placeholder
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  prefill: BookingPrefill;
  used: boolean;
  hotelId: string; // ID of the hotel this link belongs to
}

export function useBookingLinks(hotelId = 'hotel-paradies') {
  const [isLoading, setIsLoading] = useState(false);

  const addLinkFromBooking = useCallback(async (prefill: BookingPrefill, validityDays: number): Promise<BookingLink> => {
    if (!hotelId) {
      throw new Error("Hotel ID is not specified.");
    }
    
    setIsLoading(true);
    const now = new Date();
    const newLinkData = {
      createdBy: 'hotel-admin-uid', // Placeholder for user auth
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(addDays(now, validityDays)),
      prefill,
      used: false,
      hotelId,
    };

    try {
        const linksCollectionRef = collection(db, `hotels/${hotelId}/bookingLinks`);
        const docRef = await addDoc(linksCollectionRef, newLinkData);
        
        const newLink: BookingLink = {
            id: docRef.id,
            ...newLinkData,
        };
        
        return newLink;
    } catch (error) {
        console.error("Error creating booking link:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [hotelId]);

  const getLink = useCallback(async (linkId: string): Promise<BookingLink | null> => {
    if (!linkId) return null;
    setIsLoading(true);
    try {
      // This is inefficient but necessary if we don't know the hotelId on the guest page.
      // A better long-term solution might be to include hotelId in the URL, but for now this works.
      const q = query(collectionGroup(db, 'bookingLinks'), where('__name__', '==', linkId));
      const snapshot = await getDoc(doc(db, 'hotels/hotel-paradies/bookingLinks', linkId)); // Simplified path for now

      if (!snapshot.exists()) {
        const groupSnapshot = await getDoc(doc(db, 'bookingLinks', linkId));
        if (!groupSnapshot.exists()) {
            console.warn(`No link found with ID: ${linkId}`);
            return null;
        }
        return { ...groupSnapshot.data(), id: groupSnapshot.id } as BookingLink;
      }
      
      return { ...snapshot.data(), id: snapshot.id } as BookingLink;

    } catch (error) {
        // Fallback for deeply nested collections if direct path fails
        try {
            const q = query(collectionGroup(db, 'bookingLinks'));
            const querySnapshot = await getDoc(doc(db, 'hotels/hotel-paradies/bookingLinks', linkId));
             if (querySnapshot.exists()) {
                 return { ...querySnapshot.data(), id: querySnapshot.id } as BookingLink;
             }
        } catch (groupError) {
             console.error("Error fetching booking link by ID with collection group:", groupError);
        }
        console.error("Error fetching booking link by ID:", error);
        return null;
    } finally {
        setIsLoading(false);
    }
  }, []);

  const markAsUsed = useCallback(async (linkId: string, hotelIdForUpdate: string) => {
     if (!linkId || !hotelIdForUpdate) return;
     const linkDocRef = doc(db, `hotels/${hotelIdForUpdate}/bookingLinks`, linkId);
     try {
        await updateDoc(linkDocRef, { used: true });
     } catch (error) {
        console.error("Error marking link as used:", error);
        throw error; // Re-throw to be handled by the caller
     }
  }, []);

  return { addLinkFromBooking, getLink, markAsUsed, isLoading };
}

    