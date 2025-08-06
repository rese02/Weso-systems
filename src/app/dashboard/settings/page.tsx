'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
        title: "Settings Saved",
        description: "Your hotel settings have been updated.",
    });
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
       <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Hotel Settings</h1>
            <p className="text-muted-foreground">Manage your hotel's configuration.</p>
        </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Hotel Details</CardTitle>
            <CardDescription>Update basic information about your hotel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="hotel-name">Hotel Name</Label>
              <Input id="hotel-name" defaultValue="Hotel Paradies" />
            </div>
          </CardContent>
          <Separator />
          <CardHeader>
            <CardTitle>Booking Configuration</CardTitle>
            <CardDescription>Manage the booking options for your guests.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>Board Types</Label>
              <div className="flex items-center space-x-4">
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
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addRoomCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Room Category
              </Button>
            </div>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <div className="flex justify-end gap-2">
                <Button type="submit">Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
