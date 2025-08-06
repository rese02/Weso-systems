import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const hotels = [
  { id: 'hotel-01', name: 'Hotel Paradies', ownerEmail: 'kontakt@hotel-paradies.de', domain: 'hotel-paradies.de' },
  { id: 'hotel-02', name: 'Seaside Resort', ownerEmail: 'manager@seasideresort.com', domain: 'seasideresort.com' },
  { id: 'hotel-03', name: 'Mountain Retreat', ownerEmail: 'info@mountainretreat.io', domain: 'mountainretreat.io' },
  { id: 'hotel-04', name: 'Urban Getaway', ownerEmail: 'contact@urbangetaway.co', domain: 'urbangetaway.co' },
  { id: 'hotel-05', name: 'The Grand Hotel', ownerEmail: 'reservations@thegrand.com', domain: 'thegrand.com' },
];

export default function AdminDashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
          <div className="grid gap-1">
              <h1 className="text-3xl font-bold font-headline md:text-4xl">Hotels Overview</h1>
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
          <CardDescription>A list of all hotel booking systems under your agency.</CardDescription>
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
              {hotels.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell className="font-medium">{hotel.name}</TableCell>
                  <TableCell>{hotel.ownerEmail}</TableCell>
                  <TableCell>
                    <Link href={`/booking/${hotel.id}`} className="underline" target="_blank"> 
                      {hotel.domain}
                    </Link>
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
                        <DropdownMenuItem asChild><Link href="/dashboard">View Dashboard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboard/settings">Edit Settings</Link></DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
