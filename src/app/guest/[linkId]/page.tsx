
'use client';

import { useEffect, useState } from 'react';
import { BookingForm } from '@/components/booking/booking-form';
import { Building2 } from 'lucide-react';
import { useBookingLinks } from '@/hooks/use-booking-links';
import type { BookingLink } from '@/hooks/use-booking-links';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function GuestBookingPage({ params }: { params: { linkId: string } }) {
  const [hotelName, setHotelName] = useState('Your Hotel');
  const { linkId } = params;
  const { getLink } = useBookingLinks(); // Using the hook without hotelId here
  const [linkData, setLinkData] = useState<BookingLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinkAndHotel = async () => {
      if (!linkId) {
        setError('No booking link provided.');
        setIsLoading(false);
        return;
      }

      try {
        // We get the link first to find out the hotelId
        const fetchedLink = await getLink(linkId);

        if (fetchedLink) {
          if (fetchedLink.used) {
            setError('This booking link has already been used.');
          } else if (new Date() > fetchedLink.expiresAt.toDate()) {
            setError('This booking link has expired.');
          } else {
            setLinkData(fetchedLink);
            // Now fetch hotel data using the hotelId from the link
            const hotelDocRef = doc(db, 'hotels', fetchedLink.hotelId);
            const hotelSnap = await getDoc(hotelDocRef);
            if (hotelSnap.exists()) {
                setHotelName(hotelSnap.data().name);
            }
          }
        } else {
          setError('Invalid booking link.');
        }
      } catch (e) {
        console.error(e);
        setError('An error occurred while validating the link.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkAndHotel();
  }, [linkId, getLink]);


  if (isLoading) {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
             <div className="flex flex-col items-center gap-4 mb-8 text-center">
                <Building2 className="h-12 w-12 text-primary animate-pulse" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="w-full max-w-3xl space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <Building2 className="h-12 w-12 text-destructive" />
            <h1 className="text-4xl font-bold font-headline">Invalid Link</h1>
            <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 mb-8 text-center">
        <Building2 className="h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Booking for {hotelName}</h1>
        <p className="text-muted-foreground max-w-md">
          Complete the steps below to finalize your reservation.
        </p>
      </div>
      <BookingForm prefillData={linkData?.prefill} linkId={linkData?.id} hotelId={linkData?.hotelId} />
    </div>
  );
}

    