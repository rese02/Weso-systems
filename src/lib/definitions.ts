
import type { Timestamp } from 'firebase/firestore';
import * as z from 'zod';

// --- Base Data Models (as in Firestore) ---

export type GuestLanguage = 'de' | 'en' | 'it';

export interface Hotel {
  id: string;
  name: string;
  ownerEmail: string; // Internal/Login email
  domain: string;
  createdAt?: string; // Changed to string for serialization
  logoUrl?: string; // URL for the hotel logo
  
  // Public Contact Details
  contactPhone?: string;
  contactAddress?: string;
  contactEmail?: string; // Public contact email

  // Booking Configurations
  boardTypes?: string[];
  roomCategories?: string[];
  
  // Bank Details
  bankAccountHolder?: string;
  bankIBAN?: string;
  bankBIC?: string;
  bankName?: string;
  
  // SMTP Settings
  smtpUser?: string;
  smtpPass?: string;
}

export interface RoomDetails {
  roomType: string;
  adults: number;
  children: number;
  infants: number;
  childrenAges?: number[];
}

export interface Companion {
  firstName: string;
  lastName: string;
  dateOfBirth?: string; 
}

export type BookingStatus = 'Open' | 'Sent' | 'Submitted' | 'Confirmed' | 'Cancelled' | 'Checked-in' | 'Checked-out' | 'Partial Payment';

export interface Booking {
  id: string;
  hotelId: string;
  status: BookingStatus;
  createdAt: string; // Changed to string for serialization
  updatedAt?: string; // Changed to string for serialization
  submittedAt?: string; // Changed to string for serialization
  bookingLinkId?: string;
  guestLanguage?: GuestLanguage;
  checkIn: string; // ISO String
  checkOut: string; // ISO string
  boardType: string;
  priceTotal: number;
  rooms: RoomDetails[];
  internalNotes?: string;
  // Guest submitted data
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  age?: number;
  guestNotes?: string;
  documents?: {
    idFront?: string | null;
    idBack?: string | null;
    paymentProof?: string | null;
    submissionMethod?: 'upload' | 'on-site';
  };
  companions?: Companion[];
}

export interface BookingPrefill {
    checkIn: string; // ISO date string
    checkOut: string; // ISO date string
    boardType: string;
    priceTotal: number;
    bookingId: string;
    rooms: RoomDetails[];
    guestLanguage?: GuestLanguage;
    logoUrl?: string | null;
    // Prefill from creation form
    firstName?: string;
    lastName?: string;
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

export interface BookingLinkWithHotel extends BookingLink { 
    hotelName: string; 
    // This allows prefill data to be accessed on the combined type
    prefill: BookingLink['prefill'];
};

// --- Form Schemas and Options ---

export const roomFormSchema = z.object({
  roomType: z.string().min(1, "Zimmertyp ist erforderlich."),
  adults: z.coerce.number({invalid_type_error: "Anzahl Erwachsene muss eine Zahl sein."}).int().min(0, "Mindestens 0 Erwachsene."),
  children: z.coerce.number({invalid_type_error: "Anzahl Kinder muss eine Zahl sein."}).int().min(0, "Mindestens 0 Kinder."),
  infants: z.coerce.number({invalid_type_error: "Anzahl Kleinkinder muss eine Zahl sein."}).int().min(0, "Mindestens 0 Kleinkinder."),
  childrenAges: z.array(z.coerce.number().int().min(3).max(17)).optional(),
});

export const bookingFormSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  checkInDate: z.date({ required_error: "Anreisedatum ist erforderlich." }),
  checkOutDate: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  boardType: z.string().min(1, 'Verpflegungsart ist erforderlich.'),
  priceTotal: z.coerce.number().nullable(),
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

export const GUEST_LANGUAGE_OPTIONS: { value: GuestLanguage; label: string }[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'Englisch' },
    { value: 'it', label: 'Italienisch' },
];
