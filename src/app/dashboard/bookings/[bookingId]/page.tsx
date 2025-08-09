
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, User, Users, FileText, BedDouble } from 'lucide-react';

// Mock data, in a real app this would be fetched from a database
const bookingDetails = {
    id: 'BC7EGC',
    guestName: 'Alexis Morant',
    checkIn: 'Aug 09, 2025',
    checkOut: 'Aug 10, 2025',
    totalPrice: '210,00 €',
    board: 'Breakfast',
    status: 'Confirmed',
    mainGuest: {
        firstName: 'Alexis',
        lastName: 'Morant',
        email: 'alexismorant11@gmail.com',
        phone: '0034679434378',
        age: 'Not provided',
        idFront: true,
        idBack: true,
        notes: 'Not provided',
    },
    companions: [
        {
            firstName: 'Raquel',
            lastName: 'Jounou',
            idFront: true,
            idBack: true,
        }
    ],
    administrative: {
        room1: {
            type: 'Comfort',
            number: 'Not assigned',
            status: 'Clean',
        }
    }
};


const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
    'Confirmed': 'default',
    'Paid': 'default',
    'Checked-in': 'outline',
    'Checked-out': 'secondary',
    'Pending': 'destructive'
}

const DetailRow = ({ label, value, isButton = false }: { label: string, value: string | React.ReactNode, isButton?: boolean }) => (
    <>
        <div className="text-sm text-muted-foreground">{label}</div>
        {isButton ? value : <div className="text-sm text-right sm:text-left">{value}</div>}
    </>
);

export default function BookingDetailsPage({ params }: { params: { bookingId: string } }) {
  // We use mock data, but in a real app you'd fetch the booking by params.bookingId
  const booking = bookingDetails;

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Booking Details</h1>
              <p className="text-muted-foreground">Detailed information for Booking ID: {booking.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Booking Overview
                </Link>
            </Button>
             <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit
            </Button>
          </div>
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold font-headline">{booking.guestName}</h2>
                        <p className="text-sm text-muted-foreground">
                            Check-in: {booking.checkIn} - Check-out: {booking.checkOut} - Total Price: {booking.totalPrice} - Board: {booking.board}
                        </p>
                    </div>
                    <Badge variant={statusVariant[booking.status] || 'default'} className="w-fit h-fit">{booking.status}</Badge>
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
                        <DetailRow label="First Name" value={booking.mainGuest.firstName} />
                        <DetailRow label="Last Name" value={booking.mainGuest.lastName} />
                        <DetailRow label="Email" value={booking.mainGuest.email} />
                        <DetailRow label="Phone" value={booking.mainGuest.phone} />
                        <DetailRow label="Age" value={booking.mainGuest.age} />
                        <DetailRow label="ID Front" value={
                            <Button variant="outline" size="sm" className="w-full sm:w-fit justify-start">
                                <FileText className="mr-2 h-4 w-4" />View Document</Button>
                        } isButton/>
                        <DetailRow label="ID Back" value={
                             <Button variant="outline" size="sm" className="w-full sm:w-fit justify-start">
                                <FileText className="mr-2 h-4 w-4" />View Document</Button>
                        } isButton/>
                        <DetailRow label="Guest Notes" value={booking.mainGuest.notes} />
                    </div>
                </div>

                {/* Companions Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Companions</h3>
                    </div>
                     <Separator />
                    {booking.companions.map((companion, index) => (
                        <div key={index} className="space-y-4 pt-2">
                             <h4 className="font-medium">Companion {index + 1}</h4>
                             <div className="grid grid-cols-[150px_1fr] sm:grid-cols-[200px_1fr] items-center gap-x-4 gap-y-2">
                                <DetailRow label="First Name" value={companion.firstName} />
                                <DetailRow label="Last Name" value={companion.lastName} />
                                <DetailRow label="ID Front" value={
                                    <Button variant="outline" size="sm" className="w-full sm:w-fit justify-start">
                                        <FileText className="mr-2 h-4 w-4" />View Document</Button>
                                } isButton/>
                                <DetailRow label="ID Back" value={
                                    <Button variant="outline" size="sm" className="w-full sm:w-fit justify-start">
                                        <FileText className="mr-2 h-4 w-4" />View Document</Button>
                                } isButton/>
                             </div>
                        </div>
                    ))}
                </div>

                 {/* Administrative Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BedDouble className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Administrative Booking Details</h3>
                    </div>
                    <Separator />
                     <div className="space-y-4 pt-2">
                        <h4 className="font-medium">Room 1</h4>
                        <div className="grid grid-cols-[150px_1fr] sm:grid-cols-[200px_1fr] items-center gap-x-4 gap-y-2">
                            <DetailRow label="Room Type" value={booking.administrative.room1.type} />
                            <DetailRow label="Room Number" value={booking.administrative.room1.number} />
                            <DetailRow label="Room Status" value={booking.administrative.room1.status} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
