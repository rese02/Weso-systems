
'use client';

import { useEffect, useState, use } from 'react';
import { CheckCircle, Building2, Calendar, Bed, Utensils, Users, Euro } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookingLinkDetails } from '@/lib/actions/booking.actions';
import { getBookingById } from '@/lib/actions/booking.actions';
import type { BookingLinkWithHotel, Booking } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3">
        <div className="flex items-center text-sm text-muted-foreground mb-1 sm:mb-0">
            <Icon className="mr-3 h-4 w-4 shrink-0" />
            <span>{label}</span>
        </div>
        <span className="text-sm font-medium text-left sm:text-right w-full sm:w-auto pl-7 sm:pl-0">{value}</span>
    </div>
);


const LoadingState = () => (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
            <CardHeader className="items-center">
                 <Skeleton className="h-12 w-12 rounded-full" />
                 <Skeleton className="h-8 w-48 mt-4" />
            </CardHeader>
            <CardContent className="space-y-4">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-3/4" />
                 <div className="border rounded-md p-4 mt-6 space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                 </div>
            </CardContent>
        </Card>
    </div>
);

export default function ThankYouPage() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [hotel, setHotel] = useState<{name: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Since we don't have access to params hook directly in app router pages
  // passed via props, we need a client component to read from window.
  useEffect(() => {
    const pathSegments = window.location.pathname.split('/');
    const linkId = pathSegments[2]; // Assuming URL is /guest/{linkId}/thank-you

    if (!linkId) {
        setError("Link-ID nicht gefunden.");
        setIsLoading(false);
        return;
    }

    const fetchData = async () => {
        const linkDetailsResult = await getBookingLinkDetails(linkId);

        if (!linkDetailsResult.success || !linkDetailsResult.data) {
            setError(linkDetailsResult.error || "Buchungsdetails konnten nicht geladen werden.");
            setIsLoading(false);
            return;
        }
        
        const bookingId = linkDetailsResult.data.bookingId;
        const hotelId = linkDetailsResult.data.hotelId;
        setHotel({ name: linkDetailsResult.data.hotelName });

        const bookingResult = await getBookingById({ hotelId, bookingId });

        if (bookingResult.success && bookingResult.booking) {
            setBooking(bookingResult.booking);
        } else {
            setError(bookingResult.error || "Buchung konnte nicht gefunden werden.");
        }
        setIsLoading(false);
    };

    fetchData();

  }, []);


  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !booking || !hotel) {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Fehler</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{error || "Ein unbekannter Fehler ist aufgetreten."}</p>
                    <Button asChild className="mt-4"><Link href="/">Zur Startseite</Link></Button>
                </CardContent>
            </Card>
        </div>
    )
  }
  
  const totalPersons = booking.rooms.reduce((sum, room) => sum + room.adults + room.children + room.infants, 0);


  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center p-4 sm:p-6 md:p-8">
       <header className="py-8 text-center">
        <Link href="/">
           <div className="inline-flex items-center gap-2 text-foreground">
             <Building2 className="h-12 w-12 text-primary" />
             <span className="text-xl font-bold font-headline">{hotel.name}</span>
           </div>
        </Link>
      </header>
      <main className="w-full flex-grow flex flex-col items-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader className="items-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold font-headline">Informationen übermittelt!</CardTitle>
            <CardDescription className="pt-2 max-w-md">
                Vielen Dank, {booking.firstName}! Ihre Informationen für diese Buchung wurden vollständig an uns gesendet. Sie haben bereits eine Bestätigungs-E-Mail erhalten oder erhalten diese in Kürze.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left p-6">
                <h3 className="text-center font-semibold text-lg pb-2">Ihre Buchungsübersicht</h3>
                <div className="border rounded-lg divide-y">
                    <DetailRow icon={Users} label="Buchungsnummer" value={booking.id.substring(0, 8).toUpperCase()} />
                    <DetailRow icon={Calendar} label="Anreise" value={format(parseISO(booking.checkIn), "EEE, dd. MMM yyyy 'ab 15:00 Uhr'", { locale: de })} />
                    <DetailRow icon={Calendar} label="Abreise" value={format(parseISO(booking.checkOut), "EEE, dd. MMM yyyy 'bis 10:00 Uhr'", { locale: de })} />
                    {booking.rooms.map((room, index) => (
                         <DetailRow key={index} icon={Bed} label={`Zimmer ${index + 1}`} value={room.roomType} />
                    ))}
                    <DetailRow icon={Utensils} label="Verpflegung" value={booking.boardType} />
                    <DetailRow icon={Users} label="Personen" value={`${totalPersons} Person(en)`} />
                    <DetailRow icon={Euro} label="Gesamtpreis" value={<span className="font-bold">{booking.priceTotal.toFixed(2)} €</span>} />
                </div>
                 <p className="text-xs text-center text-muted-foreground pt-4">Sollten Sie nachträglich Änderungen wünschen oder Fragen haben, kontaktieren Sie uns bitte direkt.</p>
            </CardContent>
        </Card>
        </main>
        <footer className="py-4 mt-8 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {hotel.name}. Alle Rechte vorbehalten.</p>
        </footer>
    </div>
  );
}
