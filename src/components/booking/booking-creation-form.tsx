
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
import { createBookingWithLink } from '@/lib/actions/booking.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2, User, Bed, Euro, MessageSquare, PlusCircle, XIcon, Save, Home, Trash2, Clock, Languages } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import type { Verpflegungsart, ZimmertypForm, RoomDetails, GuestLanguage } from '@/lib/definitions';
import { VERPFLEGUNGSART_OPTIONS_FORM, ZIMMERTYP_FORM_OPTIONS, GUEST_LANGUAGE_OPTIONS } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '../ui/separator';


const roomSchema = z.object({
  zimmertyp: z.enum(
    ZIMMERTYP_FORM_OPTIONS.map(o => o.value) as [ZimmertypForm, ...ZimmertypForm[]],
    { required_error: "Zimmertyp ist erforderlich." }
  ),
  adults: z.coerce.number({invalid_type_error: "Anzahl Erwachsene muss eine Zahl sein."}).int().min(0, "Anzahl Erwachsene darf nicht negativ sein."),
  children: z.coerce.number({invalid_type_error: "Anzahl Kinder muss eine Zahl sein."}).int().min(0).optional(),
  infants: z.coerce.number({invalid_type_error: "Anzahl Kleinkinder muss eine Zahl sein."}).int().min(0).optional(),
  kinderAlter: z.string().optional().refine(val => !val || /^(\d+(,\s*\d+)*)?$/.test(val), {
    message: "Alter kommagetrennt eingeben (z.B. 4, 8)."
  }),
});

