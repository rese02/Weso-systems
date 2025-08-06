import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const bookings = [
    { id: 'booking-01', guestName: 'John Doe', checkIn: '2024-08-15', checkOut: '2024-08-20', room: 'Double Room', status: 'Confirmed' },
    { id: 'booking-02', guestName: 'Jane Smith', checkIn: '2024-08-16', checkOut: '2024-08-18', room: 'Suite', status: 'Paid' },
    { id: 'booking-03', guestName: 'Peter Jones', checkIn: '2024-09-01', checkOut: '2024-09-07', room: 'Single Room', status: 'Checked-in' },
    { id: 'booking-04', guestName: 'Mary Williams', checkIn: '2024-07-20', checkOut: '2024-07-25', room: 'Double Room', status: 'Checked-out' },
    { id: 'booking-05', guestName: 'David Brown', checkIn: '2024-09-10', checkOut: '2024-09-12', room: 'Suite', status: 'Pending' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
    'Confirmed': 'default',
    'Paid': 'default',
    'Checked-in': 'outline',
    'Checked-out': 'secondary',
    'Pending': 'destructive'
}

export default function HotelierDashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Bookings Overview</h1>
              <p className="text-muted-foreground">Manage all bookings for your hotel.</p>
          </div>
          <Button asChild>
              <Link href="#">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Booking
              </Link>
          </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current Bookings</CardTitle>
          <CardDescription>A list of all bookings for Hotel Paradies.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.guestName}</TableCell>
                  <TableCell>{booking.checkIn} to {booking.checkOut}</TableCell>
                  <TableCell>{booking.room}</TableCell>
                  <TableCell>
                      <Badge variant={statusVariant[booking.status] || 'default'}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                        <DropdownMenuItem>Check-in Guest</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel Booking</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
