'use client';

import { useState, useEffect, useCallback } from 'react';
import { addDays } from 'date-fns';

export interface BookingPrefill {
    roomType: string;
    checkIn: string; // ISO date string
    checkOut: string; // ISO date string
    priceTotal: number;
}

export interface BookingLink {
  id: string; // e.g., "SB-LINK-2025-08-07-001"
  createdBy: string; // For now, a placeholder
  createdAt: string; // ISO date string
  expiresAt: string; // ISO date string
  prefill: BookingPrefill;
  used: boolean;
}

const LOCAL_STORAGE_KEY = 'bookingLinks';

export function useBookingLinks() {
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLinks = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedLinks) {
        setLinks(JSON.parse(storedLinks));
      }
    } catch (error) {
      console.error("Failed to access localStorage for booking links", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateLocalStorage = (updatedLinks: BookingLink[]) => {
    try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLinks));
    } catch (error) {
        console.error("Failed to update localStorage for booking links", error);
    }
  };

  const addLinkFromBooking = useCallback((prefill: BookingPrefill, validityDays: number): BookingLink => {
    const now = new Date();
    const newLink: BookingLink = {
      id: `SB-LINK-${now.toISOString().slice(0, 10)}-${Math.random().toString(36).substring(2, 6)}`,
      createdBy: 'hotel-admin-uid', // Placeholder
      createdAt: now.toISOString(),
      expiresAt: addDays(now, validityDays).toISOString(),
      prefill,
      used: false,
    };

    let updatedLinks: BookingLink[] = [];
    setLinks(prevLinks => {
      updatedLinks = [newLink, ...prevLinks];
      updateLocalStorage(updatedLinks);
      return updatedLinks;
    });
    return newLink;
  }, []);

  const getLink = useCallback((linkId: string): BookingLink | undefined => {
      return links.find(link => link.id === linkId);
  }, [links]);

  const markAsUsed = useCallback((linkId: string) => {
    setLinks(prevLinks => {
        const updatedLinks = prevLinks.map(link => 
            link.id === linkId ? { ...link, used: true } : link
        );
        updateLocalStorage(updatedLinks);
        return updatedLinks;
    });
  }, []);

  return { links, addLinkFromBooking, getLink, markAsUsed, isLoading };
}
