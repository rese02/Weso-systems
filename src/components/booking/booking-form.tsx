'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './step-indicator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, UploadCloud, Loader2, Info, User, Mail, Phone, Calendar as CalendarLucideIcon, File, Check, Paperclip, Trash2, Users, PlusCircle, ListChecks, Banknote, Copy, CreditCard } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import type { BookingLink } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import { storage } from '@/lib/firebase.client';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Timestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Calendar } from '../ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { generateConfirmationEmail } from '@/ai/flows/generate-confirmation-email';


const steps = ['Gast', 'Begleitung', 'Zahl-Option', 'Zahl-Details', 'Prüfung'];

type Companion = {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
}

type FileUpload = {
    file: File;
    progress: number;
    url?: string;
    name: string; // e.g. 'idFront', 'idBack'
    error?: string;
}

const BookingOverview = ({ prefillData }: { prefillData?: BookingLink['prefill'] | null }) => {
    if (!prefillData) return null;

    return (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3 mb-6">
            <h3 className="font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Ihre Buchungsübersicht</h3>
            <div className="text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Zeitraum:</span>
                    <span className="font-medium">{prefillData?.checkIn && prefillData?.checkOut ? `${format(parseISO(prefillData.checkIn), 'dd.MM.yyyy')} - ${format(parseISO(prefillData.checkOut), 'dd.MM.yyyy')}` : 'N/A'}</span>
                </div>
                 {prefillData.rooms.map((room, index) => (
                    <div className="flex justify-between" key={index}>
                         <span className="text-muted-foreground">Zimmer {index + 1}:</span>
                         <span className="font-medium">{room.roomType} ({room.adults} Erw., {room.children} Ki.)</span>
                    </div>
                ))}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Verpflegung:</span>
                    <span className="font-medium">{prefillData?.boardType}</span>
                </div>
                <Separator/>
                <div className="flex justify-between font-bold">
                    <span className="text-muted-foreground">Gesamtpreis:</span>
                    <span>{prefillData?.priceTotal?.toFixed(2)} €</span>
                </div>
            </div>
        </div>
    )
}

const FileUploadInput = ({ id, label, onFileSelect, upload, onRemove, required }: { id: string, label: string, onFileSelect: (file: File) => void, upload?: FileUpload, onRemove: () => void, required?: boolean }) => {

    if (upload && !upload.error) {
        return (
             <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                     <Paperclip className="h-4 w-4" />
                     <span className="truncate max-w-xs">{upload.file.name}</span>
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
                    <span className="text-primary font-medium">Datei auswählen</span>
                    <Input id={id} type="file" className="sr-only" onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} accept="image/png, image/jpeg, application/pdf" />
                </label>
            </div>
            {upload?.error && <p className="text-destructive text-xs mt-1">{upload.error}</p>}
             <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 5MB).</p>
        </div>
    );
};