const bookingSchema = z.object({
  guestFirstName: z.string().min(1, 'Vorname ist erforderlich'),
  guestLastName: z.string().min(1, 'Nachname ist erforderlich'),
  checkInDate: z.date({ required_error: "Anreisedatum ist erforderlich." }),
  checkOutDate: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  verpflegungsart: z.enum(
    VERPFLEGUNGSART_OPTIONS_FORM.map(o => o.value) as [Verpflegungsart, ...Verpflegungsart[]],
    { required_error: "Verpflegung ist erforderlich." }
  ),
  price: z.coerce.number({invalid_type_error: "Preis muss eine Zahl sein."}).min(0, 'Preis muss eine positive Zahl sein'),

  guestLanguage: z.enum(
    GUEST_LANGUAGE_OPTIONS.map(o => o.value) as [GuestLanguage, ...GuestLanguage[]],
    { required_error: "Sprache für Gast ist erforderlich." }
  ),

  rooms: z.array(roomSchema).min(1, "Mindestens ein Zimmer muss hinzugefügt werden."),

  interneBemerkungen: z.string().max(500, "Bemerkungen dürfen max. 500 Zeichen lang sein.").optional(),
}).refine(data => {
    if (data.checkInDate && data.checkOutDate) {
      return data.checkOutDate > data.checkInDate;
    }
    return true;
  }, {
  message: "Abreisedatum muss nach dem Anreisedatum liegen.",
  path: ["checkOutDate"],
}).refine(data => {
    const totalAdults = data.rooms.reduce((sum, room) => sum + (room.adults || 0), 0);
    return totalAdults >= 1;
}, {
    message: "Die Buchung muss insgesamt mindestens einen Erwachsenen enthalten.",
    path: ["rooms"],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const defaultRoomValues: Omit<RoomDetails, 'roomType' | 'childrenAges'> = {
  adults: 1,
  children: 0,
  infants: 0,
};

export function BookingCreationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const hotelId = 'hotelhub-central'; // In a real app, this would come from context/auth

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestFirstName: '',
      guestLastName: '',
      checkInDate: undefined,
      checkOutDate: undefined,
      verpflegungsart: 'Ohne Verpflegung',
      price: undefined,
      guestLanguage: 'de',
      rooms: [{ zimmertyp: 'Standard', ...defaultRoomValues, kinderAlter: '' }],
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
    form.setValue("checkInDate", range?.from, { shouldValidate: true, shouldDirty: true });
    form.setValue("checkOutDate", range?.to, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit: SubmitHandler<BookingFormValues> = async (formData) => {
    setIsLoading(true);
    try {
      const result = await createBookingWithLink({ hotelId, bookingData: formData });

      if (result.success && result.bookingId) {
        toast({
          title: 'Buchung erstellt!',
          description: `Buchung für ${formData.guestFirstName} ${formData.guestLastName} wurde erstellt.`,
          className: 'bg-green-100 text-green-700'
        });
        router.push('/dashboard');
      } else {
        toast({
          title: 'Buchungserstellung fehlgeschlagen',
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
        {/* Gastinformationen und Zeitraum */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <FormField
            control={form.control}
            name="guestFirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-muted-foreground"><User className="mr-2 h-4 w-4" />Vorname</FormLabel>
                <FormControl>
                  <Input placeholder="Vorname des Gastes" {...field} className="placeholder:opacity-30" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="guestLastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-muted-foreground"><User className="mr-2 h-4 w-4" />Nachname</FormLabel>
                <FormControl>
                  <Input placeholder="Nachname des Gastes" {...field} className="placeholder:opacity-30" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem className="space-y-2">
            <FormLabel className="flex items-center text-muted-foreground">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Zeitraum (Anreise - Abreise)
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkInDateValue && "text-muted-foreground"
                  )}
                >
                  {checkInDateValue ? (
                    checkOutDateValue ? (
                      <>
                        {format(checkInDateValue, "dd. LLL yyyy", { locale: de })} -{" "}
                        {format(checkOutDateValue, "dd. LLL yyyy", { locale: de })}
                      </>
                    ) : (
                      format(checkInDateValue, "dd. LLL yyyy", { locale: de })
                    )
                  ) : (
                    <span>Zeitraum auswählen</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={checkInDateValue}
                  selected={selectedDateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={1}
                  locale={de}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
            <FormDescription className="text-xs">Wählen Sie An- und Abreisedatum.</FormDescription>
            {form.formState.errors.checkInDate?.message && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.checkInDate.message}</p>
            )}
            {form.formState.errors.checkOutDate?.message && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.checkOutDate.message}</p>
            )}
          </FormItem>
        </div>

        {/* Verpflegung, Gesamtpreis, Sprache */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <FormField
            control={form.control}
            name="verpflegungsart"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-muted-foreground"><Bed className="mr-2 h-4 w-4" />Verpflegung</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Keine" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VERPFLEGUNGSART_OPTIONS_FORM.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription className="text-xs">Gilt für die gesamte Buchung.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-muted-foreground"><Euro className="mr-2 h-4 w-4" />Gesamtpreis (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Preis in Euro" {...field} step="0.01" value={field.value === undefined ? '' : field.value} className="placeholder:opacity-30" />
                </FormControl>
                <FormDescription className="text-xs">Gesamtpreis für alle Zimmer in Euro.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="guestLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-muted-foreground"><Languages className="mr-2 h-4 w-4" />Sprache für Gastformular</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sprache auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GUEST_LANGUAGE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription className="text-xs">In dieser Sprache sieht der Gast das Formular.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Zimmerdetails - dynamische Liste */}
        <div className="space-y-6">
          {fields.map((roomField, index) => (
            <Card key={roomField.id} className="border-dashed relative pt-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <div className="flex items-center">
                    <Home className="mr-2 h-5 w-5 text-primary" />
                    Zimmer {index + 1} Details
                  </div>
                  {fields.length > 1 && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:bg-destructive/10"
                        aria-label={`Zimmer ${index + 1} entfernen`}
                      >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                  <FormField
                    control={form.control}
                    name={`rooms.${index}.zimmertyp`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zimmertyp</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Standard" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {ZIMMERTYP_FORM_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`rooms.${index}.adults`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Erwachsene</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                placeholder="Anzahl Erw."
                                {...field}
                                value={field.value === undefined ? '' : String(field.value)}
                                min="0"
                                className="placeholder:opacity-30"
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`rooms.${index}.children`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kinder (3+)</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                placeholder="Anzahl Ki."
                                {...field}
                                value={field.value === undefined ? '' : String(field.value)}
                                min="0"
                                className="placeholder:opacity-30"
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`rooms.${index}.infants`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">Kleinkinder <Clock className="ml-1 h-3 w-3 text-muted-foreground" /></FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                placeholder="Anz. Kleinki."
                                {...field}
                                value={field.value === undefined ? '' : String(field.value)}
                                min="0"
                                className="placeholder:opacity-30"
                            />
                        </FormControl>
                        <FormDescription className="text-xs">(0-2 J.)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`rooms.${index}.kinderAlter`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alter Kinder (3+)</FormLabel>
                      <FormControl><Input placeholder="z.B. 4, 8" {...field} className="placeholder:opacity-30" /></FormControl>
                      <FormDescription className="text-xs">Kommagetrennt, falls zutreffend.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
          {form.formState.errors.rooms && typeof form.formState.errors.rooms === 'object' && !Array.isArray(form.formState.errors.rooms) && (
            <FormMessage>{form.formState.errors.rooms.message}</FormMessage>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ ...defaultRoomValues, zimmertyp: 'Standard', kinderAlter: '' })}
            className="w-full md:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Weiteres Zimmer hinzufügen
          </Button>
        </div>

        <Separator />

        {/* Interne Bemerkungen */}
        <FormField
          control={form.control}
          name="interneBemerkungen"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center text-muted-foreground"><MessageSquare className="mr-2 h-4 w-4" />Interne Bemerkungen (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Zusätzliche Informationen für das Hotelpersonal..." {...field} rows={3} className="placeholder:opacity-30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => router.push('/dashboard')} disabled={isLoading}>
            <XIcon className="mr-2 h-4 w-4" /> Abbrechen
          </Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Buchung erstellen & Link generieren
          </Button>
        </div>
      </form>
    </Form>
  );
}
