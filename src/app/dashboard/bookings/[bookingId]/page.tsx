
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
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function BookingDetailsPage() {
  const params = useParams();
  const hotelId = Array.isArray(params.hotelId) ? params.hotelId[0] : params.hotelId;
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;

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
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span>Loading booking details...</span></div>;
  }

  if (!booking) {
      return <div>Booking not found.</div>
  }

  const guestName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
  const checkInDate = booking.checkIn ? format(parseISO(booking.checkIn), 'dd.MM.yyyy') : 'N/A';
  const checkOutDate = booking.checkOut ? format(parseISO(booking.checkOut), 'dd.MM.yyyy') : 'N/A';

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Booking Details</h1>
              <p className="text-muted-foreground">Detailed information for Booking ID: {booking.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href={`/dashboard/${hotelId}/bookings`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Overview
                </Link>
            </Button>
             <Button asChild>
                <Link href={`/dashboard/${hotelId}/bookings/${booking.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold font-headline">{guestName || 'Awaiting Guest Details'}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {checkInDate} - {checkOutDate}
                                </p>
                            </div>
                            <Badge variant={statusVariant[booking.status] || 'secondary'} className="w-fit h-fit">{booking.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Main Guest Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Main Guest Information</h3>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-2">
                                <DetailRow label="First Name" value={booking.firstName} />
                                <DetailRow label="Last Name" value={booking.lastName} />
                                <DetailRow label="Email" value={booking.email} />
                                <DetailRow label="Phone" value={"Not provided"} />
                                <DetailRow label="Age" value={"Not provided"} />
                                <DetailRow label="Guest Notes" value={booking.internalNotes || "Not provided"} />
                            </div>
                        </div>

                        {/* Companions Info - Placeholder for now */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Companions</h3>
                            </div>
                            <Separator />
                            <p className="text-sm text-muted-foreground">Companion details will be available after the guest completes the form.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BedDouble className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">Administrative Booking Details</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {booking.rooms.map((room, index) => (
                         <div key={index} className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground"/>Room {index + 1}</h4>
                                <Badge variant="outline">{room.roomType}</Badge>
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-2 mt-4">
                                <DetailRow label="Occupancy" value={
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1"><UserCircle className="w-4 h-4"/> {room.adults}</div>
                                        <div className="flex items-center gap-1"><Users className="w-4 h-4"/> {room.children}</div>
                                        <div className="flex items-center gap-1"><Baby className="w-4 h-4"/> {room.infants}</div>
                                    </div>
                                } />
                                <DetailRow label="Board Type" value={booking.boardType} />
                                <DetailRow label="Total Price" value={`${booking.priceTotal.toFixed(2)} €`} />
                                <DetailRow label="Room Number" value={"Not assigned"} />
                                <DetailRow label="Room Status" value={"Clean"} />
                            </div>
                        </div>
                    ))}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold text-lg">Documents</h3>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {booking.documents?.idDoc ? (
                             <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                <a href={booking.documents.idDoc} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />View ID Document
                                </a>
                            </Button>
                        ) : (
                            <p className="text-sm text-muted-foreground">No ID document uploaded.</p>
                        )}
                         {booking.documents?.paymentProof ? (
                             <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                <a href={booking.documents.paymentProof} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />View Payment Proof
                                </a>
                            </Button>
                         ) : (
                            <p className="text-sm text-muted-foreground">No payment proof uploaded.</p>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
