
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './step-indicator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Loader2, Info, User, Mail, Phone, Calendar as CalendarLucideIcon, File, Check, Paperclip, Trash2, Users, Banknote, Copy, CreditCard } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { format, parseISO } from 'date-fns';
import { de, enUS, it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import type { BookingLink, Hotel, Companion, GuestLanguage } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase.client';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Timestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Calendar } from '../ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { generateConfirmationEmail } from '@/ai/flows/generate-confirmation-email';
import { getHotelById } from '@/lib/actions/hotel.actions';
import Link from 'next/link';
import { sendEmail } from '@/lib/actions/email.actions';


const translations = {
    de: {
        steps: ['Gast', 'Mitreiser', 'Option', 'Zahlung', 'Prüfung'],
        overviewTitle: 'Ihre Buchungsübersicht',
        period: 'Zeitraum:',
        room: 'Zimmer',
        adult: 'Erw.',
        child: 'Ki.',
        boardType: 'Verpflegung:',
        totalPrice: 'Gesamtpreis:',
        step1: {
            title: "Ihre Daten (Hauptbucher)",
            description: "Bitte füllen Sie die folgenden Felder aus.",
            firstName: "Vorname *",
            lastName: "Nachname *",
            email: "E-Mail *",
            phone: "Telefon *",
            age: "Alter (optional, mind. 18)",
            notesTitle: "Ihre Anmerkungen (optional)",
            notesPlaceholder: "Ihre Anmerkungen...",
            documentsTitle: "Ausweisdokumente *",
            documentsDescription: "Bitte wählen Sie, wie Sie die Ausweisdokumente bereitstellen möchten.",
            uploadNow: "Jetzt hochladen",
            showOnSite: "Bei Ankunft vorzeigen",
            idFront: "Ausweisdokument (Vorderseite)",
            idBack: "Ausweisdokument (Rückseite)",
            fileSelect: "Datei auswählen",
            fileTooLarge: "Datei ist zu groß (max. 5MB).",
            invalidFileType: "Ungültiger Dateityp (nur JPG, PNG, PDF).",
            uploadFailed: "Upload fehlgeschlagen.",
            fileHint: "JPG, PNG, PDF (max 5MB)."
        },
        step2: {
            title: "Begleitpersonen",
            description: (count: number) => `Bitte füllen Sie die Daten für Ihre ${count} Begleitperson(en) aus.`,
            noCompanions: "Sie haben keine Begleitpersonen für diese Buchung angegeben.",
            companion: "Mitreisender",
            firstName: "Vorname *",
            lastName: "Nachname *",
            dob: "Geburtsdatum *",
            selectDob: "TT.MM.JJJJ",
            docInfoTitle: "Hinweis zu Dokumenten",
            docInfoUpload: "Für Mitreisende sind keine Ausweis-Uploads erforderlich. Der Ausweis des Hauptbuchers ist ausreichend.",
            docInfoOnSite: "Bitte bringen Sie für alle Mitreisenden gültige Ausweisdokumente für den Check-in vor Ort mit."
        },
        step3: {
            title: "Zahl-Option",
            selectOption: "Wählen Sie Ihre Zahlungsoption *",
            totalPriceIs: (price: string) => `Der Gesamtpreis dieser Buchung beträgt: ${price} €`,
            deposit: "Anzahlung (30%)",
            fullAmount: "Gesamtbetrag (100%)",
            amountToPay: "Gewählter Betrag zur Überweisung:"
        },
        step4: {
            title: "Zahlung",
            info: "Zahlungsinformationen & Nachweis *",
            description: "Bitte überweisen Sie den gewählten Betrag und laden Sie anschließend einen Nachweis hoch.",
            totalPrice: "Gesamtpreis:",
            yourSelection: "Ihre Auswahl:",
            selectionDeposit: "Anzahlung",
            selectionFull: "Gesamtzahlung",
            toPayNow: "Jetzt zu überweisen:",
            restOnArrival: "Restbetrag bei Anreise im Hotel:",
            bankTransferTo: "Banküberweisung an:",
            accountHolder: "Kontoinhaber",
            iban: "IBAN",
            bic: "BIC/SWIFT",
            bank: "Bank",
            paymentPurpose: "Verwendungszweck",
            paymentPurposeHint: "Bitte geben Sie dies bei Ihrer Überweisung an.",
            paymentProof: "Zahlungsnachweis hochladen *",
            creditCard: "Kreditkarte",
            creditCardNotAvailable: "Zahlung per Kreditkarte ist derzeit nicht verfügbar.",
            loadingBankDetails: "Lade Bankdaten...",
            copySuccess: (label: string) => `${label} wurde in die Zwischenablage kopiert.`
        },
        step5: {
            title: "Prüfung",
            description: "Bitte überprüfen Sie alle eingegebenen Informationen sorgfältig, bevor Sie die Daten endgültig absenden.",
            mainGuest: "Ihre Daten (Hauptgast)",
            firstName: "Vorname",
            lastName: "Nachname",
            email: "E-Mail",
            phone: "Telefon",
            documents: "Ausweisdokumente",
            uploaded: "Hochgeladen",
            showOnSite: "Bei Ankunft vorzeigen",
            companions: "Mitreisende",
            person: "Person",
            paymentInfo: "Zahlungsinformationen",
            totalPrice: "Gesamtpreis",
            selectedOption: "Gewählte Option",
            optionDeposit: "Anzahlung (30%)",
            optionFull: "Gesamtbetrag (100%)",
            paidAmount: "Überwiesener Betrag",
            restOnArrival: "Restbetrag bei Anreise",
            paymentMethod: "Zahlungsart",
            bankTransfer: "Banküberweisung",
            paymentProof: "Zahlungsbeleg",
            terms: `Indem Sie auf 'Daten absenden' klicken, bestätigen Sie, dass Sie die <a href="/guest/privacy" target="_blank" rel="noopener noreferrer" class="underline">Datenschutzbestimmungen</a> und die <a href="/guest/terms" target="_blank" rel="noopener noreferrer" class="underline">AGB</a> gelesen haben und diesen zustimmen.`
        },
        buttons: {
            back: "Zurück",
            next: "Speichern & Weiter",
            submit: "Daten absenden",
            submitting: "Wird übermittelt..."
        },
        toasts: {
            missingFields: "Bitte füllen Sie alle Pflichtfelder (*) aus.",
            missingDocs: "Bitte laden Sie Vorder- und Rückseite Ihres Ausweises hoch.",
            fileErrors: "Bitte korrigieren Sie die Fehler bei den hochgeladenen Dateien.",
            companionCountError: (count: number) => `Bitte fügen Sie die Daten für alle ${count} Begleitpersonen hinzu.`,
            companionFieldsError: "Bitte füllen Sie alle Felder für jeden Mitreisenden aus.",
            missingProof: "Bitte laden Sie einen Zahlungsnachweis hoch.",
            proofError: "Bitte korrigieren Sie den Fehler bei der hochgeladenen Datei.",
            submitErrorTitle: "Fehler bei der Übermittlung",
            submitErrorDesc: "Es gab ein Problem bei der Übermittlung Ihrer Buchung. Bitte versuchen Sie es erneut.",
            submitSuccessTitle: "Buchung übermittelt!",
            submitSuccessDesc: "Ihre Buchungsdetails wurden an das Hotel gesendet.",
            emailSuccess: "Bestätigungs-E-Mail gesendet!",
            emailSuccessDesc: "Eine Kopie der Bestätigung wurde an Ihre E-Mail gesendet.",
            emailError: "Die Bestätigungs-E-Mail konnte nicht gesendet werden. Ihre Buchung ist aber eingegangen."
        },
        stepOf: "von"
    },
    en: {
        steps: ['Guest', 'Companions', 'Option', 'Payment', 'Review'],
        overviewTitle: 'Your Booking Summary',
        period: 'Period:',
        room: 'Room',
        adult: 'Ad.',
        child: 'Ch.',
        boardType: 'Board Type:',
        totalPrice: 'Total Price:',
        step1: {
            title: "Your Details (Main Booker)",
            description: "Please fill in the following fields.",
            firstName: "First Name *",
            lastName: "Last Name *",
            email: "Email *",
            phone: "Phone *",
            age: "Age (optional, min. 18)",
            notesTitle: "Your Notes (optional)",
            notesPlaceholder: "Your notes...",
            documentsTitle: "ID Documents *",
            documentsDescription: "Please choose how you want to provide the ID documents.",
            uploadNow: "Upload now",
            showOnSite: "Show at check-in",
            idFront: "ID Document (Front)",
            idBack: "ID Document (Back)",
            fileSelect: "Select file",
            fileTooLarge: "File is too large (max 5MB).",
            invalidFileType: "Invalid file type (only JPG, PNG, PDF).",
            uploadFailed: "Upload failed.",
            fileHint: "JPG, PNG, PDF (max 5MB)."
        },
        step2: {
            title: "Companions",
            description: (count: number) => `Please fill in the details for your ${count} companion(s).`,
            noCompanions: "You have not specified any companions for this booking.",
            companion: "Companion",
            firstName: "First Name *",
            lastName: "Last Name *",
            dob: "Date of Birth *",
            selectDob: "DD/MM/YYYY",
            docInfoTitle: "Note on Documents",
            docInfoUpload: "No ID uploads are required for companions. The main booker's ID is sufficient.",
            docInfoOnSite: "Please bring valid ID documents for all companions for check-in on-site."
        },
        step3: {
            title: "Payment Option",
            selectOption: "Choose your payment option *",
            totalPriceIs: (price: string) => `The total price of this booking is: ${price} €`,
            deposit: "Down Payment (30%)",
            fullAmount: "Full Amount (100%)",
            amountToPay: "Selected amount for transfer:"
        },
        step4: {
            title: "Payment",
            info: "Payment Information & Proof *",
            description: "Please transfer the selected amount and then upload a proof of payment.",
            totalPrice: "Total Price:",
            yourSelection: "Your Selection:",
            selectionDeposit: "Down Payment",
            selectionFull: "Full Payment",
            toPayNow: "To be paid now:",
            restOnArrival: "Remaining amount on arrival at the hotel:",
            bankTransferTo: "Bank transfer to:",
            accountHolder: "Account Holder",
            iban: "IBAN",
            bic: "BIC/SWIFT",
            bank: "Bank",
            paymentPurpose: "Payment Purpose",
            paymentPurposeHint: "Please state this in your bank transfer.",
            paymentProof: "Upload Proof of Payment *",
            creditCard: "Credit Card",
            creditCardNotAvailable: "Payment by credit card is currently not available.",
            loadingBankDetails: "Loading bank details...",
            copySuccess: (label: string) => `${label} copied to clipboard.`
        },
        step5: {
            title: "Review",
            description: "Please review all information carefully before finally submitting the data.",
            mainGuest: "Your Details (Main Guest)",
            firstName: "First Name",
            lastName: "Last Name",
            email: "Email",
            phone: "Phone",
            documents: "ID Documents",
            uploaded: "Uploaded",
            showOnSite: "Show at check-in",
            companions: "Companions",
            person: "Person",
            paymentInfo: "Payment Information",
            totalPrice: "Total Price",
            selectedOption: "Selected Option",
            optionDeposit: "Down Payment (30%)",
            optionFull: "Full Amount (100%)",
            paidAmount: "Transferred Amount",
            restOnArrival: "Remaining on arrival",
            paymentMethod: "Payment Method",
            bankTransfer: "Bank Transfer",
            paymentProof: "Proof of Payment",
            terms: `By clicking 'Submit Data', you confirm that you have read and agree to the <a href="/guest/privacy" target="_blank" rel="noopener noreferrer" class="underline">Privacy Policy</a> and the <a href="/guest/terms" target="_blank" rel="noopener noreferrer" class="underline">Terms & Conditions</a>.`
        },
        buttons: {
            back: "Back",
            next: "Save & Continue",
            submit: "Submit Data",
            submitting: "Submitting..."
        },
        toasts: {
            missingFields: "Please fill in all required fields (*).",
            missingDocs: "Please upload the front and back of your ID.",
            fileErrors: "Please correct the errors in the uploaded files.",
            companionCountError: (count: number) => `Please add the data for all ${count} companions.`,
            companionFieldsError: "Please fill in all fields for each companion.",
            missingProof: "Please upload a proof of payment.",
            proofError: "Please correct the error in the uploaded file.",
            submitErrorTitle: "Submission Error",
            submitErrorDesc: "There was a problem submitting your booking. Please try again.",
            submitSuccessTitle: "Booking Submitted!",
            submitSuccessDesc: "Your booking details have been sent to the hotel.",
            emailSuccess: "Confirmation email sent!",
            emailSuccessDesc: "A copy of the confirmation has been sent to your email.",
            emailError: "The confirmation email could not be sent. However, your booking has been received."
        },
        stepOf: "of"
    },
    it: {
        steps: ['Ospite', 'Ospiti', 'Opzione', 'Pagamento', 'Riepilogo'],
        overviewTitle: 'Riepilogo della Sua Prenotazione',
        period: 'Periodo:',
        room: 'Camera',
        adult: 'Ad.',
        child: 'Bam.',
        boardType: 'Trattamento:',
        totalPrice: 'Prezzo Totale:',
        step1: {
            title: "I Suoi Dati (Ospite Principale)",
            description: "Si prega di compilare i seguenti campi.",
            firstName: "Nome *",
            lastName: "Cognome *",
            email: "E-mail *",
            phone: "Telefono *",
            age: "Età (opzionale, min. 18)",
            notesTitle: "Le Sue Note (opzionale)",
            notesPlaceholder: "Le Sue note...",
            documentsTitle: "Documenti di Identità *",
            documentsDescription: "Si prega di scegliere come fornire i documenti di identità.",
            uploadNow: "Carica ora",
            showOnSite: "Mostra all'arrivo",
            idFront: "Documento (fronte)",
            idBack: "Documento (retro)",
            fileSelect: "Seleziona file",
            fileTooLarge: "File troppo grande (max 5MB).",
            invalidFileType: "Tipo di file non valido (solo JPG, PNG, PDF).",
            uploadFailed: "Caricamento fallito.",
            fileHint: "JPG, PNG, PDF (max 5MB)."
        },
        step2: {
            title: "Accompagnatori",
            description: (count: number) => `Si prega di compilare i dati per i suoi ${count} accompagnatori.`,
            noCompanions: "Non ha specificato accompagnatori per questa prenotazione.",
            companion: "Accompagnatore",
            firstName: "Nome *",
            lastName: "Cognome *",
            dob: "Data di Nascita *",
            selectDob: "GG/MM/AAAA",
            docInfoTitle: "Nota sui Documenti",
            docInfoUpload: "Non sono richiesti caricamenti di documenti per gli accompagnatori. È sufficiente il documento dell'ospite principale.",
            docInfoOnSite: "Si prega di portare documenti di identità validi per tutti gli accompagnatori per il check-in in loco."
        },
        step3: {
            title: "Opzione di Pagamento",
            selectOption: "Scelga la sua opzione di pagamento *",
            totalPriceIs: (price: string) => `Il prezzo totale di questa prenotazione è: ${price} €`,
            deposit: "Acconto (30%)",
            fullAmount: "Importo Totale (100%)",
            amountToPay: "Importo selezionato per il bonifico:"
        },
        step4: {
            title: "Pagamento",
            info: "Informazioni di Pagamento e Prova *",
            description: "Si prega di effettuare il bonifico dell'importo selezionato e di caricare una prova di pagamento.",
            totalPrice: "Prezzo Totale:",
            yourSelection: "La Sua Selezione:",
            selectionDeposit: "Acconto",
            selectionFull: "Pagamento totale",
            toPayNow: "Da pagare ora:",
            restOnArrival: "Importo rimanente all'arrivo in hotel:",
            bankTransferTo: "Bonifico bancario a:",
            accountHolder: "Intestatario del Conto",
            iban: "IBAN",
            bic: "BIC/SWIFT",
            bank: "Banca",
            paymentPurpose: "Causale di Pagamento",
            paymentPurposeHint: "Si prega di indicare questo nella causale del bonifico.",
            paymentProof: "Carica Prova di Pagamento *",
            creditCard: "Carta di Credito",
            creditCardNotAvailable: "Il pagamento con carta di credito non è attualmente disponibile.",
            loadingBankDetails: "Caricamento dati bancari...",
            copySuccess: (label: string) => `${label} copiato negli appunti.`
        },
        step5: {
            title: "Riepilogo",
            description: "Si prega di controllare attentamente tutte le informazioni inserite prima di inviare definitivamente i dati.",
            mainGuest: "I Suoi Dati (Ospite Principale)",
            firstName: "Nome",
            lastName: "Cognome",
            email: "E-mail",
            phone: "Telefono",
            documents: "Documenti di Identità",
            uploaded: "Caricato",
            showOnSite: "Mostra all'arrivo",
            companions: "Accompagnatori",
            person: "Persona",
            paymentInfo: "Informazioni di Pagamento",
            totalPrice: "Prezzo Totale",
            selectedOption: "Opzione Selezionata",
            optionDeposit: "Acconto (30%)",
            optionFull: "Importo Totale (100%)",
            paidAmount: "Importo Bonificato",
            restOnArrival: "Saldo all'arrivo",
            paymentMethod: "Metodo di Pagamento",
            bankTransfer: "Bonifico Bancario",
            paymentProof: "Prova di Pagamento",
            terms: `Cliccando su 'Invia Dati', confermi di aver letto e di accettare l'<a href="/guest/privacy" target="_blank" rel="noopener noreferrer" class="underline">Informativa sulla Privacy</a> e i <a href="/guest/terms" target="_blank" rel="noopener noreferrer" class="underline">Termini e Condizioni</a>.`
        },
        buttons: {
            back: "Indietro",
            next: "Salva e Continua",
            submit: "Invia Dati",
            submitting: "Invio in corso..."
        },
        toasts: {
            missingFields: "Si prega di compilare tutti i campi obbligatori (*).",
            missingDocs: "Si prega di caricare il fronte e il retro del suo documento d'identità.",
            fileErrors: "Si prega di correggere gli errori nei file caricati.",
            companionCountError: (count: number) => `Si prega di aggiungere i dati per tutti i ${count} accompagnatori.`,
            companionFieldsError: "Si prega di compilare tutti i campi per ogni accompagnatore.",
            missingProof: "Si prega di caricare una prova di pagamento.",
            proofError: "Si prega di correggere l'errore nel file caricato.",
            submitErrorTitle: "Errore nell'Invio",
            submitErrorDesc: "C'è stato un problema nell'invio della sua prenotazione. Si prega di riprovare.",
            submitSuccessTitle: "Prenotazione Inviata!",
            submitSuccessDesc: "I dettagli della sua prenotazione sono stati inviati all'hotel.",
            emailSuccess: "E-mail di conferma inviata!",
            emailSuccessDesc: "Una copia della conferma è stata inviata alla sua e-mail.",
            emailError: "Non è stato possibile inviare l'e-mail di conferma. Tuttavia, la sua prenotazione è stata ricevuta."
        },
        stepOf: "di"
    }
};


type FileUpload = {
    file: File;
    progress: number;
    url?: string;
    name: string; // e.g. 'idFront', 'idBack'
    error?: string;
}

const BookingOverview = ({ prefillData, lang }: { prefillData?: BookingLink['prefill'] | null, lang: GuestLanguage }) => {
    if (!prefillData) return null;
    const t = translations[lang].overviewTitle;
    const t_period = translations[lang].period;
    const t_room = translations[lang].room;
    const t_adult = translations[lang].adult;
    const t_child = translations[lang].child;
    const t_board = translations[lang].boardType;
    const t_total = translations[lang].totalPrice;

    return (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3 mb-6">
            <h3 className="font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-primary" />{t}</h3>
            <div className="text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t_period}</span>
                    <span className="font-medium">{prefillData?.checkIn && prefillData?.checkOut ? `${format(parseISO(prefillData.checkIn), 'dd.MM.yyyy')} - ${format(parseISO(prefillData.checkOut), 'dd.MM.yyyy')}` : 'N/A'}</span>
                </div>
                 {prefillData.rooms.map((room, index) => (
                    <div className="flex justify-between" key={index}>
                         <span className="text-muted-foreground">{t_room} {index + 1}:</span>
                         <span className="font-medium">{room.roomType} ({room.adults} {t_adult}, {room.children} {t_child})</span>
                    </div>
                ))}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t_board}</span>
                    <span className="font-medium">{prefillData?.boardType}</span>
                </div>
                <Separator/>
                <div className="flex justify-between font-bold">
                    <span className="text-muted-foreground">{t_total}</span>
                    <span>{prefillData?.priceTotal?.toFixed(2)} €</span>
                </div>
            </div>
        </div>
    )
};

