
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, BookCopy, CheckCircle2, Clock, PlusCircle, List, ShieldCheck, Database, HardDrive, LineChart, Loader2 } from 'lucide-react';
import { getBookingsForHotel } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

const StatCard = ({ title, value, description, icon: Icon, isLoading, valuePrefix = '' }: { title: string, value: string, description: string, icon: React.ElementType, isLoading: boolean, valuePrefix?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                <div className="text-2xl font-bold">{valuePrefix}{value}</div>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const SystemStatusItem = ({ name, icon: Icon }: { name: string, icon: React.ElementType }) => (
    <div className="flex items-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="ml-2 text-sm">{name}</span>
        <span className="ml-auto text-sm text-green-600 font-medium">Verbunden</span>
    </div>
);

const ActivityItem = ({ booking, hotelId }: { booking: Booking, hotelId: string }) => {
    const updatedAt = booking.updatedAt ? format(booking.updatedAt.toDate(), 'dd.M.yyyy', { locale: de }) : format(parseISO(booking.createdAt as unknown as string), 'dd.M.yyyy', { locale: de });
    const guestName = booking.firstName && booking.lastName ? `${booking.firstName} ${booking.lastName}` : `ID ${booking.id.substring(0, 6).toUpperCase()}`;
    return (
        <Link href={`/dashboard/bookings/${booking.id}?hotelId=${hotelId}`} className="flex items-start hover:bg-muted/50 p-2 rounded-md">
             <div className="flex h-1.5 w-1.5 shrink-0 -translate-y-1 items-center justify-center rounded-full bg-primary mt-3 mr-3" />
            <p className="text-sm text-muted-foreground">
                Buchung für <span className="font-semibold text-foreground">{guestName}</span> wurde zuletzt am {updatedAt} aktualisiert. Status: <span className="font-semibold text-foreground">{booking.status}</span>
            </p>
        </Link>
    );
}

export default function HotelierDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hotelId = searchParams.get('hotelId');

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    if (!hotelId) {
       // In a real app, you might get the hotelId from auth context if the URL param is missing.
       // For now, we redirect to the admin page to select a hotel.
       toast({
        variant: "destructive",
        title: "Kein Hotel ausgewählt",
        description: "Bitte wählen Sie ein Hotel aus dem Admin-Bereich.",
      });
      router.push('/admin');
    } else {
        fetchBookings();
    }
  }, [hotelId, fetchBookings, toast, router]);

  const stats = useMemo(() => {
    const confirmedBookings = allBookings.filter(b => b.status === 'Confirmed');
    const pendingActions = allBookings.filter(b => b.status === 'Sent' || b.status === 'Submitted').length;
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.priceTotal, 0);
    const arrivalsToday = allBookings.filter(b => b.status === 'Confirmed' && b.checkIn && isToday(parseISO(b.checkIn))).length;


    return { 
        totalRevenue: totalRevenue.toFixed(2),
        totalBookings: allBookings.length,
        arrivalsToday: arrivalsToday,
        pendingActions
    };
  }, [allBookings]);
  
  const recentActivities = useMemo(() => {
    // Ensure createdAt is a Date object for sorting if updatedAt is missing
    const sortedBookings = [...allBookings].sort((a, b) => {
        const dateA = a.updatedAt ? a.updatedAt.toMillis() : new Date(a.createdAt as any).getTime();
        const dateB = b.updatedAt ? b.updatedAt.toMillis() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
    return sortedBookings.slice(0, 3);
  }, [allBookings]);

  if (!hotelId) {
    return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" /> 
            <span className="ml-2">Kein Hotel ausgewählt. Umleitung...</span>
        </div>
    )
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Dashboard</h1>
            <p className="text-muted-foreground">Übersicht Ihrer Pradell Buchungsanwendung.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Gesamtumsatz" value={stats.totalRevenue} valuePrefix="€ " description="Aus bestätigten Buchungen" icon={Euro} isLoading={isLoading} />
            <StatCard title="Gesamtbuchungen" value={String(stats.totalBookings)} description="Alle Zeiten" icon={BookCopy} isLoading={isLoading} />
            <StatCard title="Heutige Anreisen" value={String(stats.arrivalsToday)} description="Bestätigt für heute" icon={CheckCircle2} isLoading={isLoading} />
            <StatCard title="Ausstehende Aktionen" value={String(stats.pendingActions)} description="Warten auf Gastdaten/Bestätigung" icon={Clock} isLoading={isLoading} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-5">
            <Card className="md:col-span-3">
                <CardHeader>
                    <CardTitle>Schnellaktionen</CardTitle>
                    <CardDescription>Führen Sie gängige Aufgaben schnell aus.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Button size="lg" className="justify-start bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40" asChild>
                         <Link href={`/dashboard/create-booking?hotelId=${hotelId}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Neue Buchung erstellen
                         </Link>
                    </Button>
                     <Button size="lg" variant="outline" className="justify-start" asChild>
                        <Link href={`/dashboard/bookings?hotelId=${hotelId}`}>
                            <List className="mr-2 h-4 w-4" />
                            Alle Buchungen anzeigen
                        </Link>
                     </Button>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/> Systemstatus</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex items-center font-medium text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="ml-2 text-sm">Alle Kernsysteme betriebsbereit</span>
                    </div>
                     <div className="space-y-3 pl-1 border-l-2 ml-2">
                        <SystemStatusItem name="KI-Dienste" icon={LineChart} />
                        <SystemStatusItem name="Datenbank" icon={Database} />
                        <SystemStatusItem name="Speicher" icon={HardDrive} />
                     </div>
                </CardContent>
            </Card>
        </div>

       <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Letzte Aktivitäten</CardTitle>
                    <CardDescription>Neueste Aktualisierungen und wichtige Ereignisse.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="mt-2">Lade Aktivitäten...</p>
                        </div>
                    ) : recentActivities.length > 0 ? (
                       recentActivities.map(booking => <ActivityItem key={booking.id} booking={booking} hotelId={hotelId} />)
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">Keine aktuellen Aktivitäten gefunden.</p>
                    )}
                </CardContent>
            </Card>
       </div>
    </div>
  );

    