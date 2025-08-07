
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useHotels } from '@/hooks/use-hotels';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation';


export default function AdminDashboardPage() {
  const { hotels, removeHotel, isLoading } = useHotels();
  const router = useRouter();

  const handleDelete = async (hotelId: string) => {
    try {
        await removeHotel(hotelId);
    } catch (error) {
        console.error("Failed to delete hotel", error);
    }
  }

  if (isLoading) {
    return <div>Lade Hotels...</div>
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Hotelübersicht</h1>
              <p className="text-muted-foreground">Verwalten Sie hier alle Ihre Kundenhotels.</p>
          </div>
          <Button asChild>
              <Link href="/admin/create-hotel">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Neues Hotel erstellen
              </Link>
          </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Verwaltete Hotels</CardTitle>
          <CardDescription>Eine Liste aller Hotelbuchungssysteme Ihrer Agentur.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotelname</TableHead>
                <TableHead>Besitzer E-Mail</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead><span className="sr-only">Aktionen</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Noch keine Hotels erstellt.
                    </TableCell>
                </TableRow>
              ) : (
                hotels.map((hotel) => (
                    <TableRow key={hotel.id}>
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                    <TableCell>{hotel.ownerEmail}</TableCell>
                    <TableCell>
                        <a href={`/dashboard`} className="underline" target="_blank"> 
                        {hotel.domain}
                        </a>
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menü umschalten</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push('/dashboard')}>Dashboard anzeigen</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>Einstellungen bearbeiten</DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Löschen</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird das Hotel dauerhaft gelöscht.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(hotel.id)}>Löschen</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    