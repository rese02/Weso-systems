

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { BookingCreationForm } from '@/components/booking/booking-creation-form';
import { Button } from '@/components/ui/button';
import { getBookingById } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { Loader2, XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EditBookingPage({ params }: { params: { hotelId: string, bookingId: string }}) {
    const router = useRouter();
    const { hotelId, bookingId } = use(params);

    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId || !hotelId) {
                 toast({ variant: "destructive", title: "Error", description: "Booking or Hotel ID is missing." });
                 router.push(`/dashboard/${hotelId}/bookings`);
                 return;
            };

            setIsLoading(true);
            const result = await getBookingById({ hotelId, bookingId }); 

            if (result.success && result.booking) {
                setBooking(result.booking);
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Booking not found." });
                router.push(`/dashboard/${hotelId}/bookings`);
            }
            setIsLoading(false);
        }
        fetchBooking();
    }, [bookingId, hotelId, router, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" /> 
                <span className="ml-2">Loading booking for editing...</span>
            </div>
        );
    }
    
    if (!booking) {
        return null;
    }

    return (
        <div className="mx-auto grid max-w-5xl gap-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                     <h1 className="text-3xl font-bold font-headline md:text-4xl">Buchung bearbeiten</h1>
                     <p className="text-muted-foreground">Aktualisieren Sie die Details für die Buchung von {booking.firstName} {booking.lastName}.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/${hotelId}/bookings`)} aria-label="Zurück zum Dashboard">
                    <XIcon className="h-5 w-5" />
                </Button>
            </div>
            <BookingCreationForm hotelId={hotelId} existingBooking={booking} />
        </div>
    );
}
