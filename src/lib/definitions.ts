
import type { Timestamp } from 'firebase/firestore';

// Corresponds to the Firestore data model /hotels/{hotelId}/bookings/{bookingId}
export interface RoomDetails {
  roomType: string;
  adults: number;
  children: number;
  infants: number;
  childrenAges: number[];
}

export type BookingStatus = 'Open' | 'Sent' | 'Submitted' | 'Confirmed' | 'Cancelled' | 'Checked-in' | 'Checked-out' | 'Partial Payment';

export interface Booking {
  id: string; // The Firestore document ID
  hotelId: string; // The ID of the hotel this booking belongs to
  
  // State and Metadata
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp; // Added for tracking last modification
  submittedAt?: Timestamp;
  bookingLinkId?: string;
  guestLanguage?: string;

  // Prefill/Core data
  checkIn: string; // ISO String
  checkOut: string; // ISO string
  boardType: string;
  priceTotal: number;
  rooms: RoomDetails[];
  internalNotes?: string;

  // Guest-provided data
  firstName?: string;
  lastName?: string;
  email?: string;
  
  // References to documents in Storage
  documents?: {
    idDoc?: string; // URL to the file in Firebase Storage
    paymentProof?: string; // URL to the file in Firebase Storage
  };
}


// --- Guest-facing Form Data ---

// This is the data that will be pre-filled in the guest form.
export interface BookingPrefill {
    roomType: string;
    checkIn: string; // ISO date string
    checkOut: string; // ISO date string
    priceTotal: number;
    bookingId: string; // The ID of the booking document to be updated
}

// Corresponds to the Firestore data model /hotels/{hotelId}/bookingLinks/{tokenId}
export interface BookingLink {
  id: string; // Firestore document ID
  bookingId: string; // The ID of the booking this link belongs to
  hotelId: string; // The ID of the hotel this link belongs to
  
  createdBy: string; // For now, a placeholder for user UID
  createdAt: Timestamp | string;
  expiresAt: Timestamp | string;
  status: 'active' | 'used' | 'expired';

  prefill: BookingPrefill;
}

// Type for the data passed to the guest page component
export type BookingLinkWithHotel = BookingLink & { hotelName: string };


// --- Admin/Hotelier Form Creation Data ---

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

export type GuestLanguage = 'de' | 'en' | 'it' | 'fr';
export const GUEST_LANGUAGE_OPTIONS: { value: GuestLanguage; label: string }[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'Englisch' },
    { value: 'it', label: 'Italienisch' },
    { value: 'fr', label: 'Französisch' },
];
