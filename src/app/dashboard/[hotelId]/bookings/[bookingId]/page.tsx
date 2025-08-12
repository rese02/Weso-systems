

'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, User, Users, FileText, BedDouble, Loader2, Home, Baby, UserCircle } from 'lucide-react';
import { getBookingById } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { useEffect, useState, use } from 'react';
import { useToast } from '@/hooks/use-toast';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
    'Confirmed': 'default',
    'Paid': 'default',
    'Checked-in': 'outline',
    'Checked-out': 'secondary',
    'Pending': 'destructive',
    'Submitted': 'outline',
    'Open': 'secondary',
    'Sent': 'outline',
};

const DetailRow = ({ label, value, isButton = false }: { label: string, value: string | React.ReactNode, isButton?: boolean }) => (
    <>
        <div className="text-sm text-muted-foreground">{label}</div>
        {isButton ? value : <div className="text-sm text-right sm:text-left break-all">{value || 'Nicht angegeben'}</div>}
    </>
);

export default function BookingDetailsPage({ params: paramsPromise }: { params: Promise<{ hotelId: string, bookingId: string }>}) {
  const { hotelId, bookingId } = use(paramsPromise);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchBooking = async () => {
        if (!bookingId || !hotelId) return;
        setIsLoading(true);
        const result = await getBookingById({ hotelId, bookingId });
        if (result.success && result.booking) {
            setBooking(result.booking);
        } else {
             toast({ variant: "destructive", title: "Error", description: result.error || "Booking not found." });
        }
        setIsLoading(false);
    }
    fetchBooking();
  }, [bookingId, hotelId, toast]);


  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span>Lade Buchungsdetails...</span></div>;
  }

  if (!booking) {
      return (
        <Card className="text-center p-8">
            <CardTitle>Buchung nicht gefunden</CardTitle>
            <CardContent>
                <p className="mt-2 text-muted-foreground">Die angeforderte Buchung konnte nicht gefunden werden.</p>
                <Button asChild className="mt-4">
                    <Link href={`/dashboard/${hotelId}/bookings`}>
                        <ArrowLeft />
                        <span>Zurück zu den Buchungen</span>
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  const guestName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
  const checkInDate = booking.checkIn ? format(parseISO(booking.checkIn), 'dd.MM.yyyy') : 'N/A';
  const checkOutDate = booking.checkOut ? format(parseISO(booking.checkOut), 'dd.MM.yyyy') : 'N/A';

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
              <h1 className="text-2xl font-bold font-headline sm:text-3xl">Buchungsdetails</h1>
              <p className="text-muted-foreground">Detaillierte Informationen für Buchung: {booking.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href={`/dashboard/${hotelId}/bookings`}>
                    <ArrowLeft />
                    <span className="hidden sm:inline">Zur Übersicht</span>
                </Link>
            </Button>
             <Button asChild>
                <Link href={`/dashboard/${hotelId}/bookings/${booking.id}/edit`}>
                    <Edit />
                    <span className="hidden sm:inline">Bearbeiten</span>
                </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold font-headline">{guestName || 'Gastdaten ausstehend'}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {checkInDate} - {checkOutDate}
                                </p>
                            </div>
                            <Badge variant={statusVariant[booking.status] || 'secondary'} className="w-fit h-fit">{booking.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Hauptgast-Informationen</h3>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-2">
                                <DetailRow label="Vorname" value={booking.firstName} />
                                <DetailRow label="Nachname" value={booking.lastName} />
                                <DetailRow label="E-Mail" value={booking.email} />
                                <DetailRow label="Telefon" value={booking.phone || "Nicht angegeben"} />
                                <DetailRow label="Alter" value={booking.age || "Nicht angegeben"} />
                                <DetailRow label="Gast-Notizen" value={booking.internalNotes || "Keine"} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Mitreisende</h3>
                            </div>
                            <Separator />
                            {booking.companions && booking.companions.length > 0 ? (
                                <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-2">
                                    {booking.companions.map((c, i) => (
                                        <DetailRow key={i} label={`Person ${i+2}`} value={`${c.firstName} ${c.lastName} (${c.dateOfBirth ? format(parseISO(c.dateOfBirth), 'dd.MM.yyyy') : 'N/A'})`} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Keine Mitreisenden angegeben oder Daten vom Gast noch nicht übermittelt.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BedDouble className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">Administrative Buchungsdetails</h3>
                        </div>
                    </CardHeader>
                    <CardContent className="divide-y divide-border">
                         {booking.rooms.map((room, index) => (
                         <div key={index} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground"/>Zimmer {index + 1}</h4>
                                <Badge variant="outline">{room.roomType}</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-x-4 gap-y-2 mt-4">
                                <DetailRow label="Belegung" value={
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1"><UserCircle/> {room.adults}</div>
                                        <div className="flex items-center gap-1"><Users/> {room.children}</div>
                                        <div className="flex items-center gap-1"><Baby/> {room.infants}</div>
                                    </div>
                                } />
                                <DetailRow label="Verpflegung" value={booking.boardType} />
                                <DetailRow label="Gesamtpreis" value={`${booking.priceTotal.toFixed(2)} €`} />
                                <DetailRow label="Zimmernummer" value={"Nicht zugewiesen"} />
                                <DetailRow label="Zimmerstatus" value={"Sauber"} />
                            </div>
                        </div>
                    ))}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold text-lg">Dokumente</h3>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {booking.documents?.idFront ? (
                             <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                <a href={booking.documents.idFront} target="_blank" rel="noopener noreferrer">
                                    <FileText /><span>Ausweis (Vorderseite)</span>
                                </a>
                            </Button>
                        ) : (
                            <p className="text-sm text-muted-foreground">Kein Ausweis (Vorderseite) hochgeladen.</p>
                        )}
                        {booking.documents?.idBack ? (
                             <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                <a href={booking.documents.idBack} target="_blank" rel="noopener noreferrer">
                                    <FileText /><span>Ausweis (Rückseite)</span>
                                </a>
                            </Button>
                        ) : (
                            <p className="text-sm text-muted-foreground">Kein Ausweis (Rückseite) hochgeladen.</p>
                        )}
                         {booking.documents?.paymentProof ? (
                             <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                <a href={booking.documents.paymentProof} target="_blank" rel="noopener noreferrer">
                                    <FileText /><span>Zahlungsnachweis</span>
                                </a>
                            </Button>
                         ) : (
                            <p className="text-sm text-muted-foreground">Kein Zahlungsnachweis hochgeladen.</p>
                         )}
                         <p className="text-xs text-muted-foreground pt-2">Dokumente wurden via Methode "{booking.documents?.submissionMethod || 'unbekannt'}" bereitgestellt.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
