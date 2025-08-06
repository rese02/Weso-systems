'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Hotel {
  id: string;
  name: string;
  ownerEmail: string;
  domain: string;
}

const initialHotels: Hotel[] = [
  { id: 'hotel-01', name: 'Hotel Paradies', ownerEmail: 'kontakt@hotel-paradies.de', domain: 'hotel-paradies.de' },
  { id: 'hotel-02', name: 'Seaside Resort', ownerEmail: 'manager@seasideresort.com', domain: 'seasideresort.com' },
  { id: 'hotel-03', name: 'Mountain Retreat', ownerEmail: 'info@mountainretreat.io', domain: 'mountainretreat.io' },
  { id: 'hotel-04', name: 'Urban Getaway', ownerEmail: 'contact@urbangetaway.co', domain: 'urbangetaway.co' },
  { id: 'hotel-05', name: 'The Grand Hotel', ownerEmail: 'reservations@thegrand.com', domain: 'thegrand.com' },
];

const LOCAL_STORAGE_KEY = 'managedHotels';

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedHotels = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHotels) {
        setHotels(JSON.parse(storedHotels));
      } else {
        // Initialize with default hotels if nothing is in storage
        setHotels(initialHotels);
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialHotels));
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
      // Fallback to initial hotels if localStorage is not available
      setHotels(initialHotels);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateLocalStorage = (updatedHotels: Hotel[]) => {
    try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHotels));
    } catch (error) {
        console.error("Failed to update localStorage", error);
    }
  };

  const addHotel = useCallback((hotel: Omit<Hotel, 'id'>) => {
    setHotels(prevHotels => {
      const newHotel = { ...hotel, id: `hotel-${Date.now()}` };
      const updatedHotels = [...prevHotels, newHotel];
      updateLocalStorage(updatedHotels);
      return updatedHotels;
    });
  }, []);

  const removeHotel = useCallback((hotelId: string) => {
    setHotels(prevHotels => {
      const updatedHotels = prevHotels.filter(hotel => hotel.id !== hotelId);
      updateLocalStorage(updatedHotels);
      return updatedHotels;
    });
  }, []);

  return { hotels, addHotel, removeHotel, isLoading };
}
