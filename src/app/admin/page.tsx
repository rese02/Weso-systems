
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

export default async function AdminDashboardPage() {
  const { hotels, error } = await getHotels();

  const handleDelete = async (hotelId: string) => {
    "use server";
    try {
        await deleteHotel(hotelId);
        revalidatePath('/admin');
    } catch (error) {
        console.error("Failed to delete hotel", error);
        // Optionally, return an error message to display
    }
  }

  if (error) {
    return <div className="text-destructive">Error loading hotels: {error}</div>;
  }
  
  if (!hotels) {
      return <div>Loading hotels...</div>;
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Hotel Overview</h1>
              <p className="text-muted-foreground">Manage all your client hotels here.</p>
          </div>
          <Button asChild>
              <Link href="/admin/create-hotel">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Hotel
              </Link>
          </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Managed Hotels</CardTitle>
          <CardDescription>A list of all hotel booking systems for your agency.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel Name</TableHead>
                <TableHead>Owner Email</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No hotels created yet.
                    </TableCell>
                </TableRow>
              ) : (
                hotels.map((hotel) => (
                    <TableRow key={hotel.id}>
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                    <TableCell>{hotel.ownerEmail}</TableCell>
                    <TableCell>
                        <Link href={`/dashboard?hotelId=${hotel.id}`} className="underline" target="_blank" rel="noopener noreferrer"> 
                          {hotel.domain}
                        </Link>
                    </TableCell>
                    <TableCell>
                      <form>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/dashboard?hotelId=${hotel.id}`}>View Dashboard</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/dashboard/settings?hotelId=${hotel.id}`}>Edit Settings</Link></DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the hotel and all associated data.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction formAction={async () => {
                                      "use server";
                                      await handleDelete(hotel.id)
                                    }} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                        </DropdownMenu>
                      </form>
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
