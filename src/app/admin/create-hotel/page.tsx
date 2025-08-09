
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useHotels } from '@/hooks/use-hotels';
import type { Hotel } from '@/hooks/use-hotels';
import { Copy } from 'lucide-react';

export default function CreateHotelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { addHotel } = useHotels();
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setGeneratedPassword(password);
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
        title: "Password Copied",
        description: "The generated password has been copied to your clipboard.",
    });
  }

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
            title: "Error",
            description: "Please fill in all fields.",
        });
        return;
    }

    try {
      // In a real app, you would also securely handle the password,
      // likely by creating a Firebase Auth user and sending an invite link.
      // For this prototype, we just add it to the hotel data.
      await addHotel({ ...newHotel, password: generatedPassword });
      toast({
          title: "Hotel Created",
          description: "The new hotel system has been successfully created.",
      });
      router.push('/admin');
    } catch (error) {
       toast({
            variant: "destructive",
            title: "Creation Error",
            description: "The hotel could not be created. Please try again.",
        });
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
        <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Create New Hotel System</h1>
            <p className="text-muted-foreground">Fill out the form to set up a new booking system for a client.</p>
        </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Hotel Details</CardTitle>
            <CardDescription>Basic information about the hotel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="hotel-name">Hotel Name</Label>
              <Input id="hotel-name" name="hotel-name" placeholder="e.g., Hotel Paradise" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain or Subdomain</Label>
              <Input id="domain" name="domain" placeholder="e.g., hotel-paradise.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Hotelier's Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="contact@hotel.com" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="password">Hotelier's Password</Label>
                <div className="flex items-center gap-2">
                    <Input id="password" name="password" value={generatedPassword} readOnly placeholder="Click 'Generate' to create a password" />
                    {generatedPassword && (
                        <Button variant="ghost" size="icon" type="button" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Button variant="outline" type="button" onClick={generatePassword} className="w-fit">Generate Password</Button>
                <p className="text-sm text-muted-foreground">A secure password will be generated for the hotelier's first login.</p>
             </div>
          </CardContent>
          <CardContent className="pt-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Create Hotel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
