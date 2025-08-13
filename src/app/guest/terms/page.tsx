
'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function TermsAndConditionsPage() {
    const agencyName = "Weso Systems";

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="py-8 text-center">
        <Link href="/">
           <div className="inline-flex items-center gap-2 text-foreground">
             <Shield className="h-12 w-12 text-primary" />
             <span className="text-xl font-bold font-headline">{agencyName}</span>
           </div>
        </Link>
      </header>
      <main className="w-full flex-grow flex flex-col items-center">
        <Card className="w-full max-w-4xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-center">Allgemeine Geschäftsbedingungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 prose prose-sm max-w-none">
                
                {/* German */}
                <section>
                    <h2 className="text-xl font-bold font-headline">Deutsch</h2>
                    <h3 className="font-semibold mt-4">1. Vertragsabschluss</h3>
                    <p>Der Vertrag kommt durch die Annahme der Buchung durch das Hotel zustande. Die Bestätigung erfolgt per E-Mail, nachdem Sie alle erforderlichen Daten und den Zahlungsnachweis übermittelt haben.</p>
                    
                    <h3 className="font-semibold mt-4">2. Zahlungsbedingungen</h3>
                    <p>Bei der Buchung haben Sie die Wahl zwischen einer Anzahlung (30% des Gesamtpreises) oder der Zahlung des vollen Betrags. Die Zahlung muss per Banküberweisung auf das angegebene Konto erfolgen. Der Restbetrag ist bei Anreise im Hotel zu begleichen. Ein gültiger Zahlungsnachweis muss im Buchungsformular hochgeladen werden, damit die Buchung bestätigt werden kann.</p>

                    <h3 className="font-semibold mt-4">3. Stornierungsbedingungen</h3>
                    <p>Stornierungsbedingungen sind abhängig von den spezifischen Raten und Angeboten. Bitte entnehmen Sie die genauen Konditionen Ihrer Buchungsbestätigung oder kontaktieren Sie das Hotel direkt. (Dies ist ein Platzhaltertext).</p>

                    <h3 className="font-semibold mt-4">4. An- und Abreise</h3>
                    <p>Die Anreise ist am Anreisetag ab 15:00 Uhr möglich. Die Abreise muss am Abreisetag bis 10:00 Uhr erfolgen. Bitte legen Sie beim Check-in gültige Ausweisdokumente für alle Reisenden vor.</p>
                </section>

                <Separator />

                {/* Italian */}
                <section>
                    <h2 className="text-xl font-bold font-headline">Italiano</h2>
                    <h3 className="font-semibold mt-4">1. Conclusione del contratto</h3>
                    <p>Il contratto si perfeziona con l'accettazione della prenotazione da parte dell'hotel. La conferma viene inviata via e-mail dopo aver fornito tutti i dati richiesti e la prova di pagamento.</p>

                    <h3 className="font-semibold mt-4">2. Condizioni di pagamento</h3>
                    <p>Al momento della prenotazione, è possibile scegliere tra il pagamento di un acconto (30% del prezzo totale) o il pagamento dell'intero importo. Il pagamento deve essere effettuato tramite bonifico bancario sul conto specificato. L'importo residuo deve essere saldato all'arrivo in hotel. Per confermare la prenotazione, è necessario caricare una prova di pagamento valida nel modulo di prenotazione.</p>
                    
                    <h3 className="font-semibold mt-4">3. Politica di cancellazione</h3>
                    <p>Le condizioni di cancellazione dipendono dalle tariffe e dalle offerte specifiche. Si prega di fare riferimento alla conferma della prenotazione per i termini esatti o di contattare direttamente l'hotel. (Questo è un testo segnaposto).</p>

                    <h3 className="font-semibold mt-4">4. Arrivo e partenza</h3>
                    <p>L'arrivo è possibile dalle ore 15:00 del giorno di arrivo. La partenza deve avvenire entro le ore 10:00 del giorno di partenza. Si prega di presentare documenti di identità validi per tutti i viaggiatori al momento del check-in.</p>
                </section>

                <Separator />

                {/* English */}
                <section>
                    <h2 className="text-xl font-bold font-headline">English</h2>
                     <h3 className="font-semibold mt-4">1. Contract Conclusion</h3>
                    <p>The contract is concluded upon acceptance of the booking by the hotel. Confirmation will be sent via email after you have submitted all required data and proof of payment.</p>
                    
                    <h3 className="font-semibold mt-4">2. Payment Terms</h3>
                    <p>When booking, you have the choice between a down payment (30% of the total price) or payment of the full amount. Payment must be made by bank transfer to the specified account. The remaining balance is to be paid upon arrival at the hotel. A valid proof of payment must be uploaded in the booking form for the booking to be confirmed.</p>

                    <h3 className="font-semibold mt-4">3. Cancellation Policy</h3>
                    <p>Cancellation policies depend on the specific rates and offers. Please refer to your booking confirmation for the exact terms or contact the hotel directly. (This is a placeholder text).</p>

                    <h3 className="font-semibold mt-4">4. Arrival and Departure</h3>
                    <p>Arrival is possible from 3:00 PM on the day of arrival. Departure must be by 10:00 AM on the day of departure. Please present valid identification documents for all travelers at check-in.</p>
                </section>

            </CardContent>
        </Card>
      </main>
      <footer className="py-4 mt-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {agencyName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
