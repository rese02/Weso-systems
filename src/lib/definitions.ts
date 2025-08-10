
import type { Timestamp } from 'firebase/firestore';
import * as z from 'zod';

// --- Base Data Models (as in Firestore) ---

export interface RoomDetails {
  roomType: string;
  adults: number;
  children: number;
  infants: number;
  childrenAges: number[];
}

export type BookingStatus = 'Open' | 'Sent' | 'Submitted' | 'Confirmed' | 'Cancelled' | 'Checked-in' | 'Checked-out' | 'Partial Payment';

export interface Booking {
  id: string;
  hotelId: string;
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  submittedAt?: Timestamp;
  bookingLinkId?: string;
  guestLanguage?: string;
  checkIn: string; // ISO String
  checkOut: string; // ISO string
  boardType: string;
  priceTotal: number;
  rooms: RoomDetails[];
  internalNotes?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  documents?: {
    idDoc?: string;
    paymentProof?: string;
  };
}

export interface BookingPrefill {
    roomType: string;
    checkIn: string; // ISO date string
    checkOut: string; // ISO date string
    priceTotal: number;
    bookingId: string;
}

export interface BookingLink {
  id: string;
  bookingId: string;
  hotelId: string;
  createdBy: string;
  createdAt: Timestamp | string;
  expiresAt: Timestamp | string;
  status: 'active' | 'used' | 'expired';
  prefill: BookingPrefill;
}

export type BookingLinkWithHotel = BookingLink & { hotelName: string };

// --- Form Schemas and Options ---

// Schema for the Admin/Hotelier Booking Creation/Edit Form
export const roomFormSchema = z.object({
  roomType: z.string({ required_error: "Zimmertyp ist erforderlich." }),
  adults: z.coerce.number({invalid_type_error: "Anzahl Erwachsene muss eine Zahl sein."}).int().min(0),
  children: z.coerce.number({invalid_type_error: "Anzahl Kinder muss eine Zahl sein."}).int().min(0).optional(),
  infants: z.coerce.number({invalid_type_error: "Anzahl Kleinkinder muss eine Zahl sein."}).int().min(0).optional(),
  childrenAges: z.array(z.number()).optional(),
});

export const bookingFormSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  checkInDate: z.date({ required_error: "Anreisedatum ist erforderlich." }),
  checkOutDate: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  boardType: z.string(),
  priceTotal: z.coerce.number(),
  guestLanguage: z.string(),
  rooms: z.array(roomFormSchema).min(1, "Mindestens ein Zimmer muss hinzugefügt werden."),
  internalNotes: z.string().max(500, "Bemerkungen dürfen max. 500 Zeichen lang sein.").optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Abreisedatum muss nach dem Anreisedatum liegen.",
  path: ["checkOutDate"],
});


export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type RoomDetailsFormValues = z.infer<typeof roomFormSchema>;

// --- Select Options for Forms ---

export type Verpflegungsart = 'Ohne Verpflegung' | 'Frühstück' | 'Halbpension' | 'Vollpension';
export const VERPFLEGUNGSART_OPTIONS_FORM: { value: Verpflegungsart; label: string }[] = [
  { value: 'Ohne Verpflegung', label: 'Ohne Verpflegung' },
  { value: 'Frühstück', label: 'Frühstück' },
  { value: 'Halbpension', label: 'Halbpension' },
  { value: 'Vollpension', label: 'Vollpension' },
];

export type ZimmertypForm = 'Standard' | 'Komfort' | 'Suite' | 'Einzelzimmer';
export const ZIMMERTYP_FORM_OPTIONS: { value: ZimmertypForm; label: string }[] = [
  { value: 'Standard', label: 'Standard Doppelzimmer' },
  { value: 'Komfort', label: 'Komfort Doppelzimmer' },
  { value: 'Suite', label: 'Suite' },
  { value: 'Einzelzimmer', label: 'Einzelzimmer' },
];

export type GuestLanguage = 'de' | 'en' | 'it';
export const GUEST_LANGUAGE_OPTIONS: { value: GuestLanguage; label: string }[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'Englisch' },
    { value: 'it', label: 'Italienisch' },
];
