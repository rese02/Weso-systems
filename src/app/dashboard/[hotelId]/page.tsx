
'use client';

import { useState, useEffect, useMemo, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, BookCopy, CheckCircle2, Clock, PlusCircle, List, ShieldCheck, Database, HardDrive, LineChart, Loader2, Users } from 'lucide-react';
import { getBookingsForHotel } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isToday, startOfDay } from 'date-fns';
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
        <Icon className="h-4 w-4 text-primary" />
        <span className="ml-2 text-sm">{name}</span>
        <span className="ml-auto text-sm text-primary font-medium">Verbunden</span>
    </div>
);

const ActivityItem = ({ booking, hotelId }: { booking: Booking, hotelId: string }) => {
    const updatedAt = booking.updatedAt ? format(parseISO(booking.updatedAt), 'dd. M. yyyy', { locale: de }) : format(parseISO(booking.createdAt), 'dd. M. yyyy', { locale: de });
    const guestName = booking.firstName && booking.lastName ? `${booking.firstName} ${booking.lastName}` : `ID ${booking.id.substring(0, 6).toUpperCase()}`;
    return (
        <Link href={`/dashboard/${hotelId}/bookings/${booking.id}`} className="flex items-start hover:bg-muted/50 p-2 rounded-md transition-colors">
             <div className="flex h-1.5 w-1.5 shrink-0 -translate-y-1 items-center justify-center rounded-full bg-primary mt-3 mr-3" />
            <p className="text-sm text-muted-foreground">
                Buchung für <span className="font-semibold text-foreground">{guestName}</span> wurde zuletzt am {updatedAt} aktualisiert. Status: <span className="font-semibold text-foreground">{booking.status}</span>
            </p>
        </Link>
    );
}

export default function HotelierDashboardPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const router = useRouter();
  const { hotelId } = use(params);

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
    const confirmedStatuses: string[] = ['Confirmed', 'Partial Payment', 'Checked-in', 'Checked-out'];
    const confirmedBookings = allBookings.filter(b => confirmedStatuses.includes(b.status));
    const pendingActions = allBookings.filter(b => b.status === 'Sent' || b.status === 'Submitted').length;
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.priceTotal, 0);
    
    // Correctly check if the check-in date is today
    const today = startOfDay(new Date());
    const arrivalsToday = allBookings.filter(b => 
        b.status === 'Confirmed' && 
        b.checkIn && 
        startOfDay(parseISO(b.checkIn)).getTime() === today.getTime()
    ).length;

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
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
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
            <h1 className="text-2xl font-bold font-headline sm:text-3xl md:text-4xl">Dashboard</h1>
            <p className="text-muted-foreground">Übersicht Ihrer Buchungsanwendung.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Gesamtumsatz" value={stats.totalRevenue} valuePrefix="€ " description="Aus bestätigten Buchungen" icon={Euro} isLoading={isLoading} />
            <StatCard title="Gesamtbuchungen" value={String(stats.totalBookings)} description="Alle Zeiten" icon={BookCopy} isLoading={isLoading} />
            <StatCard title="Heutige Anreisen" value={String(stats.arrivalsToday)} description="Bestätigt für heute" icon={CheckCircle2} isLoading={isLoading} />
            <StatCard title="Ausstehende Aktionen" value={String(stats.pendingActions)} description="Warten auf Gastdaten/Bestätigung" icon={Clock} isLoading={isLoading} />
        </div>
        
        <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Schnellaktionen</CardTitle>
                    <CardDescription>Führen Sie gängige Aufgaben schnell aus.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <Button size="lg" className="justify-start" asChild>
                         <Link href={`/dashboard/${hotelId}/bookings/create-booking`}>
                            <PlusCircle />
                            <span>Neue Buchung erstellen</span>
                         </Link>
                    </Button>
                     <Button size="lg" variant="outline" className="justify-start" asChild>
                        <Link href={`/dashboard/${hotelId}/bookings`}>
                            <List />
                            <span>Alle Buchungen anzeigen</span>
                        </Link>
                     </Button>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/> Systemstatus</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex items-center font-medium text-primary">
                        <CheckCircle2 />
                        <span className="ml-2 text-sm">Alle Systeme betriebsbereit</span>
                    </div>
                     <div className="space-y-3 pl-1 border-l-2 ml-2 border-primary/20">
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
                        <div className="text-center text-muted-foreground p-4">
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
}
