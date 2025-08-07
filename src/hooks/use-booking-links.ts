'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, query, where, limit } from 'firebase/firestore';
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

export function useBookingLinks(hotelId = 'hotel-paradies') { // Default for now
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLinks = useCallback(async () => {
    if (!hotelId) return;
    setIsLoading(true);
    try {
        const linksCollectionRef = collection(db, `hotels/${hotelId}/bookingLinks`);
        const q = query(linksCollectionRef);
        const data = await getDocs(q);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as BookingLink));
        setLinks(filteredData);
    } catch (error) {
        console.error("Error fetching booking links:", error);
    } finally {
        setIsLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    getLinks();
  }, [getLinks]);

  const addLinkFromBooking = useCallback(async (prefill: BookingPrefill, validityDays: number): Promise<BookingLink> => {
    const now = new Date();
    const newLinkData = {
      createdBy: 'hotel-admin-uid', // Placeholder
      createdAt: now,
      expiresAt: addDays(now, validityDays),
      prefill,
      used: false,
      hotelId,
    };

    try {
        const linksCollectionRef = collection(db, `hotels/${hotelId}/bookingLinks`);
        const docRef = await addDoc(linksCollectionRef, newLinkData);
        const newLink = { ...newLinkData, id: docRef.id };
        setLinks(prev => [newLink, ...prev]);
        return newLink;
    } catch (error) {
        console.error("Error creating booking link:", error);
        throw error;
    }
  }, [hotelId]);

  const getLink = useCallback(async (linkId: string): Promise<BookingLink | null> => {
    try {
      // Since we don't know the hotelId on the public page, we query the collection group
      const q = query(collection(db, 'bookingLinks'), where('__name__', '==', linkId), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { ...doc.data(), id: doc.id } as BookingLink;

    } catch (error) {
        console.error("Error fetching booking link:", error);
        return null;
    }
  }, []);

  const markAsUsed = useCallback(async (linkId: string, hotelId: string) => {
     if (!linkId || !hotelId) return;
     const linkDocRef = doc(db, `hotels/${hotelId}/bookingLinks`, linkId);
     try {
        await updateDoc(linkDocRef, { used: true });
        setLinks(prev => prev.map(link => link.id === linkId ? { ...link, used: true } : link));
     } catch (error) {
        console.error("Error marking link as used:", error);
     }
  }, []);

  return { links, addLinkFromBooking, getLink, markAsUsed, isLoading };
}