const FileUploadInput = ({ id, label, onFileSelect, upload, onRemove, required, lang }: { id: string, label: string, onFileSelect: (file: File) => void, upload?: FileUpload, onRemove: () => void, required?: boolean, lang: GuestLanguage }) => {
    const t = translations[lang].step1;
    if (upload && !upload.error) {
        return (
             <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                     <Paperclip className="h-4 w-4" />
                     <span className="truncate max-w-[200px] sm:max-w-xs">{upload.file.name}</span>
                 </div>
                 <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-green-800" onClick={onRemove}><Trash2 className="h-4 w-4"/></Button>
             </div>
        )
    }

    return (
        <div>
            <Label htmlFor={id} className="text-sm font-medium">{label} {required && '*'}</Label>
            <div className="mt-2">
                 <label htmlFor={id} className="relative flex w-full items-center justify-center rounded-md border-2 border-dashed border-border px-3 py-2 text-sm ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:bg-muted/50 cursor-pointer">
                    <File className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="text-primary font-medium">{t.fileSelect}</span>
                    <Input id={id} type="file" className="sr-only" onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} accept="image/png, image/jpeg, application/pdf" />
                </label>
            </div>
            {upload?.error && <p className="text-destructive text-xs mt-1">{upload.error}</p>}
             <p className="text-xs text-muted-foreground mt-1">{t.fileHint}</p>
        </div>
    );
};

