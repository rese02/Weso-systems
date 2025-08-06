'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function CreateHotelPage() {
  const { toast } = useToast();
  const [roomCategories, setRoomCategories] = useState(['Single Room', 'Double Room']);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
        title: "Hotel Created",
        description: "The new hotel system has been successfully created.",
    });
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
              <Input id="hotel-name" placeholder="e.g., Hotel Paradies" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain or Subdomain</Label>
              <Input id="domain" placeholder="e.g., hotel-paradies.de" />
            </div>
          </CardContent>
          <Separator />
          <CardHeader>
            <CardTitle>Hotelier Login</CardTitle>
            <CardDescription>Create the login credentials for the hotel owner.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="kontakt@hotel.de" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
          </CardContent>
          <Separator />
          <CardHeader>
            <CardTitle>Booking Configuration</CardTitle>
            <CardDescription>Set up the initial booking options.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>Board Types</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="breakfast" />
                  <Label htmlFor="breakfast">Breakfast</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="half-board" />
                  <Label htmlFor="half-board">Half Board</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="full-board" />
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
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addRoomCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Room Category
              </Button>
            </div>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild><Link href="/admin">Cancel</Link></Button>
                <Button type="submit">Create Hotel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
