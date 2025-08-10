
'use client';

import { useForm, type SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBookingWithLink, updateBooking } from '@/lib/actions/booking.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2, User, Bed, Euro, MessageSquare, PlusCircle, XIcon, Save, Home, Trash2, Languages } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import type { Booking } from '@/lib/definitions';
import { VERPFLEGUNGSART_OPTIONS_FORM, ZIMMERTYP_FORM_OPTIONS, GUEST_LANGUAGE_OPTIONS, RoomDetailsFormValues } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '../ui/separator';

const roomSchema = z.object({
  roomType: z.string({ required_error: "Zimmertyp ist erforderlich." }),
  adults: z.coerce.number({invalid_type_error: "Anzahl Erwachsene muss eine Zahl sein."}).int().min(0, "Anzahl Erwachsene darf nicht negativ sein."),
  children: z.coerce.number({invalid_type_error: "Anzahl Kinder muss eine Zahl sein."}).int().min(0).optional(),
  infants: z.coerce.number({invalid_type_error: "Anzahl Kleinkinder muss eine Zahl sein."}).int().min(0).optional(),
  childrenAges: z.array(z.number()).optional(),
});

const bookingFormSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  checkInDate: z.date({ required_error: "Anreisedatum ist erforderlich." }),
  checkOutDate: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  verpflegungsart: z.string(),
  price: z.coerce.number({invalid_type_error: "Preis muss eine Zahl sein."}).min(0, 'Preis muss eine positive Zahl sein'),
  guestLanguage: z.string(),
  rooms: z.array(roomSchema).min(1, "Mindestens ein Zimmer muss hinzugefügt werden."),
  interneBemerkungen: z.string().max(500, "Bemerkungen dürfen max. 500 Zeichen lang sein.").optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Abreisedatum muss nach dem Anreisedatum liegen.",
  path: ["checkOutDate"],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const defaultRoomValues: RoomDetailsFormValues = {
  roomType: 'Standard',
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
  const isEditMode = !!existingBooking;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: isEditMode && existingBooking ? {
        firstName: existingBooking.firstName || '',
        lastName: existingBooking.lastName || '',
        checkInDate: existingBooking.checkIn ? parseISO(existingBooking.checkIn) : undefined,
        checkOutDate: existingBooking.checkOut ? parseISO(existingBooking.checkOut) : undefined,
        verpflegungsart: existingBooking.boardType,
        price: existingBooking.priceTotal,
        guestLanguage: existingBooking.guestLanguage || 'de',
        rooms: existingBooking.rooms.map(r => ({ ...r, childrenAges: r.childrenAges || [] })), // ensure childrenAges is an array
        interneBemerkungen: existingBooking.internalNotes || '',
    } : {
      firstName: '',
      lastName: '',
      checkInDate: undefined,
      checkOutDate: undefined,
      verpflegungsart: 'Ohne Verpflegung',
      price: 0,
      guestLanguage: 'de',
      rooms: [defaultRoomValues],
      interneBemerkungen: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms"
  });

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
        router.push(`/dashboard/bookings?hotelId=${hotelId}`);
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
          <FormField control={form.control} name="verpflegungsart" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><Bed className="mr-2 h-4 w-4" />Verpflegung</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Keine" /></SelectTrigger></FormControl> <SelectContent>{VERPFLEGUNGSART_OPTIONS_FORM.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><Euro className="mr-2 h-4 w-4" />Gesamtpreis (€)</FormLabel> <FormControl><Input type="number" placeholder="0.00" {...field} step="0.01" /></FormControl> <FormMessage /> </FormItem> )}/>
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
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start">
                  <FormField control={form.control} name={`rooms.${index}.roomType`} render={({ field }) => ( <FormItem> <FormLabel>Zimmertyp</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Standard" /></SelectTrigger></FormControl> <SelectContent>{ZIMMERTYP_FORM_OPTIONS.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`rooms.${index}.adults`} render={({ field }) => ( <FormItem> <FormLabel>Erwachsene</FormLabel> <FormControl><Input type="number" placeholder="1" {...field} min="0"/></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`rooms.${index}.children`} render={({ field }) => ( <FormItem> <FormLabel>Kinder (3+)</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} min="0"/></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`rooms.${index}.infants`} render={({ field }) => ( <FormItem> <FormLabel>Kleinkinder</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} min="0"/></FormControl> <FormDescription className="text-xs">(0-2 J.)</FormDescription><FormMessage /> </FormItem> )}/>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={() => append(defaultRoomValues)} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Zimmer hinzufügen</Button>
        </div>
        <Separator />
        <FormField control={form.control} name="interneBemerkungen" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center text-muted-foreground"><MessageSquare className="mr-2 h-4 w-4" />Interne Bemerkungen (Optional)</FormLabel> <FormControl><Textarea placeholder="Zusätzliche Informationen..." {...field} rows={3} /></FormControl> <FormMessage /> </FormItem> )}/>
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}><XIcon className="mr-2 h-4 w-4" /> Abbrechen</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditMode ? 'Änderungen speichern' : 'Buchung erstellen & Link generieren'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
