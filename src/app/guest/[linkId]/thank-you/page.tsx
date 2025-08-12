
'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Shield, Calendar, Bed, Utensils, Users, Euro } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookingLinkDetails } from '@/lib/actions/booking.actions';
import { getBookingById } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { de, enUS, it } from 'date-fns/locale';

const translations = {
    de: {
        title: "Informationen übermittelt!",
        description: (name: string) => `Vielen Dank, ${name}! Ihre Informationen für diese Buchung wurden vollständig an uns gesendet. Sie haben bereits eine Bestätigungs-E-Mail erhalten oder erhalten diese in Kürze.`,
        overviewTitle: "Ihre Buchungsübersicht",
        bookingNumber: "Buchungsnummer",
        arrival: "Anreise",
        departure: "Abreise",
        room: "Zimmer",
        boardType: "Verpflegung",
        persons: "Personen",
        totalPrice: "Gesamtpreis",
        arrivalInfo: "ab 15:00 Uhr",
        departureInfo: "bis 10:00 Uhr",
        personSuffix: "Person(en)",
        contactNote: "Sollten Sie nachträglich Änderungen wünschen oder Fragen haben, kontaktieren Sie uns bitte direkt.",
        rightsReserved: "Alle Rechte vorbehalten.",
        errorTitle: "Fehler",
        errorText: "Ein unbekannter Fehler ist aufgetreten.",
        linkNotFound: "Link-ID nicht gefunden.",
        bookingNotFound: "Buchung konnte nicht gefunden werden.",
        detailsNotFound: "Buchungsdetails konnten nicht geladen werden.",
        backToHome: "Zur Startseite",
    },
    en: {
        title: "Information Submitted!",
        description: (name: string) => `Thank you, ${name}! Your information for this booking has been sent to us completely. You have already received or will shortly receive a confirmation email.`,
        overviewTitle: "Your Booking Summary",
        bookingNumber: "Booking Number",
        arrival: "Arrival",
        departure: "Departure",
        room: "Room",
        boardType: "Board Type",
        persons: "Persons",
        totalPrice: "Total Price",
        arrivalInfo: "from 3:00 PM",
        departureInfo: "until 10:00 AM",
        personSuffix: "person(s)",
        contactNote: "Should you wish to make changes later or have any questions, please contact us directly.",
        rightsReserved: "All rights reserved.",
        errorTitle: "Error",
        errorText: "An unknown error occurred.",
        linkNotFound: "Link ID not found.",
        bookingNotFound: "Booking could not be found.",
        detailsNotFound: "Booking details could not be loaded.",
        backToHome: "Back to Home",
    },
    it: {
        title: "Informazioni Inviate!",
        description: (name: string) => `Grazie, ${name}! Le sue informazioni per questa prenotazione ci sono state inviate completamente. Ha già ricevuto o riceverà a breve un'e-mail di conferma.`,
        overviewTitle: "Riepilogo della Sua Prenotazione",
        bookingNumber: "Numero di Prenotazione",
        arrival: "Arrivo",
        departure: "Partenza",
        room: "Camera",
        boardType: "Trattamento",
        persons: "Persone",
        totalPrice: "Prezzo Totale",
        arrivalInfo: "dalle 15:00",
        departureInfo: "fino alle 10:00",
        personSuffix: "persona(e)",
        contactNote: "Se desidera apportare modifiche in seguito o ha domande, la preghiamo di contattarci direttamente.",
        rightsReserved: "Tutti i diritti riservati.",
        errorTitle: "Errore",
        errorText: "Si è verificato un errore sconosciuto.",
        linkNotFound: "ID del link non trovato.",
        bookingNotFound: "Impossibile trovare la prenotazione.",
        detailsNotFound: "Impossibile caricare i dettagli della prenotazione.",
        backToHome: "Torna alla Homepage",
    }
};

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
  const [lang, setLang] = useState<'de' | 'en' | 'it'>('de');

  useEffect(() => {
    const pathSegments = window.location.pathname.split('/');
    const linkId = pathSegments[2];

    if (!linkId) {
        setError(translations[lang].linkNotFound);
        setIsLoading(false);
        return;
    }

    const fetchData = async () => {
        const linkDetailsResult = await getBookingLinkDetails(linkId);

        if (!linkDetailsResult.success || !linkDetailsResult.data) {
            setError(linkDetailsResult.error || translations[lang].detailsNotFound);
            setIsLoading(false);
            return;
        }
        
        const bookingId = linkDetailsResult.data.bookingId;
        const hotelId = linkDetailsResult.data.hotelId;
        setHotel({ name: linkDetailsResult.data.hotelName });

        const bookingResult = await getBookingById({ hotelId, bookingId });

        if (bookingResult.success && bookingResult.booking) {
            setBooking(bookingResult.booking);
            setLang(bookingResult.booking.guestLanguage as any || 'de');
        } else {
            setError(bookingResult.error || translations[lang].bookingNotFound);
        }
        setIsLoading(false);
    };

    fetchData();

  }, [lang]);

  if (isLoading) {
    return <LoadingState />;
  }

  const t = translations[lang] || translations.de;
  const locale = lang === 'en' ? enUS : lang === 'it' ? it : de;

  if (error || !booking || !hotel) {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>{t.errorTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{error || t.errorText}</p>
                    <Button asChild className="mt-4"><Link href="/">{t.backToHome}</Link></Button>
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
             <Shield className="h-12 w-12 text-primary" />
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
            <CardTitle className="mt-4 text-2xl font-bold font-headline">{t.title}</CardTitle>
            <CardDescription className="pt-2 max-w-md">
                {t.description(booking.firstName || 'Gast')}
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left p-6">
                <h3 className="text-center font-semibold text-lg pb-2">{t.overviewTitle}</h3>
                <div className="border rounded-lg divide-y">
                    <DetailRow icon={Users} label={t.bookingNumber} value={booking.id.substring(0, 8).toUpperCase()} />
                    <DetailRow icon={Calendar} label={t.arrival} value={`${format(parseISO(booking.checkIn), "EEE, dd. MMM yyyy", { locale })} '${t.arrivalInfo}'`} />
                    <DetailRow icon={Calendar} label={t.departure} value={`${format(parseISO(booking.checkOut), "EEE, dd. MMM yyyy", { locale })} '${t.departureInfo}'`} />
                    {booking.rooms.map((room, index) => (
                         <DetailRow key={index} icon={Bed} label={`${t.room} ${index + 1}`} value={room.roomType} />
                    ))}
                    <DetailRow icon={Utensils} label={t.boardType} value={booking.boardType} />
                    <DetailRow icon={Users} label={t.persons} value={`${totalPersons} ${t.personSuffix}`} />
                    <DetailRow icon={Euro} label={t.totalPrice} value={<span className="font-bold">{booking.priceTotal.toFixed(2)} €</span>} />
                </div>
                 <p className="text-xs text-center text-muted-foreground pt-4">{t.contactNote}</p>
            </CardContent>
        </Card>
        </main>
        <footer className="py-4 mt-8 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {hotel.name}. {t.rightsReserved}</p>
        </footer>
    </div>
  );
}

    
