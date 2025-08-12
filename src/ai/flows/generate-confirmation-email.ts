
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
import { de, enUS, it } from 'date-fns/locale';

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
    const lang = booking.guestLanguage || 'de';
    
    // --- Data Preparation for the Prompt ---
    const locale = lang === 'en' ? enUS : lang === 'it' ? it : de;
    const checkInDate = format(new Date(booking.checkIn), "EEEE, dd. MMMM yyyy", { locale });
    const checkOutDate = format(new Date(booking.checkOut), "EEEE, dd. MMMM yyyy", { locale });
    const bookingNumber = booking.id.substring(0, 8).toUpperCase();
    const guestName = `${booking.firstName} ${booking.lastName}`;
    const totalPersons = booking.rooms.reduce((acc, room) => acc + room.adults + room.children, 0); // Infants don't count for person total usually
    const paidAmount = booking.status === 'Partial Payment' ? booking.priceTotal * 0.3 : booking.priceTotal;
    const openAmount = booking.priceTotal - paidAmount;
    
    // --- Translations for the prompt ---
    const translations = {
        de: {
            subject: `Ihre Buchungsbestätigung vom ${hotel.name} - Buchung Nr: ${bookingNumber}`,
            headerTitle: "Ihre Buchungsbestätigung",
            dear: "Sehr geehrte/r",
            thankYou: "vielen Dank für Ihre Buchung bei uns. Wir freuen uns, Sie bald bei uns begrüßen zu dürfen!",
            detailsTitle: "Ihre Buchungsdetails",
            bookingNumber: "Buchungsnummer:",
            guestName: "Name:",
            arrival: "Anreise:",
            departure: "Abreise:",
            room: "Zimmer",
            persons: "Personen (Zimmer",
            boardType: "Verpflegung:",
            paymentTitle: "Zahlungsinformationen",
            totalPrice: "Gesamtpreis:",
            selectedOption: "Gewählte Option:",
            alreadyPaid: "Bereits bezahlt:",
            stillOpen: "Noch offen (bei Anreise):",
            openAmountNote: `Der Restbetrag von ${openAmount.toFixed(2)} € ist bei Anreise im Hotel zu begleichen.`,
            importantInfoTitle: "Wichtige Informationen",
            bringConfirmation: "Bitte bringen Sie diese Bestätigung zum Check-in mit.",
            questions: "Bei Fragen stehen wir Ihnen gerne zur Verfügung:",
            phone: "Telefon:",
            journey: "Wir wünschen Ihnen eine angenehme Anreise und freuen uns auf Ihren Besuch.",
            bestRegards: "Mit freundlichen Grüßen,",
            team: `Ihr ${hotel.name} Team`,
            arrivalInfo: "(ab 15:00 Uhr)",
            departureInfo: "(bis 10:00 Uhr)",
            selectedOptionDeposit: "Anzahlung (30%)",
            selectedOptionFull: "Vollständige Zahlung",
        },
        en: {
            subject: `Your booking confirmation from ${hotel.name} - Booking no: ${bookingNumber}`,
            headerTitle: "Your Booking Confirmation",
            dear: "Dear",
            thankYou: "thank you for your booking with us. We look forward to welcoming you soon!",
            detailsTitle: "Your Booking Details",
            bookingNumber: "Booking Number:",
            guestName: "Name:",
            arrival: "Arrival:",
            departure: "Departure:",
            room: "Room",
            persons: "Persons (Room",
            boardType: "Board Type:",
            paymentTitle: "Payment Information",
            totalPrice: "Total Price:",
            selectedOption: "Selected Option:",
            alreadyPaid: "Already paid:",
            stillOpen: "Still open (on arrival):",
            openAmountNote: `The remaining amount of ${openAmount.toFixed(2)} € is to be settled upon arrival at the hotel.`,
            importantInfoTitle: "Important Information",
            bringConfirmation: "Please bring this confirmation with you to check-in.",
            questions: "If you have any questions, we are at your disposal:",
            phone: "Phone:",
            journey: "We wish you a pleasant journey and look forward to your visit.",
            bestRegards: "Best regards,",
            team: `Your ${hotel.name} Team`,
            arrivalInfo: "(from 3:00 PM)",
            departureInfo: "(until 10:00 AM)",
            selectedOptionDeposit: "Down Payment (30%)",
            selectedOptionFull: "Full Payment",
        },
        it: {
            subject: `La sua conferma di prenotazione da ${hotel.name} - Prenotazione n: ${bookingNumber}`,
            headerTitle: "La Sua Conferma di Prenotazione",
            dear: "Gentile",
            thankYou: "grazie per la sua prenotazione. Saremo lieti di accoglierla presto!",
            detailsTitle: "Dettagli della Sua Prenotazione",
            bookingNumber: "Numero di Prenotazione:",
            guestName: "Nome:",
            arrival: "Arrivo:",
            departure: "Partenza:",
            room: "Camera",
            persons: "Persone (Camera",
            boardType: "Trattamento:",
            paymentTitle: "Informazioni sul Pagamento",
            totalPrice: "Prezzo Totale:",
            selectedOption: "Opzione Selezionata:",
            alreadyPaid: "Già pagato:",
            stillOpen: "Ancora da saldare (all'arrivo):",
            openAmountNote: `L'importo rimanente di ${openAmount.toFixed(2)} € deve essere saldato all'arrivo in hotel.`,
            importantInfoTitle: "Informazioni Importanti",
            bringConfirmation: "Si prega di portare questa conferma con sé al check-in.",
            questions: "Per qualsiasi domanda, siamo a sua completa disposizione:",
            phone: "Telefono:",
            journey: "Le auguriamo un buon viaggio e attendiamo con piacere la sua visita.",
            bestRegards: "Cordiali saluti,",
            team: `Il team di ${hotel.name}`,
            arrivalInfo: "(dalle 15:00)",
            departureInfo: "(fino alle 10:00)",
            selectedOptionDeposit: "Acconto (30%)",
            selectedOptionFull: "Pagamento completo",
        }
    };

    const t = translations[lang];
    const selectedOptionText = booking.status === 'Partial Payment' ? t.selectedOptionDeposit : t.selectedOptionFull;

    // Placeholder data as it's not in the hotel model
    const hotelPhone = "+39 380 77 66 834";
    const hotelFullAddress = "Roncstraße 7, 39040 Kastelruth (BZ) | South Tyrol - Italy";

    const prompt = `
      You are an expert hospitality assistant. Generate a professional and friendly booking confirmation email in HTML format.

      **Instructions:**
      1.  The email must be entirely in the language specified: '${lang}'. Use the provided translations.
      2.  Use the exact HTML structure and styling provided in the template below.
      3.  The tone should be welcoming and professional.
      4.  The subject line must be: "${t.subject}"
      5.  Replace all placeholders like {{variable}} with the provided data. Do not invent new information.
      6.  The output must be a single JSON object with "subject" and "body" fields. The body must contain the complete HTML.

      **Data to use:**
      - guestName: "${guestName}"
      - bookingNumber: "${bookingNumber}"
      - arrivalDate: "${checkInDate} ${t.arrivalInfo}"
      - departureDate: "${checkOutDate} ${t.departureInfo}"
      - totalPersons: "${totalPersons}"
      - totalPrice: "${booking.priceTotal.toFixed(2)} €"
      - selectedOption: "${selectedOptionText}"
      - alreadyPaid: "${paidAmount.toFixed(2)} €"
      - stillOpen: "${openAmount.toFixed(2)} €"
      - hotelName: "${hotel.name}"
      - hotelPhone: "${hotelPhone}"
      - hotelEmail: "${hotel.ownerEmail}"
      - hotelAddress: "${hotelFullAddress}"
      - hotelDomain: "${hotel.domain}"

      **HTML Template with Placeholders:**
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #8f9e8b; padding: 20px; text-align: center; color: #ffffff; border-radius: 8px 8px 0 0;}
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0; }
          .content { padding: 20px; }
          .section-title { font-size: 18px; font-weight: bold; color: #8f9e8b; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #8f9e8b; padding-bottom: 5px; }
          .details-table { width: 100%; border-collapse: collapse; }
          .details-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; }
          .details-table td:first-child { color: #555; width: 40%; }
          .important-info { background-color: #f9f9f9; border: 1px dashed #ddd; padding: 15px; margin-top: 20px; border-radius: 5px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee;}
          .highlight { color: #e67e22; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${t.headerTitle}</h1>
            <p>{{hotelName}}</p>
          </div>
          <div class="content">
            <p>${t.dear} {{guestName}},</p>
            <p>${t.thankYou}</p>
            
            <h2 class="section-title">${t.detailsTitle}</h2>
            <table class="details-table">
              <tr><td>${t.bookingNumber}</td><td>{{bookingNumber}}</td></tr>
              <tr><td>${t.guestName}</td><td>{{guestName}}</td></tr>
              <tr><td>${t.arrival}</td><td>{{arrivalDate}}</td></tr>
              <tr><td>${t.departure}</td><td>{{departureDate}}</td></tr>
              ${booking.rooms.map((room, index) => `
                <tr><td>${t.room} ${index + 1}:</td><td>${room.roomType}</td></tr>
                <tr><td>${t.persons} ${index + 1}):</td><td>${room.adults + room.children} Ad.</td></tr>
              `).join('')}
              <tr><td>${t.boardType}</td><td>${booking.boardType}</td></tr>
            </table>

            <h2 class="section-title">${t.paymentTitle}</h2>
            <table class="details-table">
              <tr><td>${t.totalPrice}</td><td>{{totalPrice}}</td></tr>
              <tr><td>${t.selectedOption}</td><td>{{selectedOption}}</td></tr>
              <tr><td>${t.alreadyPaid}</td><td>{{alreadyPaid}}</td></tr>
              <tr><td><strong class="highlight">${t.stillOpen}</strong></td><td><strong class="highlight">{{stillOpen}}</strong></td></tr>
            </table>
            <p style="font-size: 12px; color: #777; margin-top: 5px;">${t.openAmountNote}</p>

            <div class="important-info">
              <h3>${t.importantInfoTitle}</h3>
              <p>${t.bringConfirmation}</p>
              <p>${t.questions}<br>
              ${t.phone} {{hotelPhone}}<br>
              E-mail: {{hotelEmail}}</p>
            </div>

            <p style="margin-top: 30px;">${t.journey}</p>
            <p>${t.bestRegards},<br>${t.team}</p>
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

    