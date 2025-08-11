
'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback, use } from 'react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { deleteBooking, getBookingsForHotel } from '@/lib/actions/booking.actions';
import type { Booking, BookingStatus } from '@/lib/definitions';


const statusConfig: { [key in BookingStatus]: { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ElementType, label: string } } = {
    'Open': { variant: 'secondary', icon: CircleOff, label: 'Offen' },
    'Sent': { variant: 'outline', icon: Send, label: 'Gesendet' },
    'Submitted': { variant: 'outline', icon: Clock, label: 'Übermittelt' },
    'Confirmed': { variant: 'default', icon: CheckCircle2, label: 'Bestätigt' },
    'Cancelled': { variant: 'destructive', icon: CircleOff, label: 'Storniert' },
    'Checked-in': { variant: 'outline', icon: CheckCircle2, label: 'Check-in' },
    'Checked-out': { variant: 'secondary', icon: CheckCircle2, label: 'Check-out' },
    'Partial Payment': { variant: 'outline', icon: CheckCircle2, label: 'Teilzahlung' },
};

export default function BookingsListPage({ params: paramsPromise }: { params: Promise<{ hotelId: string }>}) {
  const router = useRouter();
  const { hotelId } = use(paramsPromise);
  
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const fetchBookings = useCallback(async () => {
    if (!hotelId) return;
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
  }, [hotelId, toast]);

  useEffect(() => {
    if (hotelId) {
      fetchBookings();
    } else {
       toast({
        title: "Hotel-ID fehlt",
        description: "Es wurde keine Hotel-ID gefunden, um Buchungen zu laden.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [hotelId, fetchBookings, toast]);

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
  
  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedBookings(filteredBookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectSingle = (id: string, checked: boolean | string) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, id]);
    } else {
      setSelectedBookings(prev => prev.filter(bId => bId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!hotelId) return;
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

  if (!hotelId) {
      return (
        <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center">
                <CardTitle>Keine Hotel-ID gefunden</CardTitle>
                <CardDescription>Bitte wählen Sie ein Hotel aus dem Admin-Dashboard aus.</CardDescription>
                <Button asChild className="mt-4"><Link href="/admin">Zum Admin-Dashboard</Link></Button>
            </Card>
        </div>
      )
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Buchungsübersicht</h1>
              <p className="text-muted-foreground">Verwalten Sie hier alle Ihre Buchungen.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button variant="outline" onClick={fetchBookings} disabled={isLoading}>
                <RefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Aktualisieren</span>
            </Button>
            <Button asChild>
                <Link href={`/dashboard/${hotelId}/create-booking`}>
                    <PlusCircle />
                    <span>Neue Buchung</span>
                </Link>
            </Button>
          </div>
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                    <CardTitle>Aktuelle Buchungen</CardTitle>
                    <CardDescription>Durchsuchen und filtern Sie Ihre Buchungen oder wählen Sie mehrere aus, um sie zu löschen.</CardDescription>
                </div>
                <div className="flex flex-col w-full sm:flex-row sm:items-center sm:w-auto gap-2">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Suche nach Name..." className="pl-8 w-full sm:w-auto" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Nach Status filtern" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Status</SelectItem>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedBookings.length > 0 && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    <Trash2 />
                                    <span>Löschen ({selectedBookings.length})</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Diese Aktion kann nicht rückgängig gemacht werden. Dadurch werden die ausgewählten Buchungen endgültig gelöscht.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                  <TableHead className="hidden sm:table-cell">Check-in</TableHead>
                  <TableHead className="hidden sm:table-cell">Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Gesamtpreis</TableHead>
                  <TableHead><span className="sr-only">Aktionen</span></TableHead>
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
                          {allBookings.length > 0 ? "Keine Buchungen entsprechen Ihrer Suche." : "Noch keine Buchungen erstellt."}
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
                                  aria-label={`Buchung ${booking.id} auswählen`}
                              />
                          </TableCell>
                          <TableCell className="font-medium">{guestName || "N/A"}</TableCell>
                          <TableCell className="hidden sm:table-cell">{booking.checkIn ? format(parseISO(booking.checkIn), 'dd.MM.yy') : 'N/A'}</TableCell>
                          <TableCell className="hidden sm:table-cell">{booking.checkOut ? format(parseISO(booking.checkOut), 'dd.MM.yy') : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={currentStatus.variant} className="text-xs">
                                <currentStatus.icon className="mr-1 h-3 w-3" />
                                <span className="hidden md:inline">{currentStatus.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{booking.priceTotal.toFixed(2)} €</TableCell>
                          <TableCell>
                              <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal />
                                  <span className="sr-only">Menü umschalten</span>
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/dashboard/${hotelId}/bookings/${booking.id}`)}>
                                    <Eye className="mr-2 h-4 w-4"/>Details anzeigen
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/dashboard/${hotelId}/bookings/${booking.id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4"/>Bearbeiten
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyLink(booking)} disabled={!booking.bookingLinkId}>
                                    <Copy className="mr-2 h-4 w-4"/>Link kopieren
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                      </TableRow>
                )}))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
