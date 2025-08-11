
'use server';

/**
 * @fileOverview Generates a personalized booking confirmation email based on a professional template.
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
import { de } from 'date-fns/locale';

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
    
    // --- Data Preparation for the Prompt ---
    const checkInDate = format(new Date(booking.checkIn), "EEEE, dd. MMMM yyyy '(from 3:00 PM)'", { locale: de });
    const checkOutDate = format(new Date(booking.checkOut), "EEEE, dd. MMMM yyyy '(until 10:00 AM)'", { locale: de });
    const bookingNumber = booking.id.substring(0, 8).toUpperCase();
    const guestName = `${booking.firstName} ${booking.lastName}`;
    const totalPersons = booking.rooms.reduce((acc, room) => acc + room.adults, 0);
    const paidAmount = booking.status === 'Partial Payment' ? booking.priceTotal * 0.3 : booking.priceTotal;
    const openAmount = booking.priceTotal - paidAmount;
    const selectedOption = booking.status === 'Partial Payment' ? 'Down Payment (30%)' : 'Full Payment';

    // Placeholder data as it's not in the hotel model
    const hotelPhone = "+39 380 77 66 834";
    const hotelFullAddress = "Roncstraße 7, 39040 Kastelruth (BZ) | South Tyrol - Italy";

    const prompt = `
      You are an expert hospitality assistant. Generate a professional and friendly booking confirmation email in HTML format.

      **Instructions:**
      1.  The email must be in the language specified: '${booking.guestLanguage || 'de'}'.
      2.  Use the exact HTML structure and styling provided in the template below.
      3.  The tone should be welcoming and professional.
      4.  The subject line must be: "Your booking confirmation from ${hotel.name} - Booking no: ${bookingNumber}"
      5.  Replace all placeholders like {{variable}} with the provided data. Do not invent new information.
      6.  The output must be a single JSON object with "subject" and "body" fields. The body must contain the complete HTML.

      **Data to use:**
      - guestName: "${guestName}"
      - bookingNumber: "${bookingNumber}"
      - arrivalDate: "${checkInDate}"
      - departureDate: "${checkOutDate}"
      - roomType: "${booking.rooms[0]?.roomType || 'Standard'}"
      - personCount: "${totalPersons} Ad."
      - boardType: "${booking.boardType}"
      - totalPrice: "${booking.priceTotal.toFixed(2)} €"
      - selectedOption: "${selectedOption}"
      - alreadyPaid: "${paidAmount.toFixed(2)} €"
      - stillOpen: "${openAmount.toFixed(2)} €"
      - hotelName: "${hotel.name}"
      - hotelPhone: "${hotelPhone}"
      - hotelEmail: "${hotel.ownerEmail}"
      - hotelAddress: "${hotelFullAddress}"
      - hotelDomain: "${hotel.domain}"
      - guestLanguage: "${booking.guestLanguage || 'de'}"

      **HTML Template:**
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #333; color: #eee; }
          .container { max-width: 600px; margin: 20px auto; background-color: #444; padding: 20px; }
          .header { background-color: #8f9e8b; padding: 20px; text-align: center; color: #2d2d2d; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0; }
          .content { padding: 20px; }
          .section-title { font-size: 18px; font-weight: bold; color: #8f9e8b; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px; }
          .details-table { width: 100%; border-collapse: collapse; }
          .details-table td { padding: 8px 0; font-size: 14px; }
          .details-table td:first-child { color: #bbb; width: 40%; }
          .important-info { background-color: #505050; padding: 15px; margin-top: 20px; border-radius: 5px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; padding-top: 10px; border-top: 1px solid #555;}
          .highlight { color: #e67e22; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Booking Confirmation</h1>
            <p>{{hotelName}}</p>
          </div>
          <div class="content">
            <p>Dear {{guestName}},</p>
            <p>thank you for your booking with us. We look forward to welcoming you soon!</p>
            
            <h2 class="section-title">Your Booking Details</h2>
            <table class="details-table">
              <tr><td>Booking Number:</td><td>{{bookingNumber}}</td></tr>
              <tr><td>First Name/Last Name:</td><td>{{guestName}}</td></tr>
              <tr><td>Arrival:</td><td>{{arrivalDate}}</td></tr>
              <tr><td>Departure:</td><td>{{departureDate}}</td></tr>
              <tr><td>Room 1:</td><td>{{roomType}}</td></tr>
              <tr><td>Persons (Room 1):</td><td>{{personCount}}</td></tr>
              <tr><td>Board Type:</td><td>{{boardType}}</td></tr>
            </table>

            <h2 class="section-title">Payment Information</h2>
            <table class="details-table">
              <tr><td>Total Price:</td><td>{{totalPrice}}</td></tr>
              <tr><td>Selected Option:</td><td>{{selectedOption}}</td></tr>
              <tr><td>Already paid:</td><td>{{alreadyPaid}}</td></tr>
              <tr><td><strong class="highlight">Still open (on arrival):</strong></td><td><strong class="highlight">{{stillOpen}}</strong></td></tr>
            </table>
            <p style="font-size: 12px; color: #bbb; margin-top: 5px;">The remaining amount of {{stillOpen}} is to be settled upon arrival at the hotel.</p>

            <div class="important-info">
              <h3>Important Information</h3>
              <p>Please bring this confirmation with you to check-in.</p>
              <p>If you have any questions, we are at your disposal:<br>
              Phone: {{hotelPhone}}<br>
              E-mail: {{hotelEmail}}</p>
            </div>

            <p style="margin-top: 30px;">We wish you a pleasant journey and look forward to your visit.</p>
            <p>Best regards,<br>Your {{hotelName}} Team</p>
          </div>
          <div class="footer">
            <p>{{hotelName}} | {{hotelAddress}}<br>
            www.{{hotelDomain}} | {{hotelEmail}}</p>
          </div>
        </div>
      </body>
      </html>
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

    