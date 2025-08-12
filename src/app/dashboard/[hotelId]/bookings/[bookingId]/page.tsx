
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, User, Users, FileText, BedDouble, Loader2, Home, Baby, UserCircle, Calendar, Utensils, Euro, FileArchive } from 'lucide-react';
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
    'Partial Payment': 'default',
    'Cancelled': 'destructive',
};

const DetailRow = ({ label, value, icon: Icon }: { label: string, value: string | React.ReactNode, icon: React.ElementType }) => (
    <div className="flex items-start justify-between py-2">
        <div className="flex items-center text-sm text-muted-foreground">
            <Icon className="h-4 w-4 mr-3" />
            <span>{label}</span>
        </div>
        <div className="text-sm font-medium text-right break-all">{value || 'Nicht angegeben'}</div>
    </div>
);

const GuestItem = ({ name, role, icon: Icon }: { name: string, role: string, icon: React.ElementType }) => (
    <div className="flex items-center gap-4 py-2">
        <div className="bg-muted p-2 rounded-full">
            <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
        </div>
    </div>
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
  const totalPersons = booking.rooms.reduce((sum, room) => sum + room.adults + room.children + room.infants, 0);
  const paidAmount = (booking.status === 'Partial Payment' || booking.status === 'Confirmed') ? (booking.status === 'Partial Payment' ? booking.priceTotal * 0.3 : booking.priceTotal) : 0;
  const openAmount = booking.priceTotal - paidAmount;

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
                    <CardContent className="space-y-6">
                        
                        <div>
                             <h3 className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Gästeübersicht</h3>
                             <Separator className="my-2" />
                             <div className="divide-y">
                                <GuestItem name={guestName} role="Hauptbucher" icon={UserCircle} />
                                {booking.companions?.map((c, i) => (
                                    <GuestItem key={i} name={`${c.firstName} ${c.lastName}`} role="Mitreisender" icon={Users} />
                                ))}
                             </div>
                        </div>

                        <div>
                             <h3 className="text-base font-semibold flex items-center gap-2"><FileArchive className="h-4 w-4 text-primary" />Dokumente</h3>
                             <p className="text-xs text-muted-foreground mb-2">Bereitgestellt via Methode: "{booking.documents?.submissionMethod || 'unbekannt'}"</p>
                             <Separator className="my-2" />
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                <Button asChild variant="outline" size="sm" className="w-full justify-start" disabled={!booking.documents?.idFront}>
                                    <a href={booking.documents?.idFront || '#'} target="_blank" rel="noopener noreferrer">
                                        <FileText /><span>Ausweis (Vorderseite)</span>
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="w-full justify-start" disabled={!booking.documents?.idBack}>
                                    <a href={booking.documents?.idBack || '#'} target="_blank" rel="noopener noreferrer">
                                        <FileText /><span>Ausweis (Rückseite)</span>
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="w-full justify-start" disabled={!booking.documents?.paymentProof}>
                                    <a href={booking.documents?.paymentProof || '#'} target="_blank" rel="noopener noreferrer">
                                        <FileText /><span>Zahlungsnachweis</span>
                                    </a>
                                </Button>
                             </div>
                        </div>

                         <div>
                             <h3 className="text-base font-semibold flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" />Buchungsdetails</h3>
                             <Separator className="my-2" />
                             <div className="divide-y">
                                {booking.rooms.map((room, index) => (
                                    <DetailRow key={index} icon={Home} label={`Zimmer ${index + 1}`} value={room.roomType} />
                                ))}
                                <DetailRow icon={Calendar} label="Zeitraum" value={`${checkInDate} - ${checkOutDate}`} />
                                <DetailRow icon={Utensils} label="Verpflegung" value={booking.boardType} />
                                <DetailRow icon={Users} label="Personen" value={`${totalPersons}`} />
                             </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2"><Euro className="h-4 w-4 text-primary"/>Finanzen</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                       <DetailRow icon={Euro} label="Gesamtpreis" value={<span className="font-bold">{booking.priceTotal.toFixed(2)} €</span>} />
                       <DetailRow icon={Euro} label="Bezahlt" value={`${paidAmount.toFixed(2)} €`} />
                       <DetailRow icon={Euro} label="Offen bei Anreise" value={<span className="font-semibold text-primary">{openAmount.toFixed(2)} €</span>} />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Notizen</CardTitle>
                        <CardDescription>Interne & Gastnotizen</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div>
                            <p className="font-medium">Hotelier-Notizen</p>
                            <p className="text-muted-foreground">{booking.internalNotes || "Keine internen Notizen."}</p>
                        </div>
                         <div>
                            <p className="font-medium">Gast-Notizen</p>
                            <p className="text-muted-foreground">{booking.guestNotes || "Keine Notizen vom Gast."}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

