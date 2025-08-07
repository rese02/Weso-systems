'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export interface Hotel {
  id: string;
  name: string;
  ownerEmail: string;
  domain: string;
  createdAt?: any; 
}

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hotelsCollectionRef = collection(db, 'hotels');

  const getHotels = useCallback(async () => {
    setIsLoading(true);
    try {
        const q = query(hotelsCollectionRef, orderBy('name'));
        const data = await getDocs(q);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as Hotel));
        setHotels(filteredData);
    } catch (error) {
        console.error("Error fetching hotels from Firestore:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getHotels();
  }, [getHotels]);

  const addHotel = useCallback(async (hotel: Omit<Hotel, 'id'>) => {
    try {
        await addDoc(hotelsCollectionRef, { ...hotel, createdAt: new Date() });
        await getHotels(); // Refresh list after adding
    } catch (error) {
        console.error("Error adding hotel to Firestore:", error);
        throw error;
    }
  }, [getHotels, hotelsCollectionRef]);

  const removeHotel = useCallback(async (hotelId: string) => {
    const hotelDoc = doc(db, 'hotels', hotelId);
    try {
        await deleteDoc(hotelDoc);
        await getHotels(); // Refresh list after deleting
    } catch (error) {
        console.error("Error deleting hotel from Firestore:", error);
    }
  }, [getHotels]);

  return { hotels, addHotel, removeHotel, isLoading };
}
