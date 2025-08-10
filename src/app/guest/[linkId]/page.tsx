
'use client';

import { useEffect, useState, use } from 'react';
import { BookingForm } from '@/components/booking/booking-form';
import { Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookingLinkDetails } from '@/lib/actions/booking.actions';
import type { BookingLinkWithHotel } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GuestBookingPage({ params: paramsPromise }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = use(paramsPromise);
  
  const [linkData, setLinkData] = useState<BookingLinkWithHotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinkDetails = async () => {
      if (!linkId) {
        setError('Kein Buchungslink angegeben.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const result = await getBookingLinkDetails(linkId);
      
      if (result.success && result.data) {
        if (result.data.status === 'used') {
          setError('Dieser Buchungslink wurde bereits verwendet.');
        } else if (new Date() > new Date(result.data.expiresAt as string)) {
          setError('Dieser Buchungslink ist abgelaufen.');
        } else {
          setLinkData(result.data);
        }
      } else {
        setError(result.error || 'Ungültiger oder nicht gefundener Buchungslink.');
      }
      setIsLoading(false);
    };

    fetchLinkDetails();
  }, [linkId]);


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
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <Building2 className="h-12 w-12 text-destructive mx-auto" />
                <CardTitle className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold font-headline">Ungültiger Link</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground max-w-md">{error}</p>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 mb-8 text-center">
        <Building2 className="h-12 w-12 text-primary" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline">Buchung für {linkData?.hotelName}</h1>
        <p className="text-muted-foreground max-w-md">
          Vervollständigen Sie die folgenden Schritte, um Ihre Reservierung abzuschließen.
        </p>
      </div>
      {linkData && <BookingForm prefillData={linkData.prefill} linkId={linkData.id} hotelId={linkData.hotelId} />}
    </div>
  );
}
