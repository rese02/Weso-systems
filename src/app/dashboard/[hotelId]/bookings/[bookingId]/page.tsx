
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, User, Users, FileText, BedDouble, Loader2, Home, Baby, UserCircle, Calendar, Utensils, Euro, FileArchive, Mail, Phone } from 'lucide-react';
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
        <div className="text-sm font-medium text-right break-words">{value || 'Nicht angegeben'}</div>
    </div>
);

const DocumentButton = ({ href, children }: { href: string | null | undefined, children: React.ReactNode }) => (
    <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2" disabled={!href}>
        <a href={href || '#'} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4" />
            <span>{children}</span>
        </a>
    </Button>
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
                                <h2 className="text-2xl font-bold font-headline">Buchungsübersicht</h2>
                                <p className="text-sm text-muted-foreground">
                                    {checkInDate} - {checkOutDate}
                                </p>
                            </div>
                            <Badge variant={statusVariant[booking.status] || 'secondary'} className="w-fit h-fit">{booking.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                             <h3 className="text-base font-semibold flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" />Allgemeine Buchungsdetails</h3>
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

                <Card>
                    <CardHeader>
                         <h3 className="text-lg font-semibold flex items-center gap-2"><Euro className="h-5 w-5 text-primary"/>Zahlung & Finanzen</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className='divide-y'>
                            <DetailRow icon={Euro} label="Gesamtpreis" value={<span className="font-bold">{booking.priceTotal.toFixed(2)} €</span>} />
                            <DetailRow icon={Euro} label="Bezahlt" value={`${paidAmount.toFixed(2)} €`} />
                            <DetailRow icon={Euro} label="Offen bei Anreise" value={<span className="font-semibold text-primary">{openAmount.toFixed(2)} €</span>} />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm mb-2">Zahlungsnachweis</h4>
                            <DocumentButton href={booking.documents?.paymentProof}>Zahlungsbeleg anzeigen</DocumentButton>
                             {!booking.documents?.paymentProof && <p className="text-xs text-muted-foreground mt-1">Kein Zahlungsnachweis hochgeladen.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Gäste & Dokumente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       {/* Main Guest */}
                       <div>
                           <h4 className="font-medium flex items-center gap-2"><UserCircle className="h-4 w-4"/>Hauptgast</h4>
                           <Separator className="my-2" />
                           <p className="font-semibold">{guestName}</p>
                           <div className="text-sm text-muted-foreground space-y-1 mt-2">
                               <p className="flex items-center gap-2"><Mail className="h-4 w-4"/>{booking.email || 'N/A'}</p>
                               <p className="flex items-center gap-2"><Phone className="h-4 w-4"/>{booking.phone || 'N/A'}</p>
                           </div>
                           <div className="mt-4">
                                <h5 className="font-medium text-xs text-muted-foreground mb-2">Dokumente des Hauptgastes</h5>
                                {booking.documents?.submissionMethod === 'upload' ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        <DocumentButton href={booking.documents?.idFront}>Ausweis (Vorderseite)</DocumentButton>
                                        <DocumentButton href={booking.documents?.idBack}>Ausweis (Rückseite)</DocumentButton>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md">Dokumente werden vom Gast vor Ort vorgelegt.</p>
                                )}
                           </div>
                       </div>
                       {/* Companions */}
                       {booking.companions && booking.companions.length > 0 && (
                           <div>
                               <h4 className="font-medium flex items-center gap-2"><Users className="h-4 w-4"/>Mitreisende</h4>
                               <Separator className="my-2"/>
                               <div className="space-y-4">
                                   {booking.companions.map((c, i) => (
                                       <div key={i}>
                                            <p className="font-semibold">{c.firstName} {c.lastName}</p>
                                            <p className="text-xs text-muted-foreground">Dokumente werden vor Ort vorgelegt.</p>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}
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
