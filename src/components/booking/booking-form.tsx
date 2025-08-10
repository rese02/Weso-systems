
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './step-indicator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, UploadCloud, Loader2 } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import type { BookingLink } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import { storage, db } from '@/lib/firebase.client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Timestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';

const steps = ['Details', 'Gast-Info', 'Bezahlung', 'Bestätigung'];

type FileUpload = {
    file: File;
    progress: number;
    url?: string;
    name: string;
}

const Step1Details = ({ prefillData }: { prefillData?: BookingLink['prefill'] | null }) => {
    return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
            <Label htmlFor="check-in">Check-in Datum</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('justify-start text-left font-normal', !prefillData?.checkIn && 'text-muted-foreground')} disabled>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {prefillData?.checkIn ? format(parseISO(prefillData.checkIn), 'PPP') : <span>Datum wählen</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={prefillData?.checkIn ? parseISO(prefillData.checkIn) : undefined} initialFocus disabled />
                </PopoverContent>
            </Popover>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="check-out">Check-out Datum</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('justify-start text-left font-normal', !prefillData?.checkOut && 'text-muted-foreground')} disabled>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                         {prefillData?.checkOut ? format(parseISO(prefillData.checkOut), 'PPP') : <span>Datum wählen</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={prefillData?.checkOut ? parseISO(prefillData.checkOut) : undefined} initialFocus disabled/>
                </PopoverContent>
            </Popover>
        </div>
        {prefillData?.rooms && prefillData.rooms.map((room, index) => (
             <div key={index} className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label htmlFor={`room-type-${index}`}>Zimmertyp</Label>
                    <Input id={`room-type-${index}`} value={room.roomType} readOnly />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor={`occupancy-${index}`}>Belegung</Label>
                    <Input id={`occupancy-${index}`} value={`${room.adults} Erwachsene, ${room.children} Kinder`} readOnly />
                </div>
             </div>
        ))}
         <div className="grid gap-2">
             <Label htmlFor="board-type">Verpflegung</Label>
             <Input id="board-type" value={prefillData?.boardType} readOnly />
         </div>
         {prefillData?.priceTotal != null && (
            <div className="grid gap-2">
                <Label>Gesamtpreis</Label>
                <Input value={`${prefillData.priceTotal.toFixed(2)} €`} readOnly />
            </div>
         )}
    </div>
    )
};

const Step2GuestInfo = ({ onFileUpload }: { onFileUpload: (name: string, file: File) => void }) => (
    <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="firstName">Vorname</Label><Input id="firstName" name="firstName" placeholder="Max" required /></div>
            <div className="grid gap-2"><Label htmlFor="lastName">Nachname</Label><Input id="lastName" name="lastName" placeholder="Mustermann" required/></div>
        </div>
        <div className="grid gap-2"><Label htmlFor="email">E-Mail</Label><Input id="email" name="email" type="email" placeholder="max.mustermann@example.com" required /></div>
        <div className="grid gap-2">
            <Label htmlFor="id-upload">Ausweisdokument hochladen</Label>
             <div className="flex items-center justify-center w-full">
                <label htmlFor="id-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Klicken zum Hochladen</span> oder Drag & Drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <Input id="id-upload-input" type="file" className="hidden" onChange={(e) => e.target.files && onFileUpload('idDoc', e.target.files[0])} accept="image/png, image/jpeg, application/pdf" />
                </label>
            </div> 
        </div>
    </div>
);

const Step3Payment = ({ onFileUpload }: { onFileUpload: (name: string, file: File) => void }) => (
    <div className="grid gap-4">
        <div>
            <h3 className="font-medium">Zahlungsanweisungen</h3>
            <p className="text-sm text-muted-foreground">Bitte laden Sie einen Nachweis Ihrer Anzahlung hoch. Die Details für die Zahlung wurden an Ihre E-Mail-Adresse gesendet.</p>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="payment-upload">Zahlungsbestätigung hochladen</Label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="payment-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Klicken zum Hochladen</span> oder Drag & Drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <Input id="payment-upload-input" type="file" className="hidden" onChange={(e) => e.target.files && onFileUpload('paymentProof', e.target.files[0])} accept="image/png, image/jpeg, application/pdf" />
                </label>
            </div>
        </div>
    </div>
);

