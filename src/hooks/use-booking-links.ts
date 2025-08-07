
'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, collectionGroup, query, where, getDocs, limit } from 'firebase/firestore';
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
  bookingId?: string; // ID of the booking this link is associated with
}

export function useBookingLinks(hotelId = 'hotel-paradies') {
  const [isLoading, setIsLoading] = useState(false);

  const addLinkFromBooking = useCallback(async (prefill: BookingPrefill, validityDays: number, bookingId: string): Promise<BookingLink> => {
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
      bookingId,
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
      // Use collectionGroup to search across all `bookingLinks` sub-collections.
      // This is necessary because on the guest page, we only have the linkId.
      const q = query(collectionGroup(db, 'bookingLinks'), where('__name__', '==', linkId), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`No link found with ID: ${linkId}`);
        return null;
      }
      
      const linkDoc = querySnapshot.docs[0];
      return { id: linkDoc.id, ...linkDoc.data() } as BookingLink;

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
        await updateDoc(linkDocRef, { used: true });
     } catch (error) {
        console.error("Error marking link as used:", error);
        throw error; // Re-throw to be handled by the caller
     }
  }, []);

  return { addLinkFromBooking, getLink, markAsUsed, isLoading };
}

    
