
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Bed,
  Calendar as CalendarIcon,
  Info,
  PlusCircle,
  Trash2,
  User,
  Euro,
  X,
  Loader2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBookings } from '@/hooks/use-bookings';
import type { Booking } from '@/hooks/use-bookings';


type RoomDetail = {
  id: number;
  roomType: string;
  adults: number;
  children: number;
  infants: number;
  childrenAges: string;
};

export default function CreateBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const hotelId = 'hotelhub-central';
  const { addBooking } = useBookings(hotelId); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [rooms, setRooms] = useState<RoomDetail[]>([
    {
      id: 1,
      roomType: 'Standard',
      adults: 1,
      children: 0,
      infants: 0,
      childrenAges: '',
    },
  ]);

  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        id: Date.now(),
        roomType: 'Standard',
        adults: 1,
        children: 0,
        infants: 0,
        childrenAges: '',
      },
    ]);
  };

  const removeRoom = (id: number) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  const handleRoomChange = (id: number, field: keyof RoomDetail, value: any) => {
    setRooms(rooms.map((room) => (room.id === id ? { ...room, [field]: value } : room)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const priceString = formData.get('total-price') as string;

    if (!date?.from || !date?.to || !priceString || !firstName || !lastName) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all required fields (First Name, Last Name, Date Range, Price).",
        });
        setIsSubmitting(false);
        return;
    }

    const priceTotal = parseFloat(priceString);

    const newBookingData: Omit<Booking, 'id' | 'createdAt' | 'hotelId'> = {
      firstName,
      lastName,
      email,
      checkIn: date.from.toISOString(),
      checkOut: date.to.toISOString(),
      roomType: rooms[0].roomType,
      priceTotal,
      status: 'Open',
    };

    try {
        await addBooking(newBookingData);
        toast({
            title: 'Booking Created!',
            description: 'The new booking has been successfully saved to the database.',
        });
        router.push('/dashboard');
    } catch (error) {
        console.error("Failed to create booking:", error);
        toast({
            variant: "destructive",
            title: "Error Creating Booking",
            description: "The booking could not be created. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline md:text-4xl">Create New Booking</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">
              <User className="inline-block h-4 w-4 mr-1" />
              First Name
            </Label>
            <Input id="firstName" name="firstName" placeholder="Guest's first name" required/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">
              <User className="inline-block h-4 w-4 mr-1" />
              Last Name
            </Label>
            <Input id="lastName" name="lastName" placeholder="Guest's last name" required/>
          </div>
          <div className="grid gap-2">
             <Label htmlFor="email">Email</Label>
             <Input id="email" name="email" type="email" placeholder="guest@email.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date-range">
              <CalendarIcon className="inline-block h-4 w-4 mr-1" />
              Date Range (Arrival - Departure)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant={'outline'}
                  className={cn(
                    'justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>
                <Bed className="inline-block h-4 w-4 mr-1" />
                Board Type
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="half-board">Half Board</SelectItem>
                <SelectItem value="full-board">Full Board</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="total-price">
                <Euro className="inline-block h-4 w-4 mr-1" />
                Total Price (€)
            </Label>
            <Input id="total-price" name="total-price" type="number" placeholder="Price in Euro" required />
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
            {rooms.map((room, index) => (
            <div key={room.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                 <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Room {index + 1} Details</h3>
                    {rooms.length > 1 && (
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRoom(room.id)}
                        className="text-destructive"
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="grid gap-2">
                    <Label htmlFor={`room-type-${room.id}`}>Room Type</Label>
                    <Select
                    defaultValue={room.roomType}
                    onValueChange={(value) => handleRoomChange(room.id, 'roomType', value)}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Komfort">Comfort</SelectItem>
                        <SelectItem value="Suite">Suite</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`adults-${room.id}`}>Adults</Label>
                    <Input
                    id={`adults-${room.id}`}
                    type="number"
                    min="1"
                    value={room.adults}
                    onChange={(e) => handleRoomChange(room.id, 'adults', parseInt(e.target.value) || 1)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`children-${room.id}`}>Children (3+)</Label>
                    <Input
                    id={`children-${room.id}`}
                    type="number"
                    min="0"
                    value={room.children}
                    onChange={(e) => handleRoomChange(room.id, 'children', parseInt(e.target.value) || 0)}
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor={`infants-${room.id}`} className="flex items-center">
                        Infants
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>0-2 years</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </Label>
                    <Input
                        id={`infants-${room.id}`}
                        type="number"
                        min="0"
                        value={room.infants}
                         onChange={(e) => handleRoomChange(room.id, 'infants', parseInt(e.target.value) || 0)}
                    />
                 </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor={`children-ages-${room.id}`}>Ages of Children (3+)</Label>
                    <Input
                        id={`children-ages-${room.id}`}
                        placeholder="e.g. 4, 8"
                        value={room.childrenAges}
                        onChange={(e) => handleRoomChange(room.id, 'childrenAges', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated, if applicable.</p>
                </div>
            </div>
            ))}

            <Button type="button" variant="outline" onClick={addRoom}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add another room
            </Button>
        </div>

        <Separator />
        
        <div className="grid gap-2">
          <Label htmlFor="internal-notes">Internal Notes (Optional)</Label>
          <Textarea
            id="internal-notes"
            name="internalNotes"
            placeholder="Additional information for hotel staff..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                </>
            ) : "Create Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
}

    
