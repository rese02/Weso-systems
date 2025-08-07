'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useHotels } from '@/hooks/use-hotels';
import type { Hotel } from '@/hooks/use-hotels';

export default function CreateHotelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { addHotel } = useHotels();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newHotel: Omit<Hotel, 'id'> = {
      name: formData.get('hotel-name') as string,
      ownerEmail: formData.get('email') as string,
      domain: formData.get('domain') as string,
    };
    
    if(!newHotel.name || !newHotel.ownerEmail || !newHotel.domain) {
        toast({
            variant: "destructive",
            title: "Fehler",
            description: "Bitte füllen Sie alle Felder aus.",
        });
        return;
    }

    try {
      await addHotel(newHotel);
      toast({
          title: "Hotel erstellt",
          description: "Das neue Hotelsystem wurde erfolgreich erstellt.",
      });
      router.push('/admin');
    } catch (error) {
       toast({
            variant: "destructive",
            title: "Fehler beim Erstellen",
            description: "Das Hotel konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        });
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
        <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Neues Hotel System erstellen</h1>
            <p className="text-muted-foreground">Füllen Sie das Formular aus, um ein neues Buchungssystem für einen Kunden einzurichten.</p>
        </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Hoteldetails</CardTitle>
            <CardDescription>Basisinformationen über das Hotel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="hotel-name">Hotelname</Label>
              <Input id="hotel-name" name="hotel-name" placeholder="z.B., Hotel Paradies" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain oder Subdomain</Label>
              <Input id="domain" name="domain" placeholder="z.B., hotel-paradies.de" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail-Adresse des Hoteliers</Label>
              <Input id="email" name="email" type="email" placeholder="kontakt@hotel.de" />
            </div>
          </CardContent>
          <CardContent className="pt-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Abbrechen</Button>
                <Button type="submit">Hotel erstellen</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