const Step4Review = ({ uploads, formData, prefillData }: { uploads: Record<string, FileUpload>, formData: any, prefillData?: BookingLink['prefill'] | null }) => (
     <div className="space-y-6">
        <div>
            <h3 className="text-lg font-bold font-headline">Buchung überprüfen</h3>
            <p className="text-sm text-muted-foreground">Bitte überprüfen Sie alle Angaben, bevor Sie die Buchung bestätigen.</p>
        </div>
        <Separator/>
        <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><h4 className="font-medium text-sm text-muted-foreground">Check-in</h4><p>{prefillData?.checkIn ? format(parseISO(prefillData.checkIn), 'PPP') : 'N/A'}</p></div>
                <div><h4 className="font-medium text-sm text-muted-foreground">Check-out</h4><p>{prefillData?.checkOut ? format(parseISO(prefillData.checkOut), 'PPP') : 'N/A'}</p></div>
            </div>
            <Separator/>
             <div><h4 className="font-medium text-sm text-muted-foreground">Gast</h4><p>{formData.firstName} {formData.lastName} ({formData.email})</p></div>
            <Separator/>
             <div><h4 className="font-medium text-sm text-muted-foreground">Hochgeladene Dokumente</h4>
                <ul className="list-disc list-inside text-sm mt-2 space-y-2">
                    {Object.values(uploads).length > 0 ? (
                      Object.values(uploads).map((upload) => (
                        <li key={upload.name}>
                            {upload.file.name}
                            {upload.progress < 100 && <Progress value={upload.progress} className="mt-1" />}
                        </li>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Keine Dokumente hochgeladen.</p>
                    )}
                </ul>
             </div>
        </div>
     </div>
);


export function BookingForm({ prefillData, linkId, hotelId }: { prefillData?: BookingLink['prefill'] | null, linkId?: string, hotelId?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [uploads, setUploads] = useState<Record<string, FileUpload>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileUpload = (name: string, file: File) => {
    // Basic validation
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({ variant: 'destructive', title: 'Datei zu groß', description: 'Die Datei darf maximal 5MB groß sein.'});
      return;
    }
    setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name } }));
  }

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const currentFormData = Object.fromEntries(new FormData(e.target as HTMLFormElement));
    setFormData(prev => ({...prev, ...currentFormData}));
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
                    setUploads(prev => {
                        const newUploads = {...prev};
                        if (newUploads[upload.name]) {
                            newUploads[upload.name] = { ...newUploads[upload.name], progress };
                        }
                        return newUploads;
                    });
                }, 
                (error) => {
                    console.error(`Upload fehlgeschlagen für ${upload.name}:`, error.code, error.message);
                    toast({ variant: 'destructive', title: 'Upload Fehler', description: `Konnte ${upload.file.name} nicht hochladen.`});
                    reject(error)
                }, 
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        setUploads(prev => {
                           const newUploads = {...prev};
                           if (newUploads[upload.name]) {
                               newUploads[upload.name] = { ...newUploads[upload.name], url: downloadURL };
                           }
                           return newUploads;
                        });
                        resolve({ name: upload.name, url: downloadURL });
                    });
                }
            );
        });
    };

  const handleConfirmBooking = async () => {
    if (!linkId || !hotelId || !prefillData) {
        toast({
            variant: "destructive",
            title: "Fehler",
            description: "Buchungsinformationen fehlen. Bitte verwenden Sie einen gültigen Link.",
        });
        return;
    }
    setIsSubmitting(true);

    try {
        const uploadPromises = Object.values(uploads).map(upload => uploadFile(upload));
        const uploadedFiles = await Promise.all(uploadPromises);
        
        const uploadedFileMap = uploadedFiles.reduce((acc, file) => {
            acc[file.name] = file.url;
            return acc;
        }, {} as Record<string, string>);

        if (!prefillData.bookingId) {
            throw new Error("Buchungs-ID fehlt in den Prefill-Daten.");
        }

        const batch = writeBatch(db);
        
        // 1. Buchungsdokument aktualisieren
        const bookingDocRef = doc(db, `hotels/${hotelId}/bookings`, prefillData.bookingId);
        const updateData: any = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            status: 'Submitted',
            submittedAt: Timestamp.now(),
            documents: uploadedFileMap,
        };
        batch.update(bookingDocRef, updateData);

        // 2. Buchungslink-Status aktualisieren
        const linkDocRef = doc(db, `hotels/${hotelId}/bookingLinks`, linkId);
        batch.update(linkDocRef, { status: 'used' });
        
        // 3. Batch-Operation ausführen
        await batch.commit();

        toast({
            title: "Buchung übermittelt!",
            description: "Ihre Buchungsdetails wurden an das Hotel gesendet."
        });
        router.push(`/guest/${linkId}/thank-you`);

    } catch (error) {
        const err = error as Error;
        console.error("Fehler bei der Buchungsbestätigung:", err);
        toast({
            variant: "destructive",
            title: "Fehler bei der Übermittlung",
            description: err.message || "Es gab ein Problem bei der Übermittlung Ihrer Buchung. Bitte versuchen Sie es erneut."
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={nextStep}>
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="mb-6">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
        <CardTitle className="font-headline text-2xl">
            {currentStep === 0 && 'Ihre Buchungsdetails'}
            {currentStep === 1 && 'Angaben zum Gast'}
            {currentStep === 2 && 'Zahlungsnachweis hochladen'}
            {currentStep === 3 && 'Buchung bestätigen'}
        </CardTitle>
        <CardDescription>
            {currentStep === 0 && 'Ihre Reisedaten wurden vorausgefüllt. Bitte überprüfen Sie diese.'}
            {currentStep === 1 && 'Bitte geben Sie Ihre persönlichen Daten an.'}
            {currentStep === 2 && 'Laden Sie einen Zahlungsnachweis hoch, um Ihre Buchung abzuschließen.'}
            {currentStep === 3 && 'Überprüfen Sie Ihre Buchungsdetails unten.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px]">
        {currentStep === 0 && <Step1Details prefillData={prefillData} />}
        {currentStep === 1 && <Step2GuestInfo onFileUpload={handleFileUpload} />}
        {currentStep === 2 && <Step3Payment onFileUpload={handleFileUpload} />}
        {currentStep === 3 && <Step4Review uploads={uploads} formData={formData} prefillData={prefillData} />}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" type="button" onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>
          Zurück
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button type="submit" disabled={isSubmitting}>Weiter</Button>
        ) : (
          <Button type="button" onClick={handleConfirmBooking} disabled={isSubmitting || Object.values(uploads).some(u => u.progress > 0 && u.progress < 100)}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span>Wird übermittelt...</span></> : 'Buchung abschicken'}
          </Button>
        )}
      </CardFooter>
    </Card>
    </form>
  );
}
