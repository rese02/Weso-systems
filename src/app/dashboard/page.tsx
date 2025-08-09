
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, RefreshCw, Trash2, Eye, ArrowUp, ArrowDown, CheckCircle2, Clock, CircleOff, Search, Copy, Send } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBookingLinks } from '@/hooks/use-booking-links';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { useBookings } from '@/hooks/use-bookings';
import type { Booking } from '@/hooks/use-bookings';


const statusConfig: { [key: string]: { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ElementType, label: string } } = {
    'Open': { variant: 'secondary', icon: CircleOff, label: 'Open' },
    'Sent': { variant: 'outline', icon: Send, label: 'Sent' },
    'Submitted': { variant: 'outline', icon: Clock, label: 'Submitted' },
    'Confirmed': { variant: 'default', icon: CheckCircle2, label: 'Confirmed' },
    'Cancelled': { variant: 'destructive', icon: CircleOff, label: 'Cancelled' },
    'Partial Payment': { variant: 'outline', icon: CheckCircle2, label: 'Partial Payment' },
}

const StatCard = ({ title, value, description, icon: Icon }: { title: string, value: string, description: string, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <CardDescription>{title}</CardDescription>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl font-bold">{value}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);


export default function HotelierDashboardPage() {
  const hotelId = 'hotelhub-central'; // In a real app, get this from auth context
  const { bookings, isLoading, removeBooking, updateBooking } = useBookings(hotelId);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const { addLinkFromBooking } = useBookingLinks(hotelId);
  const { toast } = useToast();
  const router = useRouter();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(bookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectSingle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, id]);
    } else {
      setSelectedBookings(prev => prev.filter(bId => bId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
        await Promise.all(selectedBookings.map(id => removeBooking(id)));
        setSelectedBookings([]);
        toast({
            title: "Bookings Deleted",
            description: "The selected bookings have been successfully deleted.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "The bookings could not be deleted.",
        });
    }
  }

  const handleCopyLink = async (booking: Booking) => {
     const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return '';
    }
    
    try {
        let linkId = booking.bookingLinkId;

        if (!linkId) {
            const prefillData = {
                roomType: booking.rooms[0]?.roomType || 'Standard',
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                priceTotal: booking.priceTotal,
                bookingId: booking.id,
            };
            const newLink = await addLinkFromBooking(prefillData, 7, booking.id);
            linkId = newLink.id;
            await updateBooking(booking.id, { bookingLinkId: linkId, status: 'Sent' });
        }

        const fullLink = `${getBaseUrl()}/guest/${linkId}`;
        await navigator.clipboard.writeText(fullLink);
        toast({
            title: "Link Copied",
            description: "The booking link for the guest has been copied to your clipboard.",
        });
    } catch (error) {
        console.error("Could not create or copy the link:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "The link could not be created or copied.",
        });
    }
  }

  const isAllSelected = bookings.length > 0 && selectedBookings.length === bookings.length;


  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Booking Overview</h1>
              <p className="text-muted-foreground">Manage all your bookings here.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/dashboard/create-booking">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Booking
                </Link>
            </Button>
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Arrivals Today" value="0" description="(0 bookings) guests are checking in" icon={ArrowDown} />
        <StatCard title="Departures Today" value="0" description="(0 bookings) guests are checking out" icon={ArrowUp} />
        <StatCard title="New Bookings" value="+0" description="bookings created today" icon={PlusCircle} />
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Current Bookings</CardTitle>
                    <CardDescription>Browse and filter your bookings, or select multiple to delete them.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search..." className="pl-8" />
                    </div>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                    {selectedBookings.length > 0 && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete ({selectedBookings.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the selected bookings.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                    <Checkbox 
                        onCheckedChange={handleSelectAll}
                        checked={isAllSelected}
                        aria-label="Select all"
                    />
                </TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        Loading bookings...
                    </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No bookings created yet.
                    </TableCell>
                </TableRow>
              ) : (bookings.map((booking) => {
                const currentStatus = statusConfig[booking.status] || { variant: 'secondary', icon: CircleOff, label: booking.status };
                const guestName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();

                return (
                    <TableRow key={booking.id} data-state={selectedBookings.includes(booking.id) && "selected"}>
                        <TableCell>
                            <Checkbox 
                                onCheckedChange={(checked) => handleSelectSingle(booking.id, !!checked)}
                                checked={selectedBookings.includes(booking.id)}
                                aria-label={`Select booking ${booking.id}`}
                            />
                        </TableCell>
                        <TableCell className="font-medium">{guestName || booking.email || "N/A"}</TableCell>
                        <TableCell>{format(parseISO(booking.checkIn), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>{format(parseISO(booking.checkOut), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={currentStatus.variant}>
                              <currentStatus.icon className="mr-1 h-3 w-3" />
                              {currentStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.priceTotal.toFixed(2)} €</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={`/dashboard/bookings/${booking.id}`}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View Details</span>
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleCopyLink(booking)}>
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy Booking Link</span>
                                </Button>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>Cancel</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
              )}))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
