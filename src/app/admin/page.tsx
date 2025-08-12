
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { getHotels, deleteHotel } from '@/lib/actions/hotel.actions';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function AdminDashboardPage() {
  const { hotels, error } = await getHotels();

  const handleDelete = async (formData: FormData) => {
    "use server";
    const hotelId = formData.get('hotelId') as string;
    if (!hotelId) return;
    try {
        await deleteHotel(hotelId);
        revalidatePath('/admin');
    } catch (error) {
        console.error("Fehler beim Löschen des Hotels", error);
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fehler</CardTitle>
          <CardDescription>Hoteldaten konnten nicht geladen werden.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!hotels) {
      return (
        <Card>
           <CardHeader>
                <CardTitle>Wird geladen...</CardTitle>
                <CardDescription>Hoteldaten werden abgerufen.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Bitte warten.</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Hotelübersicht</h1>
              <p className="text-muted-foreground">Verwalten Sie hier alle Ihre Kundenhotels.</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/create-hotel">
                  <PlusCircle />
                  <span>Neues Hotel erstellen</span>
              </Link>
          </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Verwaltete Hotels</CardTitle>
          <CardDescription>Eine Liste aller Hotel-Buchungssysteme Ihrer Agentur.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotelname</TableHead>
                  <TableHead className="hidden md:table-cell">E-Mail des Besitzers</TableHead>
                  <TableHead className="hidden sm:table-cell">Domain</TableHead>
                  <TableHead className="hidden md:table-cell">Erstellt am</TableHead>
                  <TableHead><span className="sr-only">Aktionen</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          Noch keine Hotels erstellt. <Link href="/admin/create-hotel" className="font-medium text-primary underline">Jetzt eines erstellen</Link>.
                      </TableCell>
                  </TableRow>
                ) : (
                  hotels.map((hotel) => (
                      <TableRow key={hotel.id}>
                      <TableCell className="font-medium">{hotel.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{hotel.ownerEmail}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                          <Link href={`http://${hotel.domain}`} className="underline" target="_blank" rel="noopener noreferrer"> 
                            {hotel.domain}
                          </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                          {hotel.createdAt ? format(new Date(hotel.createdAt), 'PPP') : 'N/A'}
                      </TableCell>
                      <TableCell>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal />
                              <span className="sr-only">Menü umschalten</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild><Link href={`/dashboard/${hotel.id}`}>Dashboard anzeigen</Link></DropdownMenuItem>
                              <DropdownMenuItem asChild><Link href={`/dashboard/${hotel.id}/settings`}>Einstellungen bearbeiten</Link></DropdownMenuItem>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <div className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive focus:text-destructive focus:bg-destructive/10">Löschen</div>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <form action={handleDelete}>
                                          <input type="hidden" name="hotelId" value={hotel.id} />
                                          <AlertDialogHeader>
                                          <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              Diese Aktion kann nicht rückgängig gemacht werden. Dadurch werden das Hotel und alle zugehörigen Daten dauerhaft gelöscht.
                                          </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                              <AlertDialogAction type="submit">Löschen</AlertDialogAction>
                                          </AlertDialogFooter>
                                      </form>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    