const Step1GuestInfo = ({ formData, handleInputChange, prefillData, uploads, handleFileUpload, removeUpload, documentOption, setDocumentOption }: {
    formData: any;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    prefillData?: BookingLink['prefill'] | null;
    uploads: Record<string, FileUpload>;
    handleFileUpload: (name: string, file: File) => void;
    removeUpload: (name: string) => void;
    documentOption: 'upload' | 'on-site';
    setDocumentOption: (option: 'upload' | 'on-site') => void;
}) => (
    <div className="space-y-6">
        <BookingOverview prefillData={prefillData} />

        <div>
            <h3 className="font-semibold">Ihre Daten (Hauptbucher)</h3>
            <p className="text-sm text-muted-foreground">Bitte füllen Sie die folgenden Felder aus.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5"><Label htmlFor="firstName" className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/>Vorname *</Label><Input id="firstName" name="firstName" placeholder="Max" required value={formData.firstName || ''} onChange={handleInputChange} /></div>
                <div className="grid gap-1.5"><Label htmlFor="lastName" className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/>Nachname *</Label><Input id="lastName" name="lastName" placeholder="Mustermann" required value={formData.lastName || ''} onChange={handleInputChange}/></div>
                <div className="grid gap-1.5"><Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/>E-Mail *</Label><Input id="email" name="email" type="email" placeholder="max@example.com" required value={formData.email || ''} onChange={handleInputChange}/></div>
                <div className="grid gap-1.5"><Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/>Telefon *</Label><Input id="phone" name="phone" type="tel" placeholder="Ihre Telefonnummer" required value={formData.phone || ''} onChange={handleInputChange}/></div>
                <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="age" className="flex items-center gap-2"><CalendarLucideIcon className="w-4 h-4 text-muted-foreground"/>Alter (optional, mind. 18)</Label><Input id="age" name="age" type="number" placeholder="z.B. 30" value={formData.age || ''} onChange={handleInputChange}/></div>
            </div>
        </div>

        <div>
             <h3 className="font-semibold">Ausweisdokumente *</h3>
             <p className="text-sm text-muted-foreground">Bitte wählen Sie, wie Sie die Ausweisdokumente bereitstellen möchten.</p>
             <div className="mt-4 grid grid-cols-2 gap-2">
                <Button type="button" variant={documentOption === 'upload' ? 'default' : 'outline'} onClick={() => setDocumentOption('upload')}><Check className={cn("mr-2 h-4 w-4", documentOption !== 'upload' && 'opacity-0')}/></Button>
                <Button type="button" variant={documentOption === 'on-site' ? 'default' : 'outline'} onClick={() => setDocumentOption('on-site')}><Check className={cn("mr-2 h-4 w-4", documentOption !== 'on-site' && 'opacity-0')}/></Button>
             </div>
             {documentOption === 'upload' && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                     <FileUploadInput id="idFront" label="Ausweisdokument (Vorderseite)" onFileSelect={(file) => handleFileUpload('idFront', file)} upload={uploads.idFront} onRemove={() => removeUpload('idFront')} required/>
                     <FileUploadInput id="idBack" label="Ausweisdokument (Rückseite)" onFileSelect={(file) => handleFileUpload('idBack', file)} upload={uploads.idBack} onRemove={() => removeUpload('idBack')} required/>
                </div>
             )}
        </div>

        <div>
            <h3 className="font-semibold">Ihre Anmerkungen (optional)</h3>
            <Textarea name="notes" placeholder="Ihre Anmerkungen..." value={formData.notes || ''} onChange={handleInputChange}/>
        </div>
    </div>
);


const Step2Companions = ({ companions, setCompanions, documentOption, maxCompanions }: {
    companions: Companion[];
    setCompanions: React.Dispatch<React.SetStateAction<Companion[]>>;
    documentOption: 'upload' | 'on-site';
    maxCompanions: number;
}) => {
    
    const addCompanion = () => {
        if (companions.length >= maxCompanions) return;
        setCompanions([...companions, { firstName: '', lastName: '' }]);
    };

    const removeCompanion = (index: number) => {
        setCompanions(companions.filter((_, i) => i !== index));
    };

    const handleCompanionChange = (index: number, field: keyof Companion, value: string | Date) => {
        const newCompanions = [...companions];
        (newCompanions[index] as any)[field] = value;
        setCompanions(newCompanions);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold">Begleitpersonen</h3>
                <p className="text-sm text-muted-foreground">Fügen Sie hier die Daten Ihrer Mitreisenden hinzu. Es sind {maxCompanions} Begleitperson(en) vorgesehen.</p>
            </div>

            {companions.map((companion, index) => (
                <Card key={index} className="relative bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                         <h4 className="font-medium flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Mitreisender {index + 1}</h4>
                         <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCompanion(index)}><Trash2 className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor={`c-firstName-${index}`}>Vorname *</Label>
                            <Input id={`c-firstName-${index}`} placeholder="Erika" value={companion.firstName} onChange={(e) => handleCompanionChange(index, 'firstName', e.target.value)} required />
                        </div>
                         <div className="grid gap-1.5">
                            <Label htmlFor={`c-lastName-${index}`}>Nachname *</Label>
                            <Input id={`c-lastName-${index}`} placeholder="Mustermann" value={companion.lastName} onChange={(e) => handleCompanionChange(index, 'lastName', e.target.value)} required />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                             <Label htmlFor={`c-dob-${index}`}>Geburtsdatum *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !companion.dateOfBirth && "text-muted-foreground")}>
                                        <CalendarLucideIcon className="mr-2 h-4 w-4" />
                                        {companion.dateOfBirth ? format(companion.dateOfBirth, "dd.MM.yyyy") : <span>Geburtsdatum auswählen</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={companion.dateOfBirth} onSelect={(date) => handleCompanionChange(index, 'dateOfBirth', date as Date)} initialFocus captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {companions.length < maxCompanions && (
                <Button type="button" variant="outline" className="w-full" onClick={addCompanion}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Weiteren Mitreisenden hinzufügen
                </Button>
            )}

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Hinweis zu Dokumenten</AlertTitle>
                <AlertDescription>
                    {documentOption === 'upload' 
                        ? "Für Mitreisende sind keine Ausweis-Uploads erforderlich. Der Ausweis des Hauptbuchers ist ausreichend."
                        : "Bitte bringen Sie für alle Mitreisenden gültige Ausweisdokumente für den Check-in vor Ort mit."
                    }
                </AlertDescription>
            </Alert>
        </div>
    );
};

const Step3PaymentOption = ({ prefillData, paymentOption, setPaymentOption }: {
    prefillData: BookingLink['prefill'] | null;
    paymentOption: 'deposit' | 'full';
    setPaymentOption: (option: 'deposit' | 'full') => void;
}) => {
    const totalPrice = prefillData?.priceTotal || 0;
    const depositPrice = totalPrice * 0.3;
    const selectedAmount = paymentOption === 'deposit' ? depositPrice : totalPrice;

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-2">
                <ListChecks className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">Zahl-Option</h3>
            </div>
            <div>
                <h4 className="font-semibold">Wählen Sie Ihre Zahlungsoption *</h4>
                <p className="text-sm text-muted-foreground">Der Gesamtpreis dieser Buchung beträgt: {totalPrice.toFixed(2)} €.</p>
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
                    <ListChecks className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Anzahlung (30%)</p>
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
                    <ListChecks className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Gesamtbetrag (100%)</p>
                    <p className="text-xl font-bold text-primary">{totalPrice.toFixed(2)} €</p>
                </button>
            </div>
            <div>
                <Label>Gewählter Betrag zur Überweisung:</Label>
                <div className="mt-2 p-3 bg-muted rounded-md font-semibold text-lg">
                    {selectedAmount.toFixed(2)} €
                </div>
            </div>
        </div>
    );
};

