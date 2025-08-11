
import Link from 'next/link';
import {
  Building2,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
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


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Link href="/admin" className="flex items-center gap-2 text-sidebar-foreground">
              <Building2 className="h-6 w-6 text-sidebar-primary" />
              <span className="text-lg font-bold font-headline">WESO B-system</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/admin">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Hotel erstellen">
                  <Link href="/admin/create-hotel">
                    <PlusCircle />
                    <span>Hotel erstellen</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Sicherheitsberater">
                  <Link href="/admin/security-advisor">
                    <ShieldCheck />
                    <span>Sicherheitsberater</span>
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