const Step1GuestInfo = ({ formData, handleInputChange, prefillData, uploads, handleFileUpload, removeUpload, documentOption, setDocumentOption, lang }: {
    formData: any;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    prefillData?: BookingLink['prefill'] | null;
    uploads: Record<string, FileUpload>;
    handleFileUpload: (name: string, file: File) => void;
    removeUpload: (name: string) => void;
    documentOption: 'upload' | 'on-site';
    setDocumentOption: (option: 'upload' | 'on-site') => void;
    lang: GuestLanguage;
}) => {
    const t = translations[lang].step1;
    return (
        <div className="space-y-6">
            <BookingOverview prefillData={prefillData} lang={lang} />

            <div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5"><Label htmlFor="firstName" className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/>{t.firstName}</Label><Input id="firstName" name="firstName" required value={formData.firstName || ''} onChange={handleInputChange} /></div>
                    <div className="grid gap-1.5"><Label htmlFor="lastName" className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/>{t.lastName}</Label><Input id="lastName" name="lastName" required value={formData.lastName || ''} onChange={handleInputChange}/></div>
                    <div className="grid gap-1.5"><Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/>{t.email}</Label><Input id="email" name="email" type="email" required value={formData.email || ''} onChange={handleInputChange}/></div>
                    <div className="grid gap-1.5"><Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/>{t.phone}</Label><Input id="phone" name="phone" type="tel" required value={formData.phone || ''} onChange={handleInputChange}/></div>
                    <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="age" className="flex items-center gap-2"><CalendarLucideIcon className="w-4 h-4 text-muted-foreground"/>{t.age}</Label><Input id="age" name="age" type="number" value={formData.age || ''} onChange={handleInputChange}/></div>
                </div>
            </div>

            <div>
                 <h3 className="font-semibold">{t.documentsTitle}</h3>
                 <p className="text-sm text-muted-foreground">{t.documentsDescription}</p>
                 <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button type="button" variant={documentOption === 'upload' ? 'default' : 'outline'} onClick={() => setDocumentOption('upload')} className="h-auto min-h-10 justify-center px-2">
                        <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", documentOption !== 'upload' && 'opacity-0')}/>
                        <span className="text-center">{t.uploadNow}</span>
                    </Button>
                    <Button type="button" variant={documentOption === 'on-site' ? 'default' : 'outline'} onClick={() => setDocumentOption('on-site')} className="h-auto min-h-10 justify-center px-2">
                         <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", documentOption !== 'on-site' && 'opacity-0')}/>
                         <span className="text-center">{t.showOnSite}</span>
                    </Button>
                 </div>
                 {documentOption === 'upload' && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                         <FileUploadInput id="idFront" label={t.idFront} onFileSelect={(file) => handleFileUpload('idFront', file)} upload={uploads.idFront} onRemove={() => removeUpload('idFront')} required lang={lang}/>
                         <FileUploadInput id="idBack" label={t.idBack} onFileSelect={(file) => handleFileUpload('idBack', file)} upload={uploads.idBack} onRemove={() => removeUpload('idBack')} required lang={lang}/>
                    </div>
                 )}
            </div>

            <div>
                <h3 className="font-semibold">{t.notesTitle}</h3>
                <Textarea name="notes" placeholder={t.notesPlaceholder} value={formData.notes || ''} onChange={handleInputChange}/>
            </div>
        </div>
    );
};

