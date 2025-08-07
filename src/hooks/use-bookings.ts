
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, Timestamp, addDoc } from 'firebase/firestore';

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

  // This effect sets up the real-time listener
  useEffect(() => {
    if (!hotelId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const bookingsCollectionRef = collection(db, `hotels/${hotelId}/bookings`);
    const q = query(bookingsCollectionRef, orderBy('createdAt', 'desc'));

    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Booking));
      setBookings(bookingsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching real-time bookings:", error);
      setIsLoading(false);
    });

    // Cleanup: unsubscribe when the component unmounts or hotelId changes
    return () => unsubscribe();
  }, [hotelId]);

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
      // No need to manually update state, onSnapshot will do it automatically
    } catch (error) {
      console.error("Error adding booking to Firestore:", error);
      throw error;
    }
  }, [hotelId]);


  const removeBooking = useCallback(async (bookingId: string) => {
    const bookingDoc = doc(db, `hotels/${hotelId}/bookings`, bookingId);
    try {
        await deleteDoc(bookingDoc);
        // No need to manually update state, onSnapshot will do it automatically
    } catch (error) {
        console.error("Error deleting booking from Firestore:", error);
        throw error;
    }
  }, [hotelId]);

  // The getBookings function is no longer needed as data is fetched in real-time.
  // We keep the export object consistent for now.
  const getBookings = useCallback(async () => {
    // This function can be left empty or removed if not used elsewhere.
    // The real-time listener in useEffect is now responsible for fetching.
    console.warn("getBookings is deprecated in favor of the real-time listener.");
  }, []);

  return { bookings, isLoading, removeBooking, getBookings, addBooking };
}
