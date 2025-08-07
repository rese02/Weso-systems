
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
    if(hotelId) {
      getLinks();
    }
  }, [getLinks, hotelId]);

  const addLinkFromBooking = useCallback(async (prefill: BookingPrefill, validityDays: number): Promise<BookingLink> => {
    if (!hotelId) {
      throw new Error("Hotel ID is not specified.");
    }
    
    const now = new Date();
    const newLinkData = {
      createdBy: 'hotel-admin-uid', // Placeholder
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(addDays(now, validityDays)),
      prefill,
      used: false,
      hotelId,
    };

    try {
        const linksCollectionRef = collection(db, `hotels/${hotelId}/bookingLinks`);
        const docRef = await addDoc(linksCollectionRef, newLinkData);
        
        // Construct the link object to return, ensuring timestamps are handled correctly for the client
        const newLink: BookingLink = {
            ...newLinkData,
            id: docRef.id,
            createdAt: newLinkData.createdAt,
            expiresAt: newLinkData.expiresAt,
        };

        setLinks(prev => [newLink, ...prev]);
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
      // This is a bit of a workaround to find a document in a subcollection when you don't know the parent ID.
      // A better approach in a real large-scale app would be to have a root-level collection for links if needed,
      // but for this structure, collectionGroup is the way.
      const linksCollectionGroup = collectionGroup(db, 'bookingLinks');
      const q = query(linksCollectionGroup, where('__name__', '==', `hotels/${hotelId}/bookingLinks/${linkId}`));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Fallback for when the link is not for the current hotel, which happens on the public guest page.
        const allLinksQuery = query(collectionGroup(db, 'bookingLinks'));
        const allLinksSnapshot = await getDocs(allLinksQuery);
        const foundDoc = allLinksSnapshot.docs.find(doc => doc.id === linkId);
        
        if (!foundDoc) {
            console.log(`No link found with ID: ${linkId} in any hotel.`);
            return null;
        }
        return { ...foundDoc.data(), id: foundDoc.id } as BookingLink;
      }
      
      const doc = snapshot.docs[0];
      return { ...doc.data(), id: doc.id } as BookingLink;

    } catch (error) {
        console.error("Error fetching booking link by ID:", error);
        return null;
    } finally {
        setIsLoading(false);
    }
  }, [hotelId]);

  const markAsUsed = useCallback(async (linkId: string, hotelIdForUpdate: string) => {
     if (!linkId || !hotelIdForUpdate) return;
     const linkDocRef = doc(db, `hotels/${hotelIdForUpdate}/bookingLinks`, linkId);
     try {
        await updateDoc(linkDocRef, { used: true });
        setLinks(prev => prev.map(link => link.id === linkId ? { ...link, used: true } : link));
     } catch (error) {
        console.error("Error marking link as used:", error);
     }
  }, []);

  return { links, addLinkFromBooking, getLink, markAsUsed, isLoading };
}
