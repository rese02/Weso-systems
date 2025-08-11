
'use server';

/**
 * @fileOverview Generates a personalized booking confirmation email.
 *
 * - generateConfirmationEmail - A function that generates the email content.
 * - ConfirmationEmailInput - The input type for the function.
 * - ConfirmationEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getBookingById } from '@/lib/actions/booking.actions';
import { getHotelById } from '@/lib/actions/hotel.actions';
import { format } from 'date-fns';

const ConfirmationEmailInputSchema = z.object({
  hotelId: z.string().describe('The ID of the hotel.'),
  bookingId: z.string().describe('The ID of the booking.'),
});
export type ConfirmationEmailInput = z.infer<
  typeof ConfirmationEmailInputSchema
>;

const ConfirmationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The full HTML body of the email.'),
});
export type ConfirmationEmailOutput = z.infer<
  typeof ConfirmationEmailOutputSchema
>;

export async function generateConfirmationEmail(
  input: ConfirmationEmailInput
): Promise<ConfirmationEmailOutput> {
  return confirmationEmailFlow(input);
}

const confirmationEmailFlow = ai.defineFlow(
  {
    name: 'confirmationEmailFlow',
    inputSchema: ConfirmationEmailInputSchema,
    outputSchema: ConfirmationEmailOutputSchema,
  },
  async ({ hotelId, bookingId }) => {
    const bookingResult = await getBookingById({ hotelId, bookingId });
    if (!bookingResult.success || !bookingResult.booking) {
      throw new Error(`Booking with ID ${bookingId} not found.`);
    }

    const hotelResult = await getHotelById(hotelId);
    if (!hotelResult.hotel) {
      throw new Error(`Hotel with ID ${hotelId} not found.`);
    }
    
    const booking = bookingResult.booking;
    const hotel = hotelResult.hotel;

    const checkInDate = format(new Date(booking.checkIn), 'dd.MM.yyyy');
    const checkOutDate = format(new Date(booking.checkOut), 'dd.MM.yyyy');

    const prompt = `
      You are an expert hospitality assistant. Generate a professional and friendly booking confirmation email.

      **Instructions:**
      1.  The email must be in the language specified by the guestLanguage field: 'de' for German, 'en' for English, 'it' for Italian.
      2.  The tone should be welcoming and reassuring.
      3.  The subject line must be clear and include the hotel name and booking confirmation.
      4.  The body must be valid HTML.
      5.  Include all the booking details provided below in a clear, easy-to-read format (e.g., using a list or a simple table).
      6.  Do not invent new information. Use only the data provided.
      7.  Include a closing statement with the hotel's contact information.
      8.  The output must be a JSON object with "subject" and "body" fields.

      **Data:**
      - Guest Language: ${booking.guestLanguage || 'de'}
      - Guest Name: ${booking.firstName} ${booking.lastName}
      - Hotel Name: ${hotel.name}
      - Hotel Email: ${hotel.ownerEmail}
      - Booking ID: ${booking.id.substring(0, 8).toUpperCase()}
      - Check-in Date: ${checkInDate}
      - Check-out Date: ${checkOutDate}
      - Board Type: ${booking.boardType}
      - Total Price: ${booking.priceTotal.toFixed(2)} €
      - Number of Rooms: ${booking.rooms.length}
      - Status: ${booking.status}
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      output: {
        format: 'json',
        schema: ConfirmationEmailOutputSchema,
      },
      model: 'googleai/gemini-2.0-flash',
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to generate email content.');
    }
    
    return output;
  }
);
