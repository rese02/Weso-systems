

'use client';

import { BookingCreationForm } from '@/components/booking/booking-creation-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { XIcon } from 'lucide-react';
import { use } from 'react';

export default function CreateBookingPage({ params }: { params: { hotelId: string }}) {
    const router = useRouter();
    const { hotelId } = use(params);

    if (!hotelId) {
      // Maybe show a proper error message
      return <div>Hotel ID is missing</div>;
    }

    return (
        <div className="mx-auto grid max-w-5xl gap-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                     <h1 className="text-3xl font-bold font-headline md:text-4xl">Neue Buchung erstellen</h1>
                     <p className="text-muted-foreground">Füllen Sie die Felder aus, um eine neue Buchung anzulegen und einen Gast-Link zu generieren.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/${hotelId}/bookings`)} aria-label="Zurück zum Dashboard">
                    <XIcon className="h-5 w-5" />
                </Button>
            </div>
            <BookingCreationForm hotelId={hotelId} />
        </div>
    );
}
