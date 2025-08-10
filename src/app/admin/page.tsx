

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
        console.error("Failed to delete hotel", error);
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Could not load hotel data.</CardDescription>
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
                <CardTitle>Loading...</CardTitle>
                <CardDescription>Fetching hotel data.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Please wait.</p>
            </CardContent>
        </Card>
      );
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
                <TableHead>Created At</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No hotels created yet. <Link href="/admin/create-hotel" className="font-medium text-primary underline">Create one now</Link>.
                    </TableCell>
                </TableRow>
              ) : (
                hotels.map((hotel) => (
                    <TableRow key={hotel.id}>
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                    <TableCell>{hotel.ownerEmail}</TableCell>
                    <TableCell>
                        <Link href={`http://${hotel.domain}`} className="underline" target="_blank" rel="noopener noreferrer"> 
                          {hotel.domain}
                        </Link>
                    </TableCell>
                    <TableCell>
                        {hotel.createdAt ? format(new Date(hotel.createdAt), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/dashboard/${hotel.id}`}>View Dashboard</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/dashboard/${hotel.id}/settings`}>Edit Settings</Link></DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <div className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive focus:text-destructive focus:bg-destructive/10">Delete</div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <form action={handleDelete}>
                                        <input type="hidden" name="hotelId" value={hotel.id} />
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the hotel and all associated data.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction type="submit">Delete</AlertDialogAction>
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
        </CardContent>
      </Card>
    </div>
  );
}
