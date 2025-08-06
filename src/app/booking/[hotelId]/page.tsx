import { BookingForm } from '@/components/booking/booking-form';
import { Building2 } from 'lucide-react';

export default function BookingPage({ params }: { params: { hotelId: string } }) {
  // In a real app, you'd fetch hotel details using params.hotelId
  const hotelName = 'Hotel Paradies';

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 mb-8 text-center">
        <Building2 className="h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Booking for {hotelName}</h1>
        <p className="text-muted-foreground max-w-md">
          Complete the steps below to finalize your reservation.
        </p>
      </div>
      <BookingForm />
    </div>
  );
}
