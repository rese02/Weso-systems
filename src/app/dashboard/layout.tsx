
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


export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { hotelId: string };
}) {
  const { hotel, error } = await getHotelById(params.hotelId);

  // In a real app, you'd want a nicer error state
  if (error || !hotel) {
    return <div>Error loading hotel: {error || 'Hotel not found'}</div>
  }

  const hotelId = params.hotelId;

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex flex-col text-sidebar-foreground">
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
                <SidebarMenuButton asChild tooltip="New Booking">
                  <Link href={`/dashboard/${hotelId}/create-booking`}>
                    <PlusCircle />
                    <span>Neue Buchung</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Bookings">
                  <Link href={`/dashboard/${hotelId}/bookings`}>
                    <BookCopy />
                    <span>Buchungen</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
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
            <DashboardHeader>
                <SidebarTrigger />
            </DashboardHeader>
            <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
  );
}
