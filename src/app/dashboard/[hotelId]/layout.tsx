


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
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Error loading hotel</h1>
                <p className="text-muted-foreground">{error || 'Hotel not found'}</p>
                <Button asChild className="mt-4">
                    <Link href="/admin">Go to Admin</Link>
                </Button>
            </div>
        </div>
    )
  }

  const hotelId = params.hotelId;

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
                <SidebarMenuButton asChild tooltip="New Booking">
                  <Link href={`/dashboard/${hotelId}/bookings/create-booking`}>
                    <PlusCircle />
                    <span>New Booking</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Bookings">
                  <Link href={`/dashboard/${hotelId}/bookings`}>
                    <BookCopy />
                    <span>Bookings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href={`/dashboard/${hotelId}/settings`}>
                    <Settings />
                    <span>Settings</span>
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

    
