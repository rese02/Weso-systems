
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createHotel } from '@/lib/actions/hotel.actions';
import { Copy, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

export default function CreateHotelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [roomCategories, setRoomCategories] = useState(['Einzelzimmer', 'Doppelzimmer', 'Suite']);

  const addRoomCategory = () => {
    setRoomCategories([...roomCategories, '']);
  };

  const removeRoomCategory = (indexToRemove: number) => {
    setRoomCategories(roomCategories.filter((_, index) => index !== indexToRemove));
  };

  const handleRoomCategoryChange = (index: number, value: string) => {
    const newCategories = [...roomCategories];
    newCategories[index] = value;
    setRoomCategories(newCategories);
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setGeneratedPassword(password);
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
        title: "Passwort kopiert",
        description: "Das generierte Passwort wurde in die Zwischenablage kopiert.",
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const hotelData = {
      name: formData.get('name') as string,
      ownerEmail: formData.get('email') as string,
      domain: formData.get('domain') as string,
    };
    
    // Simple client-side validation
    if(!hotelData.name || !hotelData.ownerEmail || !hotelData.domain) {
        toast({
            variant: "destructive",
            title: "Fehler",
            description: "Bitte füllen Sie alle Felder aus.",
        });
        setIsLoading(false);
        return;
    }

    try {
      // In a real app, you would also securely handle the password and other settings,
      // likely by creating a Firebase Auth user for the hotelier and storing settings
      // in a dedicated hotel configuration document in Firestore.
      const result = await createHotel(hotelData);
      if (result.success) {
        toast({
            title: "Hotel erstellt",
            description: "Das neue Hotelsystem wurde erfolgreich erstellt.",
        });
        router.push('/admin');
      } else {
         toast({
            variant: "destructive",
            title: "Erstellungsfehler",
            description: result.error || "Das Hotel konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        });
      }
    } catch (error) {
       toast({
            variant: "destructive",
            title: "Erstellungsfehler",
            description: (error as Error).message || "Ein unerwarteter Fehler ist aufgetreten.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
        <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Neues Hotel-System erstellen</h1>
            <p className="text-muted-foreground">Füllen Sie das Formular aus, um ein neues Buchungssystem für einen Kunden einzurichten.</p>
        </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Hotel-Details</CardTitle>
            <CardDescription>Basisinformationen und Anmeldeinformationen für das Hotel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="hotel-name">Hotelname</Label>
              <Input id="hotel-name" name="name" placeholder="z.B. Hotel Paradies" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain oder Subdomain</Label>
              <Input id="domain" name="domain" placeholder="z.B. hotel-paradies.de" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail-Adresse des Hoteliers</Label>
              <Input id="email" name="email" type="email" placeholder="kontakt@hotel.de" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="password">Passwort des Hoteliers</Label>
                <div className="flex items-center gap-2">
                    <Input id="password" name="password" value={generatedPassword} readOnly placeholder="Klicken Sie auf 'Generieren', um ein Passwort zu erstellen" />
                    {generatedPassword && (
                        <Button variant="ghost" size="icon" type="button" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Button variant="outline" type="button" onClick={generatePassword} className="w-fit">Passwort generieren</Button>
                <p className="text-sm text-muted-foreground">Ein sicheres Passwort wird für die erste Anmeldung des Hoteliers generiert.</p>
             </div>
          </CardContent>
          <Separator />
           <CardHeader>
            <CardTitle>Buchungskonfiguration</CardTitle>
            <CardDescription>Legen Sie fest, welche Buchungsoptionen für dieses Hotel verfügbar sind.</CardDescription>
          </CardHeader>
           <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>Verpflegungsarten</Label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Checkbox id="breakfast" defaultChecked/>
                  <Label htmlFor="breakfast">Frühstück</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="half-board" defaultChecked/>
                  <Label htmlFor="half-board">Halbpension</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="full-board" defaultChecked/>
                  <Label htmlFor="full-board">Vollpension</Label>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Zimmerkategorien</Label>
              <div className="grid gap-3">
                {roomCategories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={category}
                      onChange={(e) => handleRoomCategoryChange(index, e.target.value)}
                      placeholder="z.B., Suite"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRoomCategory(index)} disabled={roomCategories.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2 w-fit" onClick={addRoomCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Zimmerkategorie hinzufügen
              </Button>
            </div>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Abbrechen</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Hotel erstellen
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
