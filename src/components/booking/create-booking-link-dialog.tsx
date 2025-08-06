'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Copy } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBookingLinks } from '@/hooks/use-booking-links';
import { useToast } from '@/hooks/use-toast';

const roomPrices: { [key: string]: number } = {
    single: 80,
    double: 120,
    suite: 200,
}

export function CreateBookingLinkDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [roomType, setRoomType] = useState('');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [validity, setValidity] = useState(7);
  const [price, setPrice] = useState(0);
  const [generatedLink, setGeneratedLink] = useState('');

  const { addLink } = useBookingLinks();
  const { toast } = useToast();

  const handleCreateLink = () => {
    if (!roomType || !checkIn || !checkOut || !validity) {
        toast({ variant: "destructive", title: "Error", description: "Please fill out all fields." });
        return;
    }

    const nights = differenceInDays(checkOut, checkIn);
    if(nights <= 0) {
        toast({ variant: "destructive", title: "Error", description: "Check-out date must be after check-in date." });
        return;
    }
    const calculatedPrice = (roomPrices[roomType] || 0) * nights;
    setPrice(calculatedPrice);

    const newLink = addLink({
        roomType: roomType,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        priceTotal: calculatedPrice,
    }, validity);

     const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return '';
    }

    const fullLink = `${getBaseUrl()}/booking/hotel-paradies?linkId=${newLink.id}`;
    setGeneratedLink(fullLink);

    toast({ title: "Link Created", description: "A new booking link has been successfully generated." });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
        title: "Link Copied",
        description: "The booking link has been copied to your clipboard.",
    });
  }

  const resetAndClose = () => {
    setRoomType('');
    setCheckIn(undefined);
    setCheckOut(undefined);
    setValidity(7);
    setPrice(0);
    setGeneratedLink('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Booking Link</DialogTitle>
          <DialogDescription>
            Generate a pre-filled booking link to send to your guests.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-type" className="text-right">Room</Label>
            <Select onValueChange={setRoomType} value={roomType}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Room (€{roomPrices.single}/night)</SelectItem>
                <SelectItem value="double">Double Room (€{roomPrices.double}/night)</SelectItem>
                <SelectItem value="suite">Suite (€{roomPrices.suite}/night)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="check-in" className="text-right">Check-in</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('col-span-3 justify-start text-left font-normal', !checkIn && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkIn ? format(checkIn, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="check-out" className="text-right">Check-out</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('col-span-3 justify-start text-left font-normal', !checkOut && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOut ? format(checkOut, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="validity" className="text-right">Validity</Label>
            <Input id="validity" type="number" value={validity} onChange={(e) => setValidity(Number(e.target.value))} className="col-span-3" />
          </div>
          {generatedLink && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="link-preview" className="text-right">Generated</Label>
                <div className="col-span-3 relative">
                    <Input id="link-preview" value={generatedLink} readOnly className="pr-10" />
                    <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {generatedLink ? (
            <Button onClick={resetAndClose}>Close</Button>
          ) : (
            <Button type="submit" onClick={handleCreateLink}>Generate Link</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
