import Link from 'next/link';
import {
  LayoutDashboard,
  PlusCircle,
  Shield,
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
import { verifyAuth } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionCookie = cookies().get('session')?.value;
  const decodedToken = await verifyAuth(sessionCookie);

  if (!decodedToken || decodedToken.role !== 'agency') {
    redirect('/agency/login');
  }

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Link href="/admin" className="flex items-center gap-2 text-sidebar-foreground">
              <Shield className="h-6 w-6" />
              <span className="text-lg font-bold font-headline">Weso Systems</span>
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
