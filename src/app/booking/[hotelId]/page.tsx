'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingForm } from '@/components/booking/booking-form';
import { Building2 } from 'lucide-react';
import { useBookingLinks } from '@/hooks/use-booking-links';
import type { BookingLink } from '@/hooks/use-booking-links';

export default function BookingPage({ params }: { params: { hotelId: string } }) {
  // In a real app, you'd fetch hotel details using params.hotelId
  const hotelName = 'Hotel Paradies';
  const searchParams = useSearchParams();
  const linkId = searchParams.get('linkId');
  const { getLink, isLoading } = useBookingLinks();
  const [linkData, setLinkData] = useState<BookingLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (linkId && !isLoading) {
      const fetchedLink = getLink(linkId);
      if (fetchedLink) {
        if (fetchedLink.used) {
          setError('This booking link has already been used.');
        } else if (new Date() > new Date(fetchedLink.expiresAt)) {
          setError('This booking link has expired.');
        } else {
          setLinkData(fetchedLink);
        }
      } else {
        setError('Invalid booking link.');
      }
    }
  }, [linkId, getLink, isLoading]);

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
      <BookingForm prefillData={linkData?.prefill} />
    </div>
  );
}
