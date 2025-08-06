'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { useBookingLinks } from '@/hooks/use-booking-links';
import { CreateBookingLinkDialog } from '@/components/booking/create-booking-link-dialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog"

export default function BookingLinksPage() {
    const { links, removeLink, isLoading } = useBookingLinks();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return '';
    }

    const copyToClipboard = (linkId: string) => {
        const link = `${getBaseUrl()}/booking/hotel-paradies?linkId=${linkId}`;
        navigator.clipboard.writeText(link);
        toast({
            title: "Link Copied",
            description: "The booking link has been copied to your clipboard.",
        });
    }
  
    if (isLoading) {
        return <div>Loading links...</div>
    }

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <div className="grid gap-1">
                    <h1 className="text-3xl font-bold font-headline md:text-4xl">Booking Links</h1>
                    <p className="text-muted-foreground">Create and manage pre-filled booking links for your guests.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Link
                </Button>
            </div>
             <CreateBookingLinkDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

            <Card>
                <CardHeader>
                    <CardTitle>Active Booking Links</CardTitle>
                    <CardDescription>A list of all currently active booking links.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Link ID</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Expires At</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {links.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No booking links created yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                links.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell className="font-mono">{link.id.split('-').pop()}</TableCell>
                                        <TableCell>{format(new Date(link.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                                        <TableCell>{format(new Date(link.expiresAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                                        <TableCell className="capitalize">{link.prefill.roomType}</TableCell>
                                        <TableCell>{link.prefill.priceTotal.toFixed(2)} €</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => copyToClipboard(link.id)}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copy Link
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                              <Trash2 className="mr-2 h-4 w-4" />
                                                              Delete
                                                          </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the booking link.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => removeLink(link.id)}>Delete</AlertDialogAction>
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
