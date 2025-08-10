
'use client';

import { useEffect, useState, useTransition, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Loader2, Save } from 'lucide-react';
import { getHotelById, updateHotelSettings } from '@/lib/actions/hotel.actions';
import { useRouter } from 'next/navigation';
import type { Hotel } from '@/lib/definitions';

interface HotelSettings extends Hotel {
    boardTypes?: string[];
    roomCategories?: string[];
}

export default function SettingsPage({ params: paramsPromise }: { params: Promise<{ hotelId: string }>}) {
  const { toast } = useToast();
  const router = useRouter();
  const { hotelId } = use(paramsPromise);
  
  const [hotel, setHotel] = useState<HotelSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!hotelId) return;
    getHotelById(hotelId).then(result => {
        if (result.hotel) {
            setHotel({
                ...result.hotel,
                boardTypes: result.hotel.boardTypes || ['Breakfast', 'Half-Board', 'Full-Board'],
                roomCategories: result.hotel.roomCategories || ['Single Room', 'Double Room', 'Suite']
            });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load hotel settings.'});
        }
        setIsLoading(false);
    })
  }, [hotelId, toast]);


  const addRoomCategory = () => {
    if (!hotel) return;
    setHotel({...hotel, roomCategories: [...(hotel.roomCategories || []), 'New Category']});
  };

  const removeRoomCategory = (indexToRemove: number) => {
    if (!hotel) return;
    setHotel({...hotel, roomCategories: hotel.roomCategories?.filter((_, index) => index !== indexToRemove)});
  };

  const handleRoomCategoryChange = (index: number, value: string) => {
    if (!hotel || !hotel.roomCategories) return;
    const newCategories = [...hotel.roomCategories];
    newCategories[index] = value;
    setHotel({...hotel, roomCategories: newCategories});
  };

  const handleBoardTypeChange = (type: string, checked: boolean) => {
      if (!hotel) return;
      let newBoardTypes = [...(hotel.boardTypes || [])];
      if (checked) {
          newBoardTypes.push(type);
      } else {
          newBoardTypes = newBoardTypes.filter(t => t !== type);
      }
      setHotel({...hotel, boardTypes: newBoardTypes });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotel) return;
    
    startTransition(async () => {
        const result = await updateHotelSettings(hotelId, {
            name: hotel.name,
            boardTypes: hotel.boardTypes,
            roomCategories: hotel.roomCategories,
        });

        if (result.success) {
            toast({
                title: "Settings Saved",
                description: "Your hotel configuration has been updated.",
            });
            router.refresh();
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "Could not save settings."
            });
        }
    });
  };
  
  if (isLoading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!hotel) {
      return <div>Could not load hotel data.</div>
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
              <Input id="hotel-name" value={hotel.name} onChange={(e) => setHotel({...hotel, name: e.target.value})} />
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
                  <Checkbox id="breakfast" checked={hotel.boardTypes?.includes('Breakfast')} onCheckedChange={(c) => handleBoardTypeChange('Breakfast', !!c)} />
                  <Label htmlFor="breakfast">Breakfast</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="half-board" checked={hotel.boardTypes?.includes('Half-Board')} onCheckedChange={(c) => handleBoardTypeChange('Half-Board', !!c)} />
                  <Label htmlFor="half-board">Half Board</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="full-board" checked={hotel.boardTypes?.includes('Full-Board')} onCheckedChange={(c) => handleBoardTypeChange('Full-Board', !!c)} />
                  <Label htmlFor="full-board">Full Board</Label>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Room Categories</Label>
              <div className="grid gap-3">
                {hotel.roomCategories?.map((category, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={category}
                      onChange={(e) => handleRoomCategoryChange(index, e.target.value)}
                      placeholder="e.g., Suite"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRoomCategory(index)} disabled={(hotel.roomCategories?.length || 0) <= 1}>
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
                <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
