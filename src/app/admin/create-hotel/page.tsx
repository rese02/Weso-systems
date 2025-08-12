
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createHotel } from '@/lib/actions/hotel.actions';
import { Copy, PlusCircle, Trash2, Loader2, Banknote, Mail, KeyRound, Phone, MapPin, Building } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

export default function CreateHotelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [roomCategories, setRoomCategories] = useState(['Einzelzimmer', 'Doppelzimmer', 'Suite']);
  const [boardTypes, setBoardTypes] = useState(['Frühstück', 'Halbpension', 'Vollpension']);

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
  
  const handleBoardTypeChange = (type: string, checked: boolean | string) => {
      let newBoardTypes = [...boardTypes];
      if (checked) {
          if (!newBoardTypes.includes(type)) newBoardTypes.push(type);
      } else {
          newBoardTypes = newBoardTypes.filter(t => t !== type);
      }
      setBoardTypes(newBoardTypes);
  }


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
      ownerEmail: formData.get('ownerEmail') as string,
      domain: formData.get('domain') as string,
      // Public Contact Details
      contactEmail: formData.get('contactEmail') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactAddress: formData.get('contactAddress') as string,
      // Bank details
      bankAccountHolder: formData.get('bankAccountHolder') as string,
      bankIBAN: formData.get('bankIBAN') as string,
      bankBIC: formData.get('bankBIC') as string,
      bankName: formData.get('bankName') as string,
      // SMTP details
      smtpUser: formData.get('smtpUser') as string,
      smtpPass: formData.get('smtpPass') as string,
      // Booking configs
      boardTypes: boardTypes,
      roomCategories: roomCategories.filter(rc => rc.trim() !== ''), // Filter out empty categories
    };
    
    // Simple client-side validation
    if(!hotelData.name || !hotelData.ownerEmail || !hotelData.domain) {
        toast({
            variant: "destructive",
            title: "Fehler",
            description: "Bitte füllen Sie alle erforderlichen Hotel-Detailfelder aus.",
        });
        setIsLoading(false);
        return;
    }

    try {
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
            <CardTitle>Basisinformationen</CardTitle>
            <CardDescription>Allgemeine und Login-Informationen für das Hotel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="hotel-name">Hotelname</Label>
                  <Input id="hotel-name" name="name" placeholder="z.B. Hotel Paradies" required/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="domain">Domain oder Subdomain</Label>
                  <Input id="domain" name="domain" placeholder="z.B. hotel-paradies.de" required/>
                </div>
             </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="ownerEmail">E-Mail-Adresse des Hoteliers (für Login)</Label>
                  <Input id="ownerEmail" name="ownerEmail" type="email" placeholder="login@hotel.de" required/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="password">Passwort des Hoteliers</Label>
                    <div className="flex items-center gap-2">
                        <Input id="password" name="password" value={generatedPassword} readOnly placeholder="Passwort generieren..." />
                        {generatedPassword && (
                            <Button variant="ghost" size="icon" type="button" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        )}
                         <Button variant="outline" type="button" onClick={generatePassword} className="whitespace-nowrap">Generieren</Button>
                    </div>
                 </div>
            </div>
          </CardContent>
          <Separator />
           <CardHeader>
            <CardTitle>Öffentliche Kontaktdaten</CardTitle>
            <CardDescription>Diese Daten werden in E-Mails und auf öffentlichen Seiten angezeigt.</CardDescription>
           </CardHeader>
           <CardContent className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail" className='flex items-center'><Mail className='w-4 h-4 mr-2'/>Kontakt E-Mail</Label>
                  <Input name="contactEmail" id="contactEmail" type="email" placeholder="info@hotel-paradies.de"/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone" className='flex items-center'><Phone className='w-4 h-4 mr-2'/>Kontakt Telefonnummer</Label>
                  <Input name="contactPhone" id="contactPhone" placeholder="+39 0471 706 513"/>
                </div>
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="contactAddress" className='flex items-center'><MapPin className='w-4 h-4 mr-2'/>Vollständige Adresse</Label>
                  <Input name="contactAddress" id="contactAddress" placeholder="Musterstraße 1, 12345 Musterstadt, Land"/>
                </div>
           </CardContent>
          <Separator />
           <CardHeader>
            <CardTitle>Bankverbindung für Überweisungen</CardTitle>
            <CardDescription>Diese Daten werden dem Gast für die Überweisung angezeigt.</CardDescription>
          </CardHeader>
           <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2"><Label htmlFor="bankAccountHolder" className='flex items-center'><Building className='w-4 h-4 mr-2'/>Kontoinhaber</Label><Input name="bankAccountHolder" id="bankAccountHolder" placeholder="Hotel Paradies GmbH"/></div>
              <div className="grid gap-2"><Label htmlFor="bankIBAN" className='flex items-center'><Banknote className='w-4 h-4 mr-2'/>IBAN</Label><Input name="bankIBAN" id="bankIBAN" placeholder="IT..."/></div>
              <div className="grid gap-2"><Label htmlFor="bankBIC" className='flex items-center'><Banknote className='w-4 h-4 mr-2'/>BIC/SWIFT</Label><Input name="bankBIC" id="bankBIC" placeholder="RZ..."/></div>
              <div className="grid gap-2"><Label htmlFor="bankName" className='flex items-center'><Banknote className='w-4 h-4 mr-2'/>Bank</Label><Input name="bankName" id="bankName" placeholder="Bankname"/></div>
           </CardContent>
           <Separator />
            <CardHeader>
                <CardTitle>E-Mail-Versand (SMTP via Gmail)</CardTitle>
                <CardDescription>Konfiguration für den automatischen E-Mail-Versand. Diese Daten werden sicher gespeichert.</CardDescription>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2"><Label htmlFor="smtpUser" className='flex items-center'><Mail className='w-4 h-4 mr-2'/>SMTP-Benutzer (E-Mail)</Label><Input name="smtpUser" id="smtpUser" placeholder="buchungen@hotel.de"/></div>
                <div className="grid gap-2"><Label htmlFor="smtpPass" className='flex items-center'><KeyRound className='w-4 h-4 mr-2'/>SMTP-Passwort (Google App-Passwort)</Label><Input name="smtpPass" id="smtpPass" type="password"/></div>
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
                  <Checkbox id="breakfast" checked={boardTypes.includes('Frühstück')} onCheckedChange={(c) => handleBoardTypeChange('Frühstück', !!c)} />
                  <Label htmlFor="breakfast">Frühstück</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="half-board" checked={boardTypes.includes('Halbpension')} onCheckedChange={(c) => handleBoardTypeChange('Halbpension', !!c)} />
                  <Label htmlFor="half-board">Halbpension</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="full-board" checked={boardTypes.includes('Vollpension')} onCheckedChange={(c) => handleBoardTypeChange('Vollpension', !!c)} />
                  <Label htmlFor="full-board">Vollpension</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <Checkbox id="no-board" checked={boardTypes.includes('Ohne Verpflegung')} onCheckedChange={(c) => handleBoardTypeChange('Ohne Verpflegung', !!c)} />
                  <Label htmlFor="no-board">Ohne Verpflegung</Label>
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
                      placeholder="z.B. Suite"
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

    
