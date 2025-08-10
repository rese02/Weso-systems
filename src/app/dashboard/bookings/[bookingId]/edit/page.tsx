
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookingCreationForm } from '@/components/booking/booking-creation-form';
import { Button } from '@/components/ui/button';
import { getBookingsForHotel } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { Loader2, XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EditBookingPage() {
    const router = useRouter();
    const { bookingId } = useParams<{ bookingId: string }>();
    const hotelId = 'hotelhub-central'; 
    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) return;
            setIsLoading(true);
            const result = await getBookingsForHotel(hotelId); // This is inefficient but reuses existing action
            if (result.success && result.bookings) {
                const foundBooking = result.bookings.find(b => b.id === bookingId);
                if (foundBooking) {
                    setBooking(foundBooking);
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Booking not found." });
                    router.push('/dashboard/bookings');
                }
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error });
                router.push('/dashboard/bookings');
            }
            setIsLoading(false);
        }
        fetchBooking();
    }, [bookingId, router, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" /> 
                <span className="ml-2">Loading booking for editing...</span>
            </div>
        );
    }
    
    if (!booking) {
        return null; // Or some other placeholder
    }

    return (
        <div className="mx-auto grid max-w-5xl gap-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                     <h1 className="text-3xl font-bold font-headline md:text-4xl">Buchung bearbeiten</h1>
                     <p className="text-muted-foreground">Aktualisieren Sie die Details für die Buchung von {booking.firstName} {booking.lastName}.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/bookings')} aria-label="Zurück zum Dashboard">
                    <XIcon className="h-5 w-5" />
                </Button>
            </div>
            <BookingCreationForm existingBooking={booking} />
        </div>
    );
}
