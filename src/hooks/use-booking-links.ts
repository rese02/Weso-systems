
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, query, where, collectionGroup, Timestamp } from 'firebase/firestore';
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

// Default hotelId for demonstration purposes. In a real multi-tenant app, this would be dynamically set.
const DEFAULT_HOTEL_ID = 'hotel-paradies'; 

export function useBookingLinks(hotelId = DEFAULT_HOTEL_ID) {
  const [isLoading, setIsLoading] = useState(false);

  const addLinkFromBooking = useCallback(async (prefill: BookingPrefill, validityDays: number): Promise<BookingLink> => {
    if (!hotelId) {
      throw new Error("Hotel ID is not specified.");
    }
    
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
    }
  }, [hotelId]);

  const getLink = useCallback(async (linkId: string): Promise<BookingLink | null> => {
    if (!linkId) return null;
    setIsLoading(true);
    try {
      // Because we don't know the hotelId on the public guest page, we must search across all subcollections.
      const linksQuery = query(collectionGroup(db, 'bookingLinks'), where('__name__', '==', `*/${linkId}`));
      const snapshot = await getDocs(query(collectionGroup(db, 'bookingLinks')));
      
      const foundDoc = snapshot.docs.find(doc => doc.id === linkId);
      
      if (!foundDoc) {
        console.warn(`No link found with ID: ${linkId}`);
        return null;
      }
      
      return { ...foundDoc.data(), id: foundDoc.id } as BookingLink;

    } catch (error) {
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
