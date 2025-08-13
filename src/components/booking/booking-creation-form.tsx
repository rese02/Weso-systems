
'use client';

import { useForm, type SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBookingWithLink, updateBooking } from '@/lib/actions/booking.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2, User, Bed, Euro, MessageSquare, PlusCircle, XIcon, Save, Home, Trash2, Languages, MinusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import type { Booking, Hotel } from '@/lib/definitions';
import { GUEST_LANGUAGE_OPTIONS, RoomDetailsFormValues, bookingFormSchema } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '../ui/separator';
import { getHotelById } from '@/lib/actions/hotel.actions';


type BookingFormValues = z.infer<typeof bookingFormSchema>;

const defaultRoomValues: RoomDetailsFormValues = {
  roomType: '',
  adults: 1,
  children: 0,
  infants: 0,
  childrenAges: [],
};

interface BookingCreationFormProps {
  hotelId: string;
  existingBooking?: Booking | null;
}

export function BookingCreationForm({ hotelId, existingBooking = null }: BookingCreationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hotelConfig, setHotelConfig] = useState<{ boardTypes: string[], roomCategories: string[] } | null>(null);
  const isEditMode = !!existingBooking;

  useEffect(() => {
      const fetchHotelConfig = async () => {
          setIsLoading(true);
          const { hotel } = await getHotelById(hotelId);
          if (hotel) {
              setHotelConfig({
                  boardTypes: hotel.boardTypes || [],
                  roomCategories: hotel.roomCategories || [],
              });
              // Set default values once config is loaded
              const initialRoomType = hotel.roomCategories?.[0] || 'Standard Doppelzimmer';
               if (!isEditMode) {
                   form.setValue('rooms.0.roomType', initialRoomType);
                   form.setValue('boardType', hotel.boardTypes?.[0] || 'Frühstück');
               }
          }
          setIsLoading(false);
      };
      fetchHotelConfig();
  }, [hotelId]);


  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: isEditMode && existingBooking ? {
        firstName: existingBooking.firstName || '',
        lastName: existingBooking.lastName || '',
        checkInDate: existingBooking.checkIn ? parseISO(existingBooking.checkIn) : undefined,
        checkOutDate: existingBooking.checkOut ? parseISO(existingBooking.checkOut) : undefined,
        boardType: existingBooking.boardType,
        priceTotal: existingBooking.priceTotal,
        guestLanguage: existingBooking.guestLanguage || 'de',
        rooms: existingBooking.rooms.map(r => ({ ...r, childrenAges: r.childrenAges || [] })),
        internalNotes: existingBooking.internalNotes || '',
    } : {
      firstName: '',
      lastName: '',
      checkInDate: undefined,
      checkOutDate: undefined,
      boardType: '', // Set from config
      priceTotal: 0,
      guestLanguage: 'de',
      rooms: [{
        roomType: '', // Set from config
        adults: 1,
        children: 0,
        infants: 0,
        childrenAges: [],
      }],
      internalNotes: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "rooms"
  });

  const watchRooms = form.watch('rooms');

  const checkInDateValue = form.watch("checkInDate");
  const checkOutDateValue = form.watch("checkOutDate");

  const selectedDateRange: DateRange | undefined = useMemo(() => ({
    from: checkInDateValue,
    to: checkOutDateValue,
  }), [checkInDateValue, checkOutDateValue]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) form.setValue("checkInDate", range.from, { shouldValidate: true, shouldDirty: true });
    if (range?.to) form.setValue("checkOutDate", range.to, { shouldValidate: true, shouldDirty: true });
  };

  const handleChildrenCountChange = (roomIndex: number, newCount: number) => {
    const room = form.getValues(`rooms.${roomIndex}`);
    const currentAges = room.childrenAges || [];
    const newAges = Array.from({ length: newCount }, (_, i) => currentAges[i] || 0);

    form.setValue(`rooms.${roomIndex}.children`, newCount, { shouldValidate: true });
    form.setValue(`rooms.${roomIndex}.childrenAges`, newAges, { shouldValidate: true });
  };


  const onSubmit: SubmitHandler<BookingFormValues> = async (formData) => {
    setIsLoading(true);

    if (!formData.checkInDate || !formData.checkOutDate) {
        toast({ variant: 'destructive', title: 'Fehler', description: 'Bitte An- und Abreisedatum auswählen.'});
        setIsLoading(false);
        return;
    }
    
    const action = isEditMode && existingBooking
        ? updateBooking({ hotelId, bookingId: existingBooking.id, bookingData: formData })
        : createBookingWithLink({ hotelId, bookingData: formData });

    try {
      const result = await action;
      if (result.success) {
        toast({
          title: isEditMode ? 'Buchung aktualisiert!' : 'Buchung erstellt!',
          description: `Die Buchung für ${formData.firstName} ${formData.lastName} wurde erfolgreich ${isEditMode ? 'aktualisiert' : 'erstellt'}.`,
        });
        router.push(`/dashboard/${hotelId}/bookings`);
        router.refresh(); 
      } else {
        toast({
          title: 'Fehler bei der Übermittlung',
          description: result.error || 'Ein unbekannter Fehler ist aufgetreten.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Formularfehler',
        description: error.message || 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hotelConfig) {
      return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /> <span className="ml-2">Lade Hotel-Konfiguration...</span></div>
  }

  const defaultRoomValuesWithConfig: RoomDetailsFormValues = {
    roomType: hotelConfig.roomCategories[0] || '',
    adults: 1,
    children: 0,
    infants: 0,
    childrenAges: [],
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><User className="mr-2 h-4 w-4" />Vorname</FormLabel> <FormControl><Input placeholder="Vorname" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><User className="mr-2 h-4 w-4" />Nachname</FormLabel> <FormControl><Input placeholder="Nachname" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center text-muted-foreground mb-2"><CalendarIcon className="mr-2 h-4 w-4" />Zeitraum</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !checkInDateValue && "text-muted-foreground")}>
                  {checkInDateValue ? (checkOutDateValue ? `${format(checkInDateValue, "dd. LLL yyyy", { locale: de })} - ${format(checkOutDateValue, "dd. LLL yyyy", { locale: de })}` : format(checkInDateValue, "dd. LLL yyyy", { locale: de })) : (<span>Zeitraum auswählen</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={checkInDateValue} selected={selectedDateRange} onSelect={handleDateRangeSelect} numberOfMonths={1} locale={de} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} /></PopoverContent>
            </Popover>
            <FormMessage>{form.formState.errors.checkInDate?.message || form.formState.errors.checkOutDate?.message}</FormMessage>
          </FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <FormField control={form.control} name="boardType" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><Bed className="mr-2 h-4 w-4" />Verpflegung</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Verpflegung auswählen" /></SelectTrigger></FormControl> <SelectContent>{hotelConfig.boardTypes.map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="priceTotal" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><Euro className="mr-2 h-4 w-4" />Gesamtpreis (€)</FormLabel> <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} step="0.01" /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="guestLanguage" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><Languages className="mr-2 h-4 w-4" />Sprache für Gast</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Sprache" /></SelectTrigger></FormControl> <SelectContent>{GUEST_LANGUAGE_OPTIONS.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        </div>
        <Separator />
        <div className="space-y-6">
          {fields.map((roomField, index) => (
            <Card key={roomField.id} className="border-dashed relative pt-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <div className="flex items-center"><Home className="mr-2 h-5 w-5 text-primary" />Zimmer {index + 1}</div>
                  {fields.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start">
                    <FormField control={form.control} name={`rooms.${index}.roomType`} render={({ field }) => ( <FormItem> <FormLabel>Zimmertyp</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Typ auswählen" /></SelectTrigger></FormControl> <SelectContent>{hotelConfig.roomCategories.map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`rooms.${index}.adults`} render={({ field }) => ( <FormItem> <FormLabel>Erwachsene</FormLabel> <FormControl><Input type="number" placeholder="1" {...field} min="0"/></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`rooms.${index}.children`} render={({ field }) => ( <FormItem> <FormLabel>Kinder</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} min="0" onChange={e => handleChildrenCountChange(index, parseInt(e.target.value, 10) || 0)}/></FormControl> <FormDescription className="text-xs">(3-17 J.)</FormDescription> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`rooms.${index}.infants`} render={({ field }) => ( <FormItem> <FormLabel>Kleinkinder</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} min="0"/></FormControl> <FormDescription className="text-xs">(0-2 J.)</FormDescription><FormMessage /> </FormItem> )}/>
                </div>
                 {watchRooms[index].children > 0 && (
                  <div className="mt-6">
                      <Label>Alter der Kinder</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                          {Array.from({ length: watchRooms[index].children }).map((_, childIndex) => (
                              <FormField
                                  key={`${roomField.id}-child-${childIndex}`}
                                  control={form.control}
                                  name={`rooms.${index}.childrenAges.${childIndex}`}
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel className="text-xs text-muted-foreground">Kind {childIndex + 1}</FormLabel>
                                          <FormControl>
                                              <Input type="number" placeholder="Alter" {...field} min="3" max="17" />
                                          </FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          ))}
                      </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={() => append(defaultRoomValuesWithConfig)} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Zimmer hinzufügen</Button>
        </div>
        <Separator />
        <FormField control={form.control} name="internalNotes" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><MessageSquare className="mr-2 h-4 w-4" />Interne Bemerkungen (Optional)</FormLabel> <FormControl><Textarea placeholder="Zusätzliche Informationen..." {...field} rows={3} /></FormControl> <FormMessage /> </FormItem> )}/>
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}><XIcon className="mr-2 h-4 w-4" /> Abbrechen</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditMode ? 'Änderungen speichern' : 'Buchung erstellen & Link generieren'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
