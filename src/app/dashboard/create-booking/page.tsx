
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
  Languages,
  PlusCircle,
  Trash2,
  User,
  Euro,
  X,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to create booking and generate link would go here
    toast({
      title: 'Buchung erstellt & Link generiert',
      description: 'Der Buchungslink kann nun kopiert und an den Gast gesendet werden.',
    });
    router.push('/dashboard');
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline md:text-4xl">Neue Buchung erstellen</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">
              <User className="inline-block h-4 w-4 mr-1" />
              Vorname
            </Label>
            <Input id="firstName" placeholder="Vorname des Gastes" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">
              <User className="inline-block h-4 w-4 mr-1" />
              Nachname
            </Label>
            <Input id="lastName" placeholder="Nachname des Gastes" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date-range">
              <CalendarIcon className="inline-block h-4 w-4 mr-1" />
              Zeitraum (Anreise - Abreise)
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
                    <span>Wählen Sie ein Datum</span>
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
                Verpflegung
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Keine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine</SelectItem>
                <SelectItem value="breakfast">Frühstück</SelectItem>
                <SelectItem value="half-board">Halbpension</SelectItem>
                <SelectItem value="full-board">Vollpension</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="total-price">
                <Euro className="inline-block h-4 w-4 mr-1" />
                Gesamtpreis (€)
            </Label>
            <Input id="total-price" type="number" placeholder="Preis in Euro" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language">
                <Languages className="inline-block h-4 w-4 mr-1" />
                Sprache für Gastformular
            </Label>
            <Select defaultValue="de">
              <SelectTrigger>
                <SelectValue placeholder="Sprache wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">Englisch</SelectItem>
                <SelectItem value="es">Spanisch</SelectItem>
                <SelectItem value="fr">Französisch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
            {rooms.map((room, index) => (
            <div key={room.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                 <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Zimmer {index + 1} Details</h3>
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
                    <Label htmlFor={`room-type-${room.id}`}>Zimmertyp</Label>
                    <Select
                    defaultValue={room.roomType}
                    onValueChange={(value) => handleRoomChange(room.id, 'roomType', value)}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Typ wählen" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Komfort">Komfort</SelectItem>
                        <SelectItem value="Suite">Suite</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`adults-${room.id}`}>Erwachsene</Label>
                    <Input
                    id={`adults-${room.id}`}
                    type="number"
                    min="1"
                    value={room.adults}
                    onChange={(e) => handleRoomChange(room.id, 'adults', parseInt(e.target.value) || 1)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`children-${room.id}`}>Kinder (3+)</Label>
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
                        Kleinkinder
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>0-2 Jahre</p>
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
                    <Label htmlFor={`children-ages-${room.id}`}>Alter Kinder (3+)</Label>
                    <Input
                        id={`children-ages-${room.id}`}
                        placeholder="z.B. 4, 8"
                        value={room.childrenAges}
                        onChange={(e) => handleRoomChange(room.id, 'childrenAges', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Kommagetrennt, falls zutreffend.</p>
                </div>
            </div>
            ))}

            <Button type="button" variant="outline" onClick={addRoom}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Weiteres Zimmer hinzufügen
            </Button>
        </div>

        <Separator />
        
        <div className="grid gap-2">
          <Label htmlFor="internal-notes">Interne Bemerkungen (Optional)</Label>
          <Textarea
            id="internal-notes"
            placeholder="Zusätzliche Informationen für das Hotelpersonal..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
            Abbrechen
          </Button>
          <Button type="submit">Buchung erstellen</Button>
        </div>
      </form>
    </div>
  );
}
