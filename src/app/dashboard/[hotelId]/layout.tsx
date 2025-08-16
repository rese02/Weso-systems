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
import { verifyAuth } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';


export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { hotelId: string };
}) {
  const { hotelId } = params;
  
  const sessionCookie = cookies().get('session')?.value;
  const decodedToken = await verifyAuth(sessionCookie);

  if (!decodedToken) {
    redirect('/hotel/login');
  }

  // Allow agency to view any hotel dashboard
  if (decodedToken.role === 'agency') {
    // Role is sufficient, proceed.
  } 
  // For hoteliers, ensure they are accessing their own hotel
  else if (decodedToken.role !== 'hotelier' || decodedToken.hotelId !== hotelId) {
    const destination = (decodedToken.role === 'hotelier' && decodedToken.hotelId)
        ? `/dashboard/${decodedToken.hotelId}`
        : '/hotel/login';
    redirect(destination);
  }

  const { hotel, error } = await getHotelById(hotelId);

  if (error || !hotel) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Fehler beim Laden des Hotels</h1>
                <p className="text-muted-foreground">{error || 'Hotel nicht gefunden'}</p>
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
