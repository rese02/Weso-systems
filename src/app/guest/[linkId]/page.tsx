
'use client';

import { useEffect, useState } from 'react';
import { BookingForm } from '@/components/booking/booking-form';
import { Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookingLinkDetails } from '@/lib/actions/booking.actions';
import type { BookingLinkWithHotel, GuestLanguage } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const translations = {
    de: {
        loading: "Lade Buchungsdetails...",
        invalidLink: "Ungültiger Link",
        expiredLink: "Dieser Buchungslink ist abgelaufen.",
        invalidOrNotFound: "Ungültiger oder nicht gefundener Buchungslink.",
        completeBooking: "Buchung vervollständigen",
        secureTransfer: "Sichere Datenübermittlung.",
        rightsReserved: "Alle Rechte vorbehalten."
    },
    en: {
        loading: "Loading booking details...",
        invalidLink: "Invalid Link",
        expiredLink: "This booking link has expired.",
        invalidOrNotFound: "Invalid or not found booking link.",
        completeBooking: "Complete Booking",
        secureTransfer: "Secure data transmission.",
        rightsReserved: "All rights reserved."
    },
    it: {
        loading: "Caricamento dei dettagli della prenotazione...",
        invalidLink: "Link non valido",
        expiredLink: "Questo link di prenotazione è scaduto.",
        invalidOrNotFound: "Link di prenotazione non valido o non trovato.",
        completeBooking: "Completa Prenotazione",
        secureTransfer: "Trasmissione sicura dei dati.",
        rightsReserved: "Tutti i diritti riservati."
    }
};

export default function GuestBookingPage() {
  const [linkData, setLinkData] = useState<BookingLinkWithHotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [lang, setLang] = useState<GuestLanguage>('de');

  useEffect(() => {
    // Extract linkId from URL on the client side
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    if (id) {
        setLinkId(id);
    } else {
        setError(translations[lang].invalidOrNotFound);
        setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    const fetchLinkDetails = async () => {
      if (!linkId) {
        return;
      }

      setIsLoading(true);
      const result = await getBookingLinkDetails(linkId);
      
      if (result.success && result.data) {
        const guestLang = result.data.prefill.guestLanguage as GuestLanguage || 'de';
        setLang(guestLang);

        if (new Date() > new Date(result.data.expiresAt as string)) {
          setError(translations[guestLang].expiredLink);
        } else {
          setLinkData(result.data);
        }
      } else {
        setError(result.error || translations[lang].invalidOrNotFound);
      }
      setIsLoading(false);
    };

    if (linkId) {
        fetchLinkDetails();
    }
  }, [linkId, lang]);


  if (isLoading) {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
             <div className="flex flex-col items-center gap-4 mb-8 text-center">
                <Shield className="h-12 w-12 text-primary animate-pulse" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="w-full max-w-4xl space-y-4">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
  }
  
  const t = translations[lang] || translations.de;

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <Shield className="h-12 w-12 text-destructive mx-auto" />
                <CardTitle className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold font-headline">{t.invalidLink}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground max-w-md">{error}</p>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
     <div className="min-h-screen bg-secondary flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="py-8 text-center">
        <Link href="/">
           <div className="inline-flex items-center gap-2 text-foreground">
             <Shield className="h-12 w-12 text-primary" />
             <span className="text-xl font-bold font-headline">{linkData?.hotelName || 'Hotel'}</span>
           </div>
        </Link>
      </header>
      <main className="w-full flex-grow flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-xs text-muted-foreground">{t.steps[0]}</h1>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline">{t.completeBooking}</h1>
          {linkData && linkId && <BookingForm prefillData={{...linkData.prefill, guestLanguage: lang}} linkId={linkId} hotelId={linkData.hotelId} initialGuestData={{firstName: linkData.prefill.firstName, lastName: linkData.prefill.lastName, email: ''}} />}
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} WESO B-system. {t.secureTransfer}</p>
      </footer>
    </div>
  );
}

    