const Step4PaymentDetails = ({ prefillData, paymentOption, uploads, handleFileUpload, removeUpload }: {
    prefillData: BookingLink['prefill'] | null;
    paymentOption: 'deposit' | 'full';
    uploads: Record<string, FileUpload>;
    handleFileUpload: (name: string, file: File) => void;
    removeUpload: (name: string) => void;
}) => {
    const { toast } = useToast();
    const totalPrice = prefillData?.priceTotal || 0;
    const depositPrice = totalPrice * 0.3;
    const toPay = paymentOption === 'deposit' ? depositPrice : totalPrice;
    const restAmount = paymentOption === 'deposit' ? totalPrice - depositPrice : 0;
    const bookingIdShort = prefillData?.bookingId.substring(0, 8).toUpperCase();
    const paymentPurpose = `Buchung ${bookingIdShort} - ${paymentOption === 'deposit' ? 'Anzahlung' : 'Gesamtbetrag'}`;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Kopiert!", description: `${label} wurde in die Zwischenablage kopiert.` });
    };

    const bankDetails = {
        'Kontoinhaber': 'Pradell GMBH',
        'IBAN': 'IT51X0805623120000302071631',
        'BIC/SWIFT': 'RZSBIT21211',
        'Bank': 'Raiffeisenkasse Kastelruth - St. Ulrich'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Banknote className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">Zahl-Details</h3>
            </div>
            <div>
                <h4 className="font-semibold">Zahlungsinformationen &amp; Nachweis *</h4>
                <p className="text-sm text-muted-foreground">Bitte überweisen Sie den gewählten Betrag und laden Sie anschließend einen Nachweis hoch.</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Gesamtpreis:</span><span className="font-medium">{totalPrice.toFixed(2)} €</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ihre Auswahl:</span><span className="font-medium">{paymentOption === 'deposit' ? 'Anzahlung (30%)' : 'Gesamtbetrag (100%)'}</span></div>
                <Separator/>
                <div className="flex justify-between items-center text-base"><span className="text-muted-foreground">Jetzt zu überweisen:</span><span className="font-bold text-primary text-lg">{toPay.toFixed(2)} €</span></div>
                {paymentOption === 'deposit' && <div className="flex justify-between text-xs pt-1"><span className="text-muted-foreground">Restbetrag bei Anreise im Hotel:</span><span className="font-medium">{restAmount.toFixed(2)} €</span></div>}
            </div>

            <div>
                <h4 className="font-semibold text-sm mb-2">Banküberweisung an:</h4>
                <div className="rounded-md border divide-y">
                    {Object.entries(bankDetails).map(([label, value]) => (
                         <div key={label} className="p-3 flex justify-between items-center text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="font-medium">{value}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => copyToClipboard(value, label)}><Copy className="w-4 h-4"/></Button>
                         </div>
                    ))}
                    <div className="p-3 flex justify-between items-center text-sm bg-muted/30">
                        <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3"/>Verwendungszweck</p>
                            <p className="font-medium">{paymentPurpose}</p>
                            <p className="text-xs text-muted-foreground">Bitte geben Sie dies bei Ihrer Überweisung an.</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => copyToClipboard(paymentPurpose, 'Verwendungszweck')}><Copy className="w-4 h-4"/></Button>
                    </div>
                </div>
            </div>

            <div>
                 <FileUploadInput id="paymentProof" label="Zahlungsnachweis hochladen *" onFileSelect={(file) => handleFileUpload('paymentProof', file)} upload={uploads.paymentProof} onRemove={() => removeUpload('paymentProof')} required/>
            </div>
            
            <div className="p-4 rounded-md border border-dashed flex items-start gap-4">
                <CreditCard className="w-8 h-8 text-muted-foreground mt-1"/>
                <div>
                     <h4 className="font-semibold">Kreditkarte</h4>
                     <p className="text-sm text-muted-foreground">Zahlung per Kreditkarte ist derzeit nicht verfügbar.</p>
                </div>
            </div>
        </div>
    );
};

