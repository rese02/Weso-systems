
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


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex flex-col text-sidebar-foreground">
              <span className="text-lg font-bold font-headline">Pradell</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New Booking">
                  <Link href="/dashboard/create-booking">
                    <PlusCircle />
                    <span>Neue Buchung</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Bookings">
                  <Link href="/dashboard/bookings">
                    <BookCopy />
                    <span>Buchungen</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/dashboard/settings">
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

    