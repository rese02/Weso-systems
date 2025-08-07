
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, RefreshCw, Trash2, Eye, ArrowUp, ArrowDown, CheckCircle2, Clock, CircleOff, Search, Copy } from 'lucide-react';
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


const statusConfig: { [key: string]: { variant: 'default' | 'secondary' | 'outline' | 'destructive', icon: React.ElementType, label: string, color: string } } = {
    'Confirmed': { variant: 'default', icon: CheckCircle2, label: 'Bestätigt', color: 'bg-green-500 hover:bg-green-600' },
    'Pending': { variant: 'destructive', icon: Clock, label: 'Ausstehend', color: 'bg-yellow-500 hover:bg-yellow-600' },
    'Open': { variant: 'secondary', icon: CircleOff, label: 'Offen', color: 'bg-red-500 hover:bg-red-600' },
    'Partial Payment': { variant: 'outline', icon: CheckCircle2, label: 'Teilzahlung', color: 'border-green-500 text-green-500' },
}

const StatCard = ({ title, value, description, icon: Icon, trendIcon: TrendIcon }: { title: string, value: string, description: string, icon: React.ElementType, trendIcon?: React.ElementType }) => (
    <Card>
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <CardDescription>{title}</CardDescription>
                {TrendIcon && <TrendIcon className="h-4 w-4 text-muted-foreground" />}
            </div>
            <CardTitle className="text-4xl font-bold">{value}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const exampleBooking: Booking = {
    id: 'example-1',
    firstName: 'Max',
    lastName: 'Mustermann (Beispiel)',
    email: 'max@example.com',
    checkIn: new Date().toISOString(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    roomType: 'Suite',
    priceTotal: 450.00,
    status: 'Confirmed',
    createdAt: new (require('firebase/firestore').Timestamp)(Math.floor(Date.now() / 1000), 0),
    bookingLinkId: 'example-link',
    hotelId: 'example-hotel',
};


export default function HotelierDashboardPage() {
  const { bookings, isLoading, removeBooking } = useBookings();
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const { addLinkFromBooking } = useBookingLinks();
  const { toast } = useToast();
  const router = useRouter();

  const displayBookings = bookings.length === 0 && !isLoading ? [exampleBooking] : bookings;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(displayBookings.map(b => b.id));
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
    const bookingsToDelete = selectedBookings.filter(id => id !== 'example-1');
    if (bookingsToDelete.length === 0) {
        toast({ title: "Aktion nicht möglich", description: "Die Beispiel-Buchung kann nicht gelöscht werden." });
        return;
    }

    try {
        await Promise.all(bookingsToDelete.map(id => removeBooking(id)));
        setSelectedBookings([]);
        toast({
            title: "Buchungen gelöscht",
            description: "Die ausgewählten Buchungen wurden erfolgreich gelöscht.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Fehler",
            description: "Die Buchungen konnten nicht gelöscht werden.",
        });
    }
  }

  const handleCopyLink = async (booking: Booking) => {
     if (booking.id === 'example-1') {
        toast({ title: "Aktion nicht möglich", description: "Für eine Beispiel-Buchung kann kein Link erstellt werden."});
        return;
     }

     const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return '';
    }
    
    try {
        const newLink = await addLinkFromBooking({
            roomType: booking.roomType || 'Standard',
            checkIn: format(parseISO(booking.checkIn), 'yyyy-MM-dd'),
            checkOut: format(parseISO(booking.checkOut), 'yyyy-MM-dd'),
            priceTotal: booking.priceTotal,
        }, 7);

        const fullLink = `${getBaseUrl()}/guest/${newLink.id}`;
        await navigator.clipboard.writeText(fullLink);
        toast({
            title: "Link Copied",
            description: "The booking link has been copied to your clipboard.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create or copy the link.",
        });
    }
  }

  const isAllSelected = displayBookings.length > 0 && selectedBookings.length === displayBookings.length;


  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Buchungsübersicht</h1>
              <p className="text-muted-foreground">Verwalten Sie hier alle Ihre Buchungen.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Aktualisieren
            </Button>
            <Button asChild>
                <Link href="/dashboard/create-booking">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Neue Buchung erstellen
                </Link>
            </Button>
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Ankünfte heute" value="0" description="(0 Buchungen) Gäste checken heute ein" icon={ArrowDown} trendIcon={ArrowDown} />
        <StatCard title="Abreisen heute" value="0" description="(0 Buchungen) Gäste checken heute aus" icon={ArrowUp} trendIcon={ArrowUp} />
        <StatCard title="Neue Buchungen" value="+0" description="heute erstellte Buchungen" icon={PlusCircle} />
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Aktuelle Buchungen</CardTitle>
                    <CardDescription>Durchsuchen und filtern Sie Ihre Buchungen oder wählen Sie Buchungen aus, um sie gesammelt zu löschen.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Suchen..." className="pl-8" />
                    </div>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status filtern" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Status</SelectItem>
                            <SelectItem value="confirmed">Bestätigt</SelectItem>
                            <SelectItem value="pending">Ausstehend</SelectItem>
                        </SelectContent>
                    </Select>
                    {selectedBookings.length > 0 && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Löschen ({selectedBookings.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Diese Aktion kann nicht rückgängig gemacht werden. Dadurch werden die ausgewählten Buchungen dauerhaft gelöscht.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>Löschen</AlertDialogAction>
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
                        aria-label="Alle auswählen"
                    />
                </TableHead>
                <TableHead>Gast</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gesamtpreis</TableHead>
                <TableHead><span className="sr-only">Aktionen</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        Lade Buchungen...
                    </TableCell>
                </TableRow>
              ) : displayBookings.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        Noch keine Buchungen erstellt.
                    </TableCell>
                </TableRow>
              ) : (displayBookings.map((booking) => {
                const currentStatus = statusConfig[booking.status] || { variant: 'secondary', icon: CircleOff, label: booking.status, color: 'bg-gray-500' };
                const guestName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();

                return (
                    <TableRow key={booking.id} data-state={selectedBookings.includes(booking.id) && "selected"}>
                        <TableCell>
                            <Checkbox 
                                onCheckedChange={(checked) => handleSelectSingle(booking.id, !!checked)}
                                checked={selectedBookings.includes(booking.id)}
                                aria-label={`Buchung ${booking.id} auswählen`}
                                disabled={booking.id === 'example-1'}
                            />
                        </TableCell>
                        <TableCell className="font-medium">{guestName || "N/A"}</TableCell>
                        <TableCell>{format(parseISO(booking.checkIn), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>{format(parseISO(booking.checkOut), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={currentStatus.variant} className={currentStatus.color}>
                              <currentStatus.icon className="mr-1 h-3 w-3" />
                              {currentStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.priceTotal.toFixed(2)} €</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Button asChild variant="ghost" size="icon" disabled={booking.id === 'example-1'}>
                                    <Link href={`/dashboard/bookings/${booking.id}`}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View Details</span>
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleCopyLink(booking)} disabled={booking.id === 'example-1'}>
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy Booking Link</span>
                                </Button>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={booking.id === 'example-1'}>
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>Bearbeiten</DropdownMenuItem>
                                    <DropdownMenuItem>Stornieren</DropdownMenuItem>
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