const ReviewItem = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div className="flex justify-between py-2 border-b border-dashed">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || 'N/A'}</p>
    </div>
);

const Step5Review = ({ formData, companions, documentOption, paymentOption, prefillData }: {
    formData: any;
    companions: Companion[];
    documentOption: string;
    paymentOption: string;
    prefillData: BookingLink['prefill'] | null;
}) => {
    const totalPrice = prefillData?.priceTotal || 0;
    const depositPrice = totalPrice * 0.3;
    const toPay = paymentOption === 'deposit' ? depositPrice : totalPrice;
    const restAmount = paymentOption === 'deposit' ? totalPrice - depositPrice : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Check className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">Prüfung</h3>
            </div>
            <p className="text-sm text-muted-foreground">Bitte überprüfen Sie alle eingegebenen Informationen sorgfältig, bevor Sie die Daten endgültig absenden.</p>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4 text-primary"/>Ihre Daten (Hauptgast)</h4>
                <Separator/>
                <ReviewItem label="Vorname" value={formData.firstName} />
                <ReviewItem label="Nachname" value={formData.lastName} />
                <ReviewItem label="E-Mail" value={formData.email} />
                <ReviewItem label="Telefon" value={formData.phone} />
                <ReviewItem label="Ausweisdokumente" value={documentOption === 'upload' ? 'Hochgeladen' : 'Vor Ort vorzeigen'} />
            </div>

            {companions.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary"/>Begleitpersonen</h4>
                     <Separator/>
                    {companions.map((c, i) => (
                        <ReviewItem key={i} label={`Person ${i+2}`} value={`${c.firstName} ${c.lastName}`} />
                    ))}
                </div>
            )}

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2"><Banknote className="w-4 h-4 text-primary"/>Zahlungsinformationen</h4>
                <Separator/>
                <ReviewItem label="Gesamtpreis" value={`${totalPrice.toFixed(2)} €`} />
                <ReviewItem label="Gewählte Option" value={paymentOption === 'deposit' ? 'Anzahlung (30%)' : 'Gesamtbetrag (100%)'} />
                <ReviewItem label="Überwiesener Betrag" value={`${toPay.toFixed(2)} €`} />
                {paymentOption === 'deposit' && <ReviewItem label="Restbetrag bei Anreise" value={`${restAmount.toFixed(2)} €`} />}
                <ReviewItem label="Zahlungsart" value="Banküberweisung" />
                <ReviewItem label="Zahlungsbeleg" value="Hochgeladen" />
            </div>

             <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                    Indem Sie auf 'Daten absenden' klicken, bestätigen Sie, dass Sie die <a href="#" className="underline">Datenschutzbestimmungen</a> und die <a href="#" className="underline">AGB</a> gelesen haben und diesen zustimmen.
                </p>
             </div>
        </div>
    );
};


