
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, PlusCircle, Loader2 } from 'lucide-react';
import { getBookingsForHotel } from '@/lib/actions/booking.actions';
import type { Booking } from '@/lib/definitions';
import { parseISO, isToday, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const StatCard = ({ title, value, description, icon: Icon, isLoading }: { title: string, value: string, description: string, icon: React.ElementType, isLoading: boolean }) => (
    <Card>
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <CardDescription>{title}</CardDescription>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            {isLoading ? <Loader2 className="h-10 w-10 animate-spin my-2" /> : <CardTitle className="text-4xl font-bold">{value}</CardTitle>}
        </CardHeader>
        <CardContent>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);


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
    const today = startOfDay(new Date());
    const arrivals = allBookings.filter(b => b.checkIn && isToday(parseISO(b.checkIn))).length;
    const departures = allBookings.filter(b => b.checkOut && isToday(parseISO(b.checkOut))).length;
    const newBookings = allBookings.filter(b => b.createdAt && isToday(b.createdAt.toDate())).length;
    return { arrivals, departures, newBookings };
  }, [allBookings]);


  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-1">
          <h1 className="text-3xl font-bold font-headline md:text-4xl">Dashboard</h1>
          <p className="text-muted-foreground">Eine schnelle Übersicht über die heutigen Aktivitäten Ihres Hotels.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Anreisen heute" value={String(stats.arrivals)} description="Gäste, die heute einchecken" icon={ArrowDown} isLoading={isLoading} />
        <StatCard title="Abreisen heute" value={String(stats.departures)} description="Gäste, die heute auschecken" icon={ArrowUp} isLoading={isLoading} />
        <StatCard title="Neue Buchungen heute" value={`+${stats.newBookings}`} description="Buchungen, die heute erstellt wurden" icon={PlusCircle} isLoading={isLoading} />
      </div>

       <div className="grid gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Willkommen bei HotelHub Central</CardTitle>
                <CardDescription>
                    Nutzen Sie die Navigation auf der linken Seite, um alle Ihre Buchungen zu verwalten, neue Buchungen zu erstellen oder Ihre Hoteleinstellungen anzupassen.
                </CardDescription>
            </CardHeader>
        </Card>
       </div>
    </div>
  );
}
