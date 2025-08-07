
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, addDoc } from 'firebase/firestore';

export interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  checkIn: string; // ISO String
  checkOut: string; // ISO string
  roomType: string;
  priceTotal: number;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Open' | 'Partial Payment';
  createdAt: Timestamp;
  documents?: {
    idDoc?: string;
    paymentProof?: string;
  };
  bookingLinkId: string;
  hotelId: string;
}

export function useBookings(hotelId = 'hotel-paradies') { // Default for now
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getBookings = useCallback(async () => {
    if (!hotelId) return;
    setIsLoading(true);
    try {
        const bookingsCollectionRef = collection(db, `hotels/${hotelId}/bookings`);
        const q = query(bookingsCollectionRef, orderBy('createdAt', 'desc'));
        const data = await getDocs(q);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as Booking));
        setBookings(filteredData);
    } catch (error) {
        console.error("Error fetching bookings from Firestore:", error);
    } finally {
        setIsLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if(hotelId) {
      getBookings();
    }
  }, [getBookings, hotelId]);

  const addBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'hotelId' | 'bookingLinkId'>) => {
    if (!hotelId) {
      throw new Error("Hotel ID is not specified.");
    }

    try {
      const bookingsCollectionRef = collection(db, `hotels/${hotelId}/bookings`);
      await addDoc(bookingsCollectionRef, {
        ...bookingData,
        createdAt: Timestamp.now(),
        hotelId: hotelId,
        bookingLinkId: '', // No link when created directly
      });
      // No need to call getBookings() here, the page will redirect and re-mount, triggering useEffect
    } catch (error) {
      console.error("Error adding booking to Firestore:", error);
      throw error;
    }
  }, [hotelId]);


  const removeBooking = useCallback(async (bookingId: string) => {
    const bookingDoc = doc(db, `hotels/${hotelId}/bookings`, bookingId);
    try {
        await deleteDoc(bookingDoc);
        setBookings(prev => prev.filter(b => b.id !== bookingId)); // Optimistic update
    } catch (error) {
        console.error("Error deleting booking from Firestore:", error);
        getBookings(); // Re-fetch if error
        throw error;
    }
  }, [hotelId, getBookings]);

  return { bookings, isLoading, removeBooking, getBookings, addBooking };
}

    