export function BookingForm({ prefillData, linkId, hotelId, initialGuestData }: { prefillData?: BookingLink['prefill'] | null, linkId?: string, hotelId?: string, initialGuestData: {firstName?: string; lastName?: string, email?: string} }) {
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

  const router = useRouter();
  const { toast } = useToast();
  
  const maxCompanions = useMemo(() => {
    if (!prefillData?.rooms) return 0;
    // Sum of all adults and children, minus 1 (the main guest)
    const totalPeople = prefillData.rooms.reduce((sum, room) => sum + room.adults + room.children, 0);
    return Math.max(0, totalPeople - 1);
  }, [prefillData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (name: string, file: File) => {
    // Basic validation
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name, error: 'Datei ist zu groß (max. 5MB).' } }));
      return;
    }
     if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
      setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name, error: 'Ungültiger Dateityp (nur JPG, PNG, PDF).' } }));
      return;
    }
    setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name } }));
  };

  const removeUpload = (name: string) => {
    const upload = uploads[name];
    if (upload && upload.url) {
       // Create a reference to the file to delete
       const fileRef = ref(storage, upload.url);
       // Delete the file
       deleteObject(fileRef).catch((error) => {
          console.error("Error removing file from storage:", error);
          toast({variant: 'destructive', title: 'Fehler', description: 'Konnte die Datei nicht aus dem Speicher entfernen.'});
       });
    }
    setUploads(prev => {
        const newUploads = {...prev};
        delete newUploads[name];
        return newUploads;
    });
  };

  const validateStep = (step: number) => {
      if (step === 0) { // Step 1: Guest
        const { firstName, lastName, email, phone } = formData;
        if (!firstName || !lastName || !email || !phone) {
            toast({variant: 'destructive', title: 'Fehlende Angaben', description: 'Bitte füllen Sie alle Pflichtfelder (*) aus.'});
            return false;
        }
        if (documentOption === 'upload' && (!uploads.idFront || !uploads.idBack)) {
            toast({variant: 'destructive', title: 'Fehlende Dokumente', description: 'Bitte laden Sie Vorder- und Rückseite Ihres Ausweises hoch.'});
            return false;
        }
        if (uploads.idFront?.error || uploads.idBack?.error) {
             toast({variant: 'destructive', title: 'Fehlerhafte Dateien', description: 'Bitte korrigieren Sie die Fehler bei den hochgeladenen Dateien.'});
             return false;
        }
      }
      if (step === 1) { // Step 2: Companions
          if(companions.length !== maxCompanions){
              toast({variant: 'destructive', title: 'Anzahl Begleitpersonen', description: `Bitte fügen Sie die Daten für alle ${maxCompanions} Begleitpersonen hinzu.`});
              return false;
          }
          for(const c of companions) {
              if(!c.firstName || !c.lastName || !c.dateOfBirth) {
                  toast({variant: 'destructive', title: 'Fehlende Angaben', description: 'Bitte füllen Sie alle Felder für jeden Mitreisenden aus.'});
                  return false;
              }
          }
      }
      if (step === 3) { // Step 4: Payment Details
        if (!uploads.paymentProof) {
            toast({variant: 'destructive', title: 'Fehlender Nachweis', description: 'Bitte laden Sie einen Zahlungsnachweis hoch.'});
            return false;
        }
         if (uploads.paymentProof?.error) {
             toast({variant: 'destructive', title: 'Fehlerhafter Nachweis', description: 'Bitte korrigieren Sie den Fehler bei der hochgeladenen Datei.'});
             return false;
        }
      }
      return true;
  }

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const uploadFile = (upload: FileUpload): Promise<{name: string, url: string}> => {
        return new Promise((resolve, reject) => {
            if (!hotelId || !linkId || !prefillData?.bookingId) return reject("Fehlende Hotel-, Link- oder Buchungs-ID");
            const filePath = `hotels/${hotelId}/bookings/${prefillData.bookingId}/public/${linkId}/${upload.name}-${upload.file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, upload.file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploads(prev => ({...prev, [upload.name]: { ...upload, progress }}));
                }, 
                (error) => {
                    console.error(`Upload fehlgeschlagen für ${upload.name}:`, error);
                    setUploads(prev => ({...prev, [upload.name]: { ...upload, error: 'Upload fehlgeschlagen.' }}));
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
        toast({ variant: "destructive", title: "Fehler", description: "Buchungsinformationen fehlen. Bitte verwenden Sie einen gültigen Link."});
        return;
    }
    setIsSubmitting(true);

    try {
        let uploadedFileMap: Record<string, string> = {};

        // Only upload files if the user chose that option
        const filesToUpload = Object.values(uploads).filter(u => !u.url); // Only upload new files
        if (filesToUpload.length > 0) {
            const uploadPromises = filesToUpload.map(upload => uploadFile(upload));
            const uploadedFiles = await Promise.all(uploadPromises);
            
            const newFileMap = uploadedFiles.reduce((acc, file) => {
                acc[file.name] = file.url;
                return acc;
            }, {} as Record<string, string>);
             // also include already uploaded files
            Object.values(uploads).forEach(u => {
                if(u.url) newFileMap[u.name] = u.url;
            })
            uploadedFileMap = newFileMap;
        }

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
            documents: {
                idFront: uploadedFileMap.idFront,
                idBack: uploadedFileMap.idBack,
                paymentProof: uploadedFileMap.paymentProof,
                submissionMethod: documentOption
            },
            companions: companions.map(c => ({...c, dateOfBirth: c.dateOfBirth?.toISOString()}))
        };
        batch.update(bookingDocRef, updateData);

        const linkDocRef = doc(db, `hotels/${hotelId}/bookingLinks`, linkId);
        batch.update(linkDocRef, { status: 'used' });
        
        await batch.commit();
        
        // Generate and log the confirmation email, but don't send it.
        try {
            console.log("Generating confirmation email...");
            const emailResult = await generateConfirmationEmail({ hotelId, bookingId: prefillData.bookingId });
            console.log("--- GENERATED EMAIL (for logging) ---");
            console.log("Subject:", emailResult.subject);
            console.log("Body:\n", emailResult.body);
            console.log("-------------------------------------");
        } catch (emailError) {
             console.error("Could not generate confirmation email:", emailError);
             // Don't block the user flow for this, just log it.
        }

        toast({ title: "Buchung übermittelt!", description: "Ihre Buchungsdetails wurden an das Hotel gesendet."});
        router.push(`/guest/${linkId}/thank-you`);

    } catch (error) {
        const err = error as Error;
        console.error("Fehler bei der Buchungsbestätigung:", err);
        toast({ variant: "destructive", title: "Fehler bei der Übermittlung", description: err.message || "Es gab ein Problem bei der Übermittlung Ihrer Buchung. Bitte versuchen Sie es erneut."});
    } finally {
        setIsSubmitting(false);
    }
  }

  const CurrentStepComponent = () => {
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
                    />;
        case 1:
            return <Step2Companions
                        companions={companions}
                        setCompanions={setCompanions}
                        documentOption={documentOption}
                        maxCompanions={maxCompanions}
                    />;
        case 2:
            return <Step3PaymentOption
                        prefillData={prefillData}
                        paymentOption={paymentOption}
                        setPaymentOption={setPaymentOption}
                    />;
        case 3:
            return <Step4PaymentDetails
                        prefillData={prefillData}
                        paymentOption={paymentOption}
                        uploads={uploads}
                        handleFileUpload={handleFileUpload}
                        removeUpload={removeUpload}
                    />;
        case 4:
            return <Step5Review 
                        formData={formData}
                        companions={companions}
                        documentOption={documentOption}
                        paymentOption={paymentOption}
                        prefillData={prefillData}
                   />;
        default:
            return null;
    }
  }

  return (
    <Card className="w-full max-w-3xl shadow-lg">
      <CardHeader>
        <p className="text-sm text-muted-foreground text-center font-medium">Schritt {currentStep + 1} von {steps.length}: {steps[currentStep]}</p>
        <div className="pt-4">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
      </CardHeader>
      <CardContent className="min-h-[300px] p-4 sm:p-6">
        <CurrentStepComponent />
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <Button variant="outline" type="button" onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>
          Zurück
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={nextStep} disabled={isSubmitting}>Speichern &amp; Weiter</Button>
        ) : (
          <Button type="button" onClick={handleConfirmBooking} disabled={isSubmitting || Object.values(uploads).some(u => u.progress > 0 && u.progress < 100)} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span>Wird übermittelt...</span></> : 'Daten absenden'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
