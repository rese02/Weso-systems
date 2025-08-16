
'use client';

import Link from 'next/link';
import {
  BookCopy,
  LayoutDashboard,
  PlusCircle,
  Settings,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { getHotelById } from '@/lib/actions/hotel.actions';
import { Button } from '@/components/ui/button';
import { useEffect, useState, use } from 'react';
import type { Hotel } from '@/lib/definitions';
import { Loader2 } from 'lucide-react';


export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = use(params);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hotelId) {
      setIsLoading(true);
      getHotelById(hotelId).then(result => {
        if (result.hotel) {
          setHotel(result.hotel);
        } else {
          setError(result.error || 'Hotel nicht gefunden');
        }
        setIsLoading(false);
      });
    }
  }, [hotelId]);

  if (isLoading) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin" />
             <p className="text-muted-foreground mt-2">Lade Hotel-Dashboard...</p>
        </div>
    )
  }

  if (error || !hotel) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Fehler beim Laden des Hotels</h1>
                <p className="text-muted-foreground">{error || 'Hotel not found'}</p>
                <Button asChild className="mt-4">
                    <Link href="/admin">Zum Admin</Link>
                </Button>
            </div>
        </div>
    )
  }

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex flex-col text-sidebar-foreground p-2">
              <span className="text-lg font-bold font-headline">{hotel.name}</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href={`/dashboard/${hotelId}`}>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Neue Buchung">
                  <Link href={`/dashboard/${hotelId}/bookings/create-booking`}>
                    <PlusCircle />
                    <span>Neue Buchung</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Buchungen">
                  <Link href={`/dashboard/${hotelId}/bookings`}>
                    <BookCopy />
                    <span>Buchungen</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Einstellungen">
                  <Link href={`/dashboard/${hotelId}/settings`}>
                    <Settings />
                    <span>Einstellungen</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <DashboardHeader logoUrl={hotel.logoUrl}>
                <SidebarTrigger />
            </DashboardHeader>
            <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
  );
}
