
'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, RefreshCw, Trash2, Eye, CheckCircle2, Clock, CircleOff, Search, Copy, Send, Loader2, Edit } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { deleteBooking, getBookingsForHotel } from '@/lib/actions/booking.actions';
import type { Booking, BookingStatus } from '@/lib/definitions';


const statusConfig: { [key in BookingStatus]: { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ElementType, label: string } } = {
    'Open': { variant: 'secondary', icon: CircleOff, label: 'Open' },
    'Sent': { variant: 'outline', icon: Send, label: 'Sent' },
    'Submitted': { variant: 'outline', icon: Clock, label: 'Submitted' },
    'Confirmed': { variant: 'default', icon: CheckCircle2, label: 'Confirmed' },
    'Cancelled': { variant: 'destructive', icon: CircleOff, label: 'Cancelled' },
    'Checked-in': { variant: 'outline', icon: CheckCircle2, label: 'Checked-in' },
    'Checked-out': { variant: 'secondary', icon: CheckCircle2, label: 'Checked-out' },
    'Partial Payment': { variant: 'outline', icon: CheckCircle2, label: 'Partial Payment' },
};

export default function BookingsListPage() {
  const hotelId = 'hotelhub-central'; 
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const router = useRouter();

  const fetchBookings = async () => {
    setIsLoading(true);
    const result = await getBookingsForHotel(hotelId);
    if (result.success && result.bookings) {
      setAllBookings(result.bookings);
    } else {
      toast({
        title: "Fehler beim Laden",
        description: result.error || "Buchungen konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return allBookings
      .filter(booking => {
        const guestName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim().toLowerCase();
        return guestName.includes(searchTerm.toLowerCase());
      })
      .filter(booking => {
        return statusFilter === 'all' || booking.status === statusFilter;
      });
  }, [allBookings, searchTerm, statusFilter]);
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(filteredBookings.map(b => b.id));
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
    const promises = selectedBookings.map(id => deleteBooking({ bookingId: id, hotelId }));
    await Promise.all(promises);
    toast({ title: "Buchungen gelöscht", description: `${selectedBookings.length} Buchung(en) wurden entfernt.` });
    setSelectedBookings([]);
    await fetchBookings();
  }

  const handleCopyLink = (booking: Booking) => {
     const getBaseUrl = () => window.location.origin;
    
    if (!booking.bookingLinkId) {
        toast({ variant: "destructive", title: "Fehler", description: "Für diese Buchung existiert kein Link." });
        return;
    }

    const fullLink = `${getBaseUrl()}/guest/${booking.bookingLinkId}`;
    navigator.clipboard.writeText(fullLink);
    toast({ title: "Link kopiert", description: "Der Buchungslink wurde in die Zwischenablage kopiert." });
  }

  const isAllSelected = filteredBookings.length > 0 && selectedBookings.length === filteredBookings.length;


  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Booking Overview</h1>
              <p className="text-muted-foreground">Manage all your bookings here.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchBookings} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                        <Input placeholder="Search by name..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
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
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        {allBookings.length > 0 ? "No bookings match your search." : "No bookings created yet."}
                    </TableCell>
                </TableRow>
              ) : (filteredBookings.map((booking) => {
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
                        <TableCell className="font-medium">{guestName || "N/A"}</TableCell>
                        <TableCell>{booking.checkIn ? format(parseISO(booking.checkIn), 'dd.MM.yyyy') : 'N/A'}</TableCell>
                        <TableCell>{booking.checkOut ? format(parseISO(booking.checkOut), 'dd.MM.yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={currentStatus.variant}>
                              <currentStatus.icon className="mr-1 h-3 w-3" />
                              {currentStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.priceTotal.toFixed(2)} €</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}><Eye className="mr-2"/>View Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${booking.id}/edit`)}><Edit className="mr-2"/>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyLink(booking)} disabled={!booking.bookingLinkId}><Copy className="mr-2"/>Copy Link</DropdownMenuItem>
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

