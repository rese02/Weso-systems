
'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPolicyPage() {
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
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-center">Datenschutzbestimmungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 prose prose-sm max-w-none">
                
                {/* German */}
                <section>
                    <h2 className="text-xl font-bold font-headline">Deutsch</h2>
                    <p>Diese Datenschutzrichtlinie beschreibt, wie Ihre persönlichen Daten erfasst, verwendet und weitergegeben werden, wenn Sie unser Buchungssystem nutzen.</p>
                    
                    <h3 className="font-semibold mt-4">1. Welche Daten wir erfassen</h3>
                    <p>Wir erfassen die folgenden Informationen, um Ihre Buchung zu bearbeiten:</p>
                    <ul>
                        <li><b>Persönliche Daten des Hauptbuchers:</b> Vor- und Nachname, E-Mail-Adresse, Telefonnummer, Alter.</li>
                        <li><b>Daten der Mitreisenden:</b> Vor- und Nachname, Geburtsdatum.</li>
                        <li><b>Zahlungsinformationen:</b> Wir erfassen einen Nachweis Ihrer Banküberweisung. Es werden keine Kreditkartendaten gespeichert.</li>
                        <li><b>Ausweisdokumente:</b> Wir erfassen eine digitale Kopie der Vorder- und Rückseite Ihres Ausweises, um gesetzlichen Meldepflichten nachzukommen.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">2. Wie wir Ihre Daten verwenden</h3>
                    <p>Ihre Daten werden ausschließlich für folgende Zwecke verwendet:</p>
                    <ul>
                        <li>Zur Abwicklung und Verwaltung Ihrer Buchung im jeweiligen Hotel.</li>
                        <li>Zur Kommunikation mit Ihnen bezüglich Ihrer Buchung (z.B. Bestätigungs-E-Mail).</li>
                        <li>Zur Erfüllung gesetzlicher Meldepflichten gegenüber den lokalen Behörden.</li>
                    </ul>

                     <h3 className="font-semibold mt-4">3. Datenspeicherung und -sicherheit</h3>
                    <p>Ihre Daten werden sicher auf den Servern von Google Firebase gespeichert, einem Dienst von Google Ireland Limited. Die Speicherung umfasst:</p>
                    <ul>
                        <li><b>Firebase Firestore:</b> Für Ihre Buchungs- und persönlichen Daten (Textinformationen).</li>
                        <li><b>Firebase Storage:</b> Für die hochgeladenen Dokumente (Ausweis, Zahlungsnachweis).</li>
                    </ul>
                    <p>Wir treffen alle angemessenen technischen und organisatorischen Maßnahmen, um Ihre Daten vor Verlust oder unbefugtem Zugriff zu schützen.</p>

                    <h3 className="font-semibold mt-4">4. Ihre Rechte</h3>
                    <p>Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten. Bitte kontaktieren Sie hierzu direkt das Hotel.</p>
                </section>

                <Separator />

                {/* Italian */}
                <section>
                    <h2 className="text-xl font-bold font-headline">Italiano</h2>
                    <p>Questa informativa sulla privacy descrive come le tue informazioni personali vengono raccolte, utilizzate e condivise quando utilizzi il nostro sistema di prenotazione.</p>
                    
                    <h3 className="font-semibold mt-4">1. Quali dati raccogliamo</h3>
                    <p>Raccogliamo le seguenti informazioni per elaborare la tua prenotazione:</p>
                    <ul>
                        <li><b>Dati personali del prenotante principale:</b> Nome e cognome, indirizzo e-mail, numero di telefono, età.</li>
                        <li><b>Dati degli accompagnatori:</b> Nome e cognome, data di nascita.</li>
                        <li><b>Informazioni di pagamento:</b> Raccogliamo una prova del tuo bonifico bancario. Non vengono memorizzati dati di carte di credito.</li>
                        <li><b>Documenti di identità:</b> Raccogliamo una copia digitale del fronte e del retro del tuo documento di identità per adempiere agli obblighi di legge.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">2. Come utilizziamo i tuoi dati</h3>
                    <p>I tuoi dati vengono utilizzati esclusivamente per i seguenti scopi:</p>
                    <ul>
                        <li>Per elaborare e gestire la tua prenotazione presso l'hotel corrispondente.</li>
                        <li>Per comunicare con te in merito alla tua prenotazione (ad es. e-mail di conferma).</li>
                        <li>Per adempiere agli obblighi di legge nei confronti delle autorità locali.</li>
                    </ul>
                    
                     <h3 className="font-semibold mt-4">3. Archiviazione e sicurezza dei dati</h3>
                    <p>I tuoi dati sono archiviati in modo sicuro sui server di Google Firebase, un servizio di Google Ireland Limited. L'archiviazione include:</p>
                    <ul>
                        <li><b>Firebase Firestore:</b> Per i tuoi dati di prenotazione e personali (informazioni testuali).</li>
                        <li><b>Firebase Storage:</b> Per i documenti caricati (documento d'identità, prova di pagamento).</li>
                    </ul>
                    <p>Adottiamo tutte le misure tecniche e organizzative ragionevoli per proteggere i tuoi dati da perdita o accesso non autorizzato.</p>

                    <h3 className="font-semibold mt-4">4. I tuoi diritti</h3>
                    <p>Hai il diritto di accedere, rettificare e cancellare i tuoi dati. A tal fine, contatta direttamente l'hotel.</p>
                </section>

                <Separator />

                {/* English */}
                <section>
                    <h2 className="text-xl font-bold font-headline">English</h2>
                    <p>This Privacy Policy describes how your personal information is collected, used, and shared when you use our booking system.</p>
                    
                    <h3 className="font-semibold mt-4">1. What data we collect</h3>
                    <p>We collect the following information to process your booking:</p>
                    <ul>
                        <li><b>Personal data of the main booker:</b> First and last name, email address, phone number, age.</li>
                        <li><b>Data of companions:</b> First and last name, date of birth.</li>
                        <li><b>Payment information:</b> We collect proof of your bank transfer. No credit card details are stored.</li>
                        <li><b>ID documents:</b> We collect a digital copy of the front and back of your ID to comply with legal reporting requirements.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">2. How we use your data</h3>
                    <p>Your data is used exclusively for the following purposes:</p>
                    <ul>
                        <li>To process and manage your booking at the respective hotel.</li>
                        <li>To communicate with you regarding your booking (e.g., confirmation email).</li>
                        <li>To comply with legal reporting obligations to local authorities.</li>
                    </ul>

                     <h3 className="font-semibold mt-4">3. Data storage and security</h3>
                    <p>Your data is securely stored on the servers of Google Firebase, a service provided by Google Ireland Limited. Storage includes:</p>
                    <ul>
                        <li><b>Firebase Firestore:</b> For your booking and personal data (text information).</li>
                        <li><b>Firebase Storage:</b> For the uploaded documents (ID, proof of payment).</li>
                    </ul>
                    <p>We take all reasonable technical and organizational measures to protect your data from loss or unauthorized access.</p>

                    <h3 className="font-semibold mt-4">4. Your rights</h3>
                    <p>You have the right to access, correct, and delete your data. To do so, please contact the hotel directly.</p>
                </section>

            </CardContent>
        </Card>
      </main>
      <footer className="py-4 mt-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {agencyName}. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
}