const Step2Companions = ({ companions, documentOption, maxCompanions, lang, handleCompanionChange }: {
    companions: Companion[];
    documentOption: 'upload' | 'on-site';
    maxCompanions: number;
    lang: GuestLanguage;
    handleCompanionChange: (index: number, field: keyof Companion, value: string) => void;
}) => {
    const t = translations[lang].step2;
    
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">
                    {maxCompanions > 0 ? t.description(maxCompanions) : t.noCompanions}
                </p>
            </div>
            
            {companions.map((companion, index) => (
                <Card key={index} className="relative bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                         <h4 className="font-medium flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> {t.companion} {index + 1}</h4>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor={`c-firstName-${index}`}>{t.firstName}</Label>
                            <Input id={`c-firstName-${index}`} value={companion.firstName} onChange={(e) => handleCompanionChange(index, 'firstName', e.target.value)} required />
                        </div>
                         <div className="grid gap-1.5">
                            <Label htmlFor={`c-lastName-${index}`}>{t.lastName}</Label>
                            <Input id={`c-lastName-${index}`} value={companion.lastName} onChange={(e) => handleCompanionChange(index, 'lastName', e.target.value)} required />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                             <Label htmlFor={`c-dob-${index}`}>{t.dob}</Label>
                             <Input 
                                id={`c-dob-${index}`} 
                                value={companion.dateOfBirth || ''} 
                                onChange={(e) => handleCompanionChange(index, 'dateOfBirth', e.target.value)} 
                                required 
                                placeholder={t.selectDob} 
                                type="tel"
                             />
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{t.docInfoTitle}</AlertTitle>
                <AlertDescription>
                    {documentOption === 'upload' ? t.docInfoUpload : t.docInfoOnSite}
                </AlertDescription>
            </Alert>
        </div>
    );
};

const Step3PaymentOption = ({ prefillData, paymentOption, setPaymentOption, lang }: {
    prefillData: BookingLink['prefill'] | null;
    paymentOption: 'deposit' | 'full';
    setPaymentOption: (option: 'deposit' | 'full') => void;
    lang: GuestLanguage;
}) => {
    const t = translations[lang].step3;
    const totalPrice = prefillData?.priceTotal || 0;
    const depositPrice = totalPrice * 0.3;
    const selectedAmount = paymentOption === 'deposit' ? depositPrice : totalPrice;

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">{t.title}</h3>
            </div>
            <div>
                <h4 className="font-semibold">{t.selectOption}</h4>
                <p className="text-sm text-muted-foreground">{t.totalPriceIs(totalPrice.toFixed(2))}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button
                    type="button"
                    className={cn(
                        "p-6 text-center border rounded-lg transition-all",
                        paymentOption === 'deposit' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                    onClick={() => setPaymentOption('deposit')}
                >
                    <p className="font-medium">{t.deposit}</p>
                    <p className="text-xl font-bold text-primary">{depositPrice.toFixed(2)} €</p>
                </button>
                 <button
                    type="button"
                    className={cn(
                        "p-6 text-center border rounded-lg transition-all",
                        paymentOption === 'full' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                    onClick={() => setPaymentOption('full')}
                >
                    <p className="font-medium">{t.fullAmount}</p>
                    <p className="text-xl font-bold text-primary">{totalPrice.toFixed(2)} €</p>
                </button>
            </div>
            <div>
                <Label>{t.amountToPay}</Label>
                <div className="mt-2 p-3 bg-muted rounded-md font-semibold text-lg">
                    {selectedAmount.toFixed(2)} €
                </div>
            </div>
        </div>
    );
};

const Step4PaymentDetails = ({ prefillData, paymentOption, uploads, handleFileUpload, removeUpload, hotelDetails, lang }: {
    prefillData: BookingLink['prefill'] | null;
    paymentOption: 'deposit' | 'full';
    uploads: Record<string, FileUpload>;
    handleFileUpload: (name: string, file: File) => void;
    removeUpload: (name: string) => void;
    hotelDetails: Hotel | null;
    lang: GuestLanguage;
}) => {
    const { toast } = useToast();
    const t = translations[lang].step4;
    const totalPrice = prefillData?.priceTotal || 0;
    const depositPrice = totalPrice * 0.3;
    const toPay = paymentOption === 'deposit' ? depositPrice : totalPrice;
    const restAmount = paymentOption === 'deposit' ? totalPrice - depositPrice : 0;
    const bookingIdShort = prefillData?.bookingId.substring(0, 8).toUpperCase();
    const paymentPurpose = `${paymentOption === 'deposit' ? t.selectionDeposit : t.selectionFull} ${bookingIdShort}`;

    const copyToClipboard = useCallback((text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: translations[lang].toasts.submitSuccessTitle, description: t.copySuccess(label) });
    }, [toast, lang, t]);

    if (!hotelDetails) {
        return <div className='text-center'><Loader2 className='w-6 h-6 animate-spin mx-auto' /><p className='mt-2'>{t.loadingBankDetails}</p></div>
    }
    
    const bankDetails = {
        [t.accountHolder]: hotelDetails?.bankAccountHolder,
        [t.iban]: hotelDetails?.bankIBAN,
        [t.bic]: hotelDetails?.bankBIC,
        [t.bank]: hotelDetails?.bankName
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Banknote className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">{t.title}</h3>
            </div>
            <div>
                <h4 className="font-semibold">{t.info}</h4>
                <p className="text-sm text-muted-foreground">{t.description}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">{t.totalPrice}</span><span className="font-medium">{totalPrice.toFixed(2)} €</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t.yourSelection}</span><span className="font-medium">{paymentOption === 'deposit' ? t.selectionDeposit : t.selectionFull}</span></div>
                <Separator/>
                <div className="flex justify-between items-center text-base"><span className="text-muted-foreground">{t.toPayNow}</span><span className="font-bold text-primary text-lg">{toPay.toFixed(2)} €</span></div>
                {paymentOption === 'deposit' && <div className="flex justify-between text-xs pt-1"><span className="text-muted-foreground">{t.restOnArrival}</span><span className="font-medium">{restAmount.toFixed(2)} €</span></div>}
            </div>

            <div>
                <h4 className="font-semibold text-sm mb-2">{t.bankTransferTo}</h4>
                <div className="rounded-md border divide-y">
                    {Object.entries(bankDetails).map(([label, value]) => (
                         value && <div key={label} className="p-3 flex justify-between items-center text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="font-medium">{value}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => copyToClipboard(value, label)}><Copy className="w-4 h-4"/></Button>
                         </div>
                    ))}
                    <div className="p-3 flex justify-between items-center text-sm bg-muted/30">
                        <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3"/>{t.paymentPurpose}</p>
                            <p className="font-medium">{paymentPurpose}</p>
                            <p className="text-xs text-muted-foreground">{t.paymentPurposeHint}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => copyToClipboard(paymentPurpose, t.paymentPurpose)}><Copy className="w-4 h-4"/></Button>
                    </div>
                </div>
            </div>

            <div>
                 <FileUploadInput id="paymentProof" label={t.paymentProof} onFileSelect={(file) => handleFileUpload('paymentProof', file)} upload={uploads.paymentProof} onRemove={() => removeUpload('paymentProof')} required lang={lang}/>
            </div>
            
            <div className="p-4 rounded-md border border-dashed flex items-start gap-4">
                <CreditCard className="w-8 h-8 text-muted-foreground mt-1"/>
                <div>
                     <h4 className="font-semibold">{t.creditCard}</h4>
                     <p className="text-sm text-muted-foreground">{t.creditCardNotAvailable}</p>
                </div>
            </div>
        </div>
    );
};

const ReviewItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => (
    <div className="flex justify-between py-2 border-b border-dashed">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-right break-all">{value || 'N/A'}</p>
    </div>
);

const Step5Review = ({ formData, companions, documentOption, paymentOption, prefillData, lang }: {
    formData: any;
    companions: Companion[];
    documentOption: string;
    paymentOption: string;
    prefillData: BookingLink['prefill'] | null;
    lang: GuestLanguage;
}) => {
    const t = translations[lang].step5;
    const totalPrice = prefillData?.priceTotal || 0;
    const depositPrice = totalPrice * 0.3;
    const toPay = paymentOption === 'deposit' ? depositPrice : totalPrice;
    const restAmount = paymentOption === 'deposit' ? totalPrice - depositPrice : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Check className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">{t.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t.description}</p>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4 text-primary"/>{t.mainGuest}</h4>
                <Separator/>
                <ReviewItem label={t.firstName} value={formData.firstName} />
                <ReviewItem label={t.lastName} value={formData.lastName} />
                <ReviewItem label={t.email} value={formData.email} />
                <ReviewItem label={t.phone} value={formData.phone} />
                <ReviewItem label={t.documents} value={documentOption === 'upload' ? t.uploaded : t.showOnSite} />
            </div>

            {companions.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary"/>{t.companions}</h4>
                     <Separator/>
                    {companions.map((c, i) => (
                        <ReviewItem key={i} label={`${t.person} ${i+2}`} value={`${c.firstName} ${c.lastName}`} />
                    ))}
                </div>
            )}

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2"><Banknote className="w-4 h-4 text-primary"/>{t.paymentInfo}</h4>
                <Separator/>
                <ReviewItem label={t.totalPrice} value={`${totalPrice.toFixed(2)} €`} />
                <ReviewItem label={t.selectedOption} value={paymentOption === 'deposit' ? t.optionDeposit : t.optionFull} />
                <ReviewItem label={t.paidAmount} value={`${toPay.toFixed(2)} €`} />
                {paymentOption === 'deposit' && <ReviewItem label={t.restOnArrival} value={`${restAmount.toFixed(2)} €`} />}
                <ReviewItem label={t.paymentMethod} value={t.bankTransfer} />
                <ReviewItem label={t.paymentProof} value={t.uploaded} />
            </div>

             <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.terms }} />
             </div>
        </div>
    );
};


