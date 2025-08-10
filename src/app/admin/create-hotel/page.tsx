
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
  const [roomCategories, setRoomCategories] = useState(['Single Room', 'Double Room', 'Suite']);

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
        title: "Password Copied",
        description: "The generated password has been copied to your clipboard.",
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const hotelData = {
      name: formData.get('hotel-name') as string,
      ownerEmail: formData.get('email') as string,
      domain: formData.get('domain') as string,
    };
    
    // Simple client-side validation
    if(!hotelData.name || !hotelData.ownerEmail || !hotelData.domain) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all fields.",
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
            title: "Hotel Created",
            description: "The new hotel system has been successfully created.",
        });
        router.push('/admin');
      } else {
         toast({
            variant: "destructive",
            title: "Creation Error",
            description: result.error || "The hotel could not be created. Please try again.",
        });
      }
    } catch (error) {
       toast({
            variant: "destructive",
            title: "Creation Error",
            description: (error as Error).message || "An unexpected error occurred.",
        });
    } finally {
        setIsLoading(false);
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
            <CardDescription>Basic information and credentials for the hotel.</CardDescription>
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
          <Separator />
           <CardHeader>
            <CardTitle>Booking Configuration</CardTitle>
            <CardDescription>Define which booking options are available for this hotel.</CardDescription>
          </CardHeader>
           <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>Board Types</Label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Checkbox id="breakfast" defaultChecked/>
                  <Label htmlFor="breakfast">Breakfast</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="half-board" defaultChecked/>
                  <Label htmlFor="half-board">Half Board</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="full-board" defaultChecked/>
                  <Label htmlFor="full-board">Full Board</Label>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Room Categories</Label>
              <div className="grid gap-3">
                {roomCategories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={category}
                      onChange={(e) => handleRoomCategoryChange(index, e.target.value)}
                      placeholder="e.g., Suite"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRoomCategory(index)} disabled={roomCategories.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2 w-fit" onClick={addRoomCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Room Category
              </Button>
            </div>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Hotel
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
