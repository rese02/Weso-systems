
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, BookCopy, CheckCircle2, Clock, PlusCircle, List, ShieldCheck, Database, HardDrive, LineChart, Loader2 } from 'lucide-react';
import { getBookingsForHotel } from '@/lib/actions/booking.actions';
import type { Booking, BookingStatus } from '@/lib/definitions';
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

const ActivityItem = ({ booking }: { booking: Booking }) => {
    const updatedAt = booking.updatedAt ? format(booking.updatedAt.toDate(), 'dd.M.yyyy', { locale: de }) : format(parseISO(booking.checkIn), 'dd.M.yyyy', { locale: de });
    return (
        <div className="flex items-start">
             <div className="flex h-1.5 w-1.5 shrink-0 -translate-y-1 items-center justify-center rounded-full bg-primary mt-3 mr-3" />
            <p className="text-sm text-muted-foreground">
                Buchung <span className="font-semibold text-foreground">#{booking.id.substring(0, 6).toUpperCase()}</span> für <span className="font-semibold text-foreground">{booking.firstName} {booking.lastName}</span> wurde zuletzt am {updatedAt} aktualisiert. Status: <span className="font-semibold text-foreground">{booking.status}</span>
            </p>
        </div>
    );
}

export default function HotelierDashboardPage() {
  const hotelId = 'hotelhub-central';
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
    fetchBookings();
  }, [toast]);

  const stats = useMemo(() => {
    const confirmedBookings = allBookings.filter(b => b.status === 'Confirmed');
    const pendingActions = allBookings.filter(b => b.status === 'Sent' || b.status === 'Submitted').length;
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.priceTotal, 0);
    const arrivalsToday = allBookings.filter(b => b.status === 'Confirmed' && isToday(parseISO(b.checkIn))).length;


    return { 
        totalRevenue: totalRevenue.toFixed(2),
        totalBookings: allBookings.length,
        arrivalsToday: arrivalsToday,
        pendingActions
    };
  }, [allBookings]);
  
  const recentActivities = useMemo(() => {
    return [...allBookings]
      .sort((a, b) => (b.updatedAt?.toMillis() || b.createdAt.toMillis()) - (a.updatedAt?.toMillis() || a.createdAt.toMillis()))
      .slice(0, 3);
  }, [allBookings]);


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
                         <Link href="/dashboard/create-booking">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Neue Buchung erstellen
                         </Link>
                    </Button>
                     <Button size="lg" variant="outline" className="justify-start" asChild>
                        <Link href="/dashboard/bookings">
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
                       recentActivities.map(booking => <ActivityItem key={booking.id} booking={booking}/>)
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">Keine aktuellen Aktivitäten gefunden.</p>
                    )}
                </CardContent>
            </Card>
       </div>
    </div>
  );