export function BookingForm({ prefillData, linkId, hotelId, initialGuestData }: { prefillData?: BookingLink['prefill'] & {guestLanguage?: GuestLanguage} | null, linkId?: string, hotelId?: string, initialGuestData: {firstName?: string; lastName?: string, email?: string} }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
      firstName: initialGuestData.firstName || '',
      lastName: initialGuestData.lastName || '',
      email: initialGuestData.email || '',
  });
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [uploads, setUploads] = useState<Record<string, FileUpload>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentOption, setDocumentOption] = useState<'upload' | 'on-site'>('upload');
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [hotelDetails, setHotelDetails] = useState<Hotel | null>(null);
  const lang = useMemo(() => prefillData?.guestLanguage || 'de', [prefillData]);
  const t = translations[lang];

  const router = useRouter();
  const { toast } = useToast();

  const maxCompanions = useMemo(() => {
    if (!prefillData?.rooms) return 0;
    const totalPeople = prefillData.rooms.reduce((sum, room) => sum + room.adults + room.children, 0);
    return Math.max(0, totalPeople - 1);
  }, [prefillData]);

  useEffect(() => {
    if (hotelId) {
        getHotelById(hotelId).then(result => {
            if (result.hotel) {
                setHotelDetails(result.hotel);
            }
        })
    }
  }, [hotelId]);
  
  useEffect(() => {
      if (companions.length === 0 && maxCompanions > 0) {
          const initialCompanions = Array.from({ length: maxCompanions }, () => ({
              firstName: '',
              lastName: '',
              dateOfBirth: '',
          }));
          setCompanions(initialCompanions as any);
      }
  }, [prefillData, maxCompanions, companions.length]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleCompanionChange = useCallback((index: number, field: keyof Companion, value: string) => {
        setCompanions(prev => {
            const newCompanions = [...prev];
            const companionToUpdate = { ...newCompanions[index] };
            (companionToUpdate as any)[field] = value;
            newCompanions[index] = companionToUpdate;
            return newCompanions;
        });
    }, []);

  const handleFileUpload = useCallback((name: string, file: File) => {
    const t_file = translations[lang].step1;
    if (file.size > 5 * 1024 * 1024) { 
      setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name, error: t_file.fileTooLarge } }));
      return;
    }
     if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
      setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name, error: t_file.invalidFileType } }));
      return;
    }
    setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name } }));
  }, [lang]);

  const removeUpload = useCallback((name: string) => {
    const upload = uploads[name];
    if (upload && upload.url) {
       const fileRef = ref(storage, upload.url);
       deleteObject(fileRef).catch((error) => {
          console.error("Error removing file from storage:", error);
       });
    }
    setUploads(prev => {
        const newUploads = {...prev};
        delete newUploads[name];
        return newUploads;
    });
  }, [uploads]);

  const validateStep = (step: number) => {
      const t_toast = translations[lang].toasts;
      if (step === 0) {
        const { firstName, lastName, email, phone } = formData;
        if (!firstName || !lastName || !email || !phone) {
            toast({variant: 'destructive', title: 'Fehlende Angaben', description: t_toast.missingFields});
            return false;
        }
        if (documentOption === 'upload' && (!uploads.idFront || !uploads.idBack)) {
            toast({variant: 'destructive', title: 'Fehlende Dokumente', description: t_toast.missingDocs});
            return false;
        }
        if (uploads.idFront?.error || uploads.idBack?.error) {
             toast({variant: 'destructive', title: 'Fehlerhafte Dateien', description: t_toast.fileErrors});
             return false;
        }
      }
      if (step === 1) {
          if (companions.length > 0) {
            for(const c of companions) {
                if(!c.firstName || !c.lastName || !c.dateOfBirth) {
                    toast({variant: 'destructive', title: 'Fehlende Angaben', description: t_toast.companionFieldsError});
                    return false;
                }
            }
          }
      }
      if (step === 3) {
        if (!uploads.paymentProof) {
            toast({variant: 'destructive', title: 'Fehlender Nachweis', description: t_toast.missingProof});
            return false;
        }
         if (uploads.paymentProof?.error) {
             toast({variant: 'destructive', title: 'Fehlerhafter Nachweis', description: t_toast.proofError});
             return false;
        }
      }
      return true;
  }

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, t.steps.length - 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const uploadFile = (upload: FileUpload): Promise<{name: string, url: string}> => {
        return new Promise((resolve, reject) => {
            if (!hotelId || !linkId || !prefillData?.bookingId) return reject("Missing IDs");
            const filePath = `hotels/${hotelId}/bookings/${prefillData.bookingId}/public/${linkId}/${upload.name}-${upload.file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, upload.file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploads(prev => ({...prev, [upload.name]: { ...upload, progress }}));
                }, 
                (error) => {
                    setUploads(prev => ({...prev, [upload.name]: { ...upload, error: translations[lang].step1.uploadFailed }}));
                    reject(error)
                }, 
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        setUploads(prev => ({...prev, [upload.name]: { ...upload, url: downloadURL, progress: 100 }}));
                        resolve({ name: upload.name, url: downloadURL });
                    });
                }
            );
        });
    };

  const handleConfirmBooking = async () => {
    if (!linkId || !hotelId || !prefillData?.bookingId) {
        toast({ variant: "destructive", title: t.toasts.submitErrorTitle, description: "Booking info missing."});
        return;
    }
    setIsSubmitting(true);

    try {
        let uploadedFileMap: Record<string, string> = {};

        const filesToUpload = Object.values(uploads).filter(u => u.file && !u.url && !u.error);
        if (filesToUpload.length > 0) {
            const uploadPromises = filesToUpload.map(upload => uploadFile(upload));
            const uploadedFiles = await Promise.all(uploadPromises);
            
            uploadedFiles.forEach(file => {
                uploadedFileMap[file.name] = file.url;
            });
        }
        Object.values(uploads).forEach(u => {
            if (u.url) uploadedFileMap[u.name] = u.url;
        });

        const batch = writeBatch(db);
        const bookingDocRef = doc(db, `hotels/${hotelId}/bookings`, prefillData.bookingId);
        
        const updateData: any = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            age: formData.age || null,
            guestNotes: formData.notes || '',
            status: paymentOption === 'deposit' ? 'Partial Payment' : 'Confirmed',
            submittedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            documents: {
                idFront: documentOption === 'upload' ? (uploadedFileMap.idFront || null) : null,
                idBack: documentOption === 'upload' ? (uploadedFileMap.idBack || null) : null,
                paymentProof: uploadedFileMap.paymentProof || null,
                submissionMethod: documentOption
            },
            companions: companions
        };
        batch.update(bookingDocRef, updateData);

        const linkDocRef = doc(db, `hotels/${hotelId}/bookingLinks`, linkId);
        batch.update(linkDocRef, { status: 'used' });
        
        await batch.commit();
        
        try {
            const emailResult = await generateConfirmationEmail({ hotelId, bookingId: prefillData.bookingId });
            await sendEmail({
                hotelId: hotelId,
                to: formData.email,
                subject: emailResult.subject,
                html: emailResult.body,
            });
            toast({ title: t.toasts.emailSuccess, description: t.toasts.emailSuccessDesc });
        } catch (emailError) {
             console.error("Could not send confirmation email:", emailError);
             toast({ variant: "destructive", title: "E-Mail Fehler", description: t.toasts.emailError });
        }

        toast({ title: t.toasts.submitSuccessTitle, description: t.toasts.submitSuccessDesc});
        router.push(`/guest/${linkId}/thank-you`);

    } catch (error) {
        const err = error as Error;
        console.error("Booking confirmation error:", err);
        toast({ variant: "destructive", title: t.toasts.submitErrorTitle, description: err.message || t.toasts.submitErrorDesc});
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderStep = () => {
    switch(currentStep) {
        case 0:
            return <Step1GuestInfo 
                        formData={formData} 
                        handleInputChange={handleInputChange} 
                        prefillData={prefillData}
                        uploads={uploads}
                        handleFileUpload={handleFileUpload}
                        removeUpload={removeUpload}
                        documentOption={documentOption}
                        setDocumentOption={setDocumentOption}
                        lang={lang}
                    />;
        case 1:
            return <Step2Companions
                        companions={companions}
                        documentOption={documentOption}
                        maxCompanions={maxCompanions}
                        lang={lang}
                        handleCompanionChange={handleCompanionChange}
                    />;
        case 2:
            return <Step3PaymentOption
                        prefillData={prefillData}
                        paymentOption={paymentOption}
                        setPaymentOption={setPaymentOption}
                        lang={lang}
                    />;
        case 3:
            return <Step4PaymentDetails
                        prefillData={prefillData}
                        paymentOption={paymentOption}
                        uploads={uploads}
                        handleFileUpload={handleFileUpload}
                        removeUpload={removeUpload}
                        hotelDetails={hotelDetails}
                        lang={lang}
                    />;
        case 4:
            return <Step5Review 
                        formData={formData}
                        companions={companions}
                        documentOption={documentOption}
                        paymentOption={paymentOption}
                        prefillData={prefillData}
                        lang={lang}
                   />;
        default:
            return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl shadow-lg">
      <CardHeader>
        <p className="text-xs text-muted-foreground text-center font-medium">{`Schritt ${currentStep + 1} ${t.stepOf} ${t.steps.length}: ${t.steps[currentStep]}`}</p>
        <div className="pt-4">
          <StepIndicator steps={t.steps} currentStep={currentStep} />
        </div>
      </CardHeader>
      <CardContent className="min-h-[300px] p-4 sm:p-6">
        {renderStep()}
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <Button variant="outline" type="button" onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>
          {t.buttons.back}
        </Button>
        {currentStep < t.steps.length - 1 ? (
          <Button type="button" onClick={nextStep} disabled={isSubmitting}>{t.buttons.next}</Button>
        ) : (
          <Button type="button" onClick={handleConfirmBooking} disabled={isSubmitting || Object.values(uploads).some(u => u.progress > 0 && u.progress < 100)} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span>{t.buttons.submitting}</span></> : t.buttons.submit}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
