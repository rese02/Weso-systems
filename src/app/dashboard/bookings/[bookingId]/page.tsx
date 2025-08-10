
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, User, Users, FileText, BedDouble, Loader2 } from 'lucide-react';
import { getBookingById } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { useParams, useSearchParams } from 'next/navigation';
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
        {isButton ? value : <div className="text-sm text-right sm:text-left break-all">{value || 'Not provided'}</div>}
    </>
);

export default function BookingDetailsPage({ params }: { params: { hotelId: string, bookingId: string }}) {
  const hotelId = params.hotelId;
  const bookingId = params.bookingId;

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
                    Back to Booking Overview
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
        
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold font-headline">{guestName || 'Awaiting Guest Details'}</h2>
                        <p className="text-sm text-muted-foreground">
                            Check-in: {checkInDate} - Check-out: {checkOutDate} - Total Price: {booking.priceTotal.toFixed(2)} € - Board: {booking.boardType}
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
                    <div className="grid grid-cols-[150px_1fr] sm:grid-cols-[200px_1fr] items-center gap-x-4 gap-y-2">
                        <DetailRow label="First Name" value={booking.firstName} />
                        <DetailRow label="Last Name" value={booking.lastName} />
                        <DetailRow label="Email" value={booking.email} />
                        <DetailRow label="Phone" value={"Not provided"} />
                        <DetailRow label="Age" value={"Not provided"} />
                         {booking.documents?.idDoc && (
                            <DetailRow label="ID Document" value={
                                <Button asChild variant="outline" size="sm" className="w-full sm:w-fit justify-start">
                                    <a href={booking.documents.idDoc} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />View Document
                                    </a>
                                </Button>
                            } isButton/>
                        )}
                         {booking.documents?.paymentProof && (
                            <DetailRow label="Payment Proof" value={
                                <Button asChild variant="outline" size="sm" className="w-full sm:w-fit justify-start">
                                    <a href={booking.documents.paymentProof} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />View Document
                                    </a>
                                </Button>
                            } isButton/>
                        )}
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

                 {/* Administrative Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BedDouble className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Administrative Booking Details</h3>
                    </div>
                    <Separator />
                    {booking.rooms.map((room, index) => (
                         <div key={index} className="space-y-4 pt-2">
                            <h4 className="font-medium">Room {index + 1}</h4>
                            <div className="grid grid-cols-[150px_1fr] sm:grid-cols-[200px_1fr] items-center gap-x-4 gap-y-2">
                                <DetailRow label="Room Type" value={room.roomType} />
                                <DetailRow label="Adults" value={`${room.adults}`} />
                                <DetailRow label="Children" value={`${room.children}`} />
                                <DetailRow label="Infants" value={`${room.infants}`} />
                                <DetailRow label="Room Number" value={"Not assigned"} />
                                <DetailRow label="Room Status" value={"Clean"} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
