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
} from "@/components/ui/alert-dialog"
import { useBookingLinks } from '@/hooks/use-booking-links';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';


const initialBookings = [
    { id: 'BPXMTR', guestName: 'Nawal Safar', checkIn: '21.09.2025', checkOut: '24.09.2025', status: 'Confirmed', lastChange: '05.06.2025, 08:40:18', paymentStatus: 'Partial Payment', roomType: 'double', priceTotal: 360 },
    { id: 'RVBEMD', guestName: 'Daniela varnero', checkIn: '25.01.2026', checkOut: '29.01.2026', status: 'Confirmed', lastChange: '04.06.2025, 06:46:55', paymentStatus: 'Partial Payment', roomType: 'double', priceTotal: 480 },
    { id: 'BBZGVD', guestName: 'Khalid AlKhozai', checkIn: '24.09.2025', checkOut: '28.09.2025', status: 'Confirmed', lastChange: '28.07.2025, 16:14:34', paymentStatus: 'Partial Payment', roomType: 'suite', priceTotal: 800 },
    { id: 'CKGUZD', guestName: 'Anetta chodorska', checkIn: '20.12.2025', checkOut: '27.12.2025', status: 'Confirmed', lastChange: '28.07.2025, 14:12:37', paymentStatus: 'Partial Payment', roomType: 'single', priceTotal: 560 },
    { id: 'MWG9IR', guestName: 'Ligia Baran', checkIn: '03.01.2026', checkOut: '09.01.2026', status: 'Pending', lastChange: '28.07.2025, 06:42:54', paymentStatus: 'Open', roomType: 'single', priceTotal: 480 },
    { id: 'BC7EGC', guestName: 'Alexis Morant', checkIn: '09.08.2025', checkOut: '10.08.2025', status: 'Confirmed', lastChange: '28.07.2025, 06:32:18', paymentStatus: 'Partial Payment', roomType: 'suite', priceTotal: 200 },
    { id: 'VV1AAH', guestName: 'bryony skinn', checkIn: '19.03.2026', checkOut: '22.03.2026', status: 'Confirmed', lastChange: '20.07.2025, 15:13:23', paymentStatus: 'Partial Payment', roomType: 'double', priceTotal: 360 },
    { id: 'B66SZQ', guestName: 'Anthony Stein', checkIn: '13.08.2025', checkOut: '17.08.2025', status: 'Confirmed', lastChange: '17.07.2025, 17:31:57', paymentStatus: 'Partial Payment', roomType: 'single', priceTotal: 320 },
];

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


export default function HotelierDashboardPage() {
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const { addLinkFromBooking } = useBookingLinks();
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

  const handleDeleteSelected = () => {
    setBookings(prev => prev.filter(b => !selectedBookings.includes(b.id)));
    setSelectedBookings([]);
  }

  const handleCopyLink = (booking: typeof initialBookings[0]) => {
     const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return '';
    }
    
    const newLink = addLinkFromBooking({
        roomType: booking.roomType,
        checkIn: format(parse(booking.checkIn, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
        checkOut: format(parse(booking.checkOut, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
        priceTotal: booking.priceTotal,
    }, 7);

    const fullLink = `${getBaseUrl()}/booking/hotel-paradies?linkId=${newLink.id}`;
    navigator.clipboard.writeText(fullLink);
    toast({
        title: "Link Copied",
        description: "The booking link has been copied to your clipboard.",
    });
  }

  const isAllSelected = bookings.length > 0 && selectedBookings.length === bookings.length;
  const isSomeSelected = selectedBookings.length > 0 && selectedBookings.length < bookings.length;


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
                                    Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird die ausgewählte Buchung dauerhaft gelöscht.
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
                <TableHead>Buchungs-ID</TableHead>
                <TableHead>Gast</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Letzte Änderung</TableHead>
                <TableHead>Zahlungsstatus</TableHead>
                <TableHead><span className="sr-only">Aktionen</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const currentStatus = statusConfig[booking.status] || { variant: 'secondary', icon: CircleOff, label: booking.status, color: 'bg-gray-500' };
                const paymentStatus = statusConfig[booking.paymentStatus] || { variant: 'secondary', icon: CircleOff, label: booking.paymentStatus, color: 'bg-gray-500' };

                return (
                    <TableRow key={booking.id} data-state={selectedBookings.includes(booking.id) && "selected"}>
                        <TableCell>
                            <Checkbox 
                                onCheckedChange={(checked) => handleSelectSingle(booking.id, !!checked)}
                                checked={selectedBookings.includes(booking.id)}
                                aria-label={`Buchung ${booking.id} auswählen`}
                            />
                        </TableCell>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>{booking.guestName}</TableCell>
                        <TableCell>{booking.checkIn}</TableCell>
                        <TableCell>{booking.checkOut}</TableCell>
                        <TableCell>
                          <Badge variant={currentStatus.variant} className={currentStatus.color}>
                              <currentStatus.icon className="mr-1 h-3 w-3" />
                              {currentStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.lastChange}</TableCell>
                        <TableCell>
                          <Badge variant={paymentStatus.variant} className={paymentStatus.color}>
                              <paymentStatus.icon className="mr-1 h-3 w-3" />
                              {paymentStatus.label}
                          </Badge>
                        </TableCell>
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
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>Bearbeiten</DropdownMenuItem>
                                    <DropdownMenuItem>Stornieren</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
