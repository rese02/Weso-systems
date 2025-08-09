
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, Timestamp, addDoc, updateDoc } from 'firebase/firestore';

export interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  checkIn: string; // ISO String
  checkOut: string; // ISO string
  roomType: string;
  priceTotal: number;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Open' | 'Partial Payment' | 'Submitted';
  createdAt: Timestamp;
  submittedAt?: Timestamp;
  documents?: {
    idDoc?: string;
    paymentProof?: string;
  };
  bookingLinkId?: string;
  hotelId: string;
}

export function useBookings(hotelId: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) {
      setIsLoading(false);
      setBookings([]);
      console.warn("useBookings: hotelId is not provided.");
      return;
    }

    setIsLoading(true);
    const bookingsCollectionRef = collection(db, `hotels/${hotelId}/bookings`);
    const q = query(bookingsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Booking));
      setBookings(bookingsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching real-time bookings:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [hotelId]);

  const addBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'hotelId'>) => {
    if (!hotelId) {
      throw new Error("Hotel ID is not specified.");
    }

    try {
      const bookingsCollectionRef = collection(db, `hotels/${hotelId}/bookings`);
      
      const newBookingData = {
        ...bookingData,
        createdAt: Timestamp.now(),
        hotelId: hotelId,
      };

      const docRef = await addDoc(bookingsCollectionRef, newBookingData);
      return { id: docRef.id, ...newBookingData } as Booking;

    } catch (error) {
      console.error("Error adding booking to Firestore:", error);
      throw error;
    }
  }, [hotelId]);


  const removeBooking = useCallback(async (bookingId: string) => {
    if (!hotelId) {
      throw new Error("Hotel ID is not specified.");
    }
    const bookingDoc = doc(db, `hotels/${hotelId}/bookings`, bookingId);
    try {
        await deleteDoc(bookingDoc);
    } catch (error) {
        console.error("Error deleting booking from Firestore:", error);
        throw error;
    }
  }, [hotelId]);

  const updateBooking = useCallback(async (bookingId: string, data: Partial<Booking>) => {
    if (!hotelId) {
        throw new Error("Hotel ID is not specified.");
    }
    const bookingDoc = doc(db, `hotels/${hotelId}/bookings`, bookingId);
    try {
        await updateDoc(bookingDoc, data);
    } catch (error) {
        console.error("Error updating booking in Firestore:", error);
        throw error;
    }
  }, [hotelId]);

  return { bookings, isLoading, removeBooking, addBooking, updateBooking };
}
