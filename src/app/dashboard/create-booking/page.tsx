
import { BookingForm } from '@/components/booking/booking-form';

export default function CreateBookingPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-4">
        <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Create New Booking</h1>
            <p className="text-muted-foreground">Fill out the form to create a new booking for a guest.</p>
        </div>
        <BookingForm />
    </div>
  );
}
