
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
import type { BookingPrefill } from '@/hooks/use-booking-links';
import { useBookingLinks } from '@/hooks/use-booking-links';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, Timestamp } from 'firebase/firestore';


const steps = ['Details', 'Guest Info', 'Payment', 'Review'];

type FileUpload = {
    file: File;
    progress: number;
    url?: string;
    name: string;
}

const Step1Details = ({ prefillData }: { prefillData?: BookingPrefill | null }) => {
    const [checkInDate, setCheckInDate] = useState<Date | undefined>(
        prefillData?.checkIn ? parseISO(prefillData.checkIn) : undefined
    );
    const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
        prefillData?.checkOut ? parseISO(prefillData.checkOut) : undefined
    );

    return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
            <Label htmlFor="check-in">Check-in Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('justify-start text-left font-normal', !checkInDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={checkInDate} onSelect={setCheckInDate} initialFocus />
                </PopoverContent>
            </Popover>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="check-out">Check-out Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('justify-start text-left font-normal', !checkOutDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                         {checkOutDate ? format(checkOutDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={checkOutDate} onSelect={setCheckOutDate} initialFocus />
                </PopoverContent>
            </Popover>
        </div>
         <div className="grid gap-2">
             <Label htmlFor="room-type">Room Type</Label>
             <Select defaultValue={prefillData?.roomType}>
                <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="single">Single Room</SelectItem>
                    <SelectItem value="double">Double Room</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                </SelectContent>
             </Select>
         </div>
         <div className="grid gap-2">
             <Label htmlFor="board-type">Board Type</Label>
             <Select>
                <SelectTrigger><SelectValue placeholder="Select a board type" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="half">Half Board</SelectItem>
                    <SelectItem value="full">Full Board</SelectItem>
                </SelectContent>
             </Select>
         </div>
         {prefillData?.priceTotal != null && (
            <div className="sm:col-span-2 grid gap-2">
                <Label>Total Price</Label>
                <Input value={`${prefillData.priceTotal.toFixed(2)} €`} readOnly />
            </div>
         )}
    </div>
    )
};

const Step2GuestInfo = ({ onFileUpload }: { onFileUpload: (name: string, file: File) => void }) => (
    <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="first-name">First Name</Label><Input id="first-name" name="firstName" placeholder="John" required /></div>
            <div className="grid gap-2"><Label htmlFor="last-name">Last Name</Label><Input id="last-name" name="lastName" placeholder="Doe" required/></div>
        </div>
        <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="john.doe@example.com" required /></div>
        <div className="grid gap-2">
            <Label htmlFor="id-upload">Upload ID Document</Label>
             <div className="flex items-center justify-center w-full">
                <label htmlFor="id-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <Input id="id-upload-input" type="file" className="hidden" onChange={(e) => e.target.files && onFileUpload('idDoc', e.target.files[0])} />
                </label>
            </div> 
        </div>
    </div>
);

const Step3Payment = ({ onFileUpload }: { onFileUpload: (name: string, file: File) => void }) => (
    <div className="grid gap-4">
        <div>
            <h3 className="font-medium">Payment Instructions</h3>
            <p className="text-sm text-muted-foreground">Please upload proof of your down payment. Details for the payment have been sent to your email.</p>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="payment-upload">Upload Payment Confirmation</Label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="payment-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <Input id="payment-upload-input" type="file" className="hidden" onChange={(e) => e.target.files && onFileUpload('paymentProof', e.target.files[0])} />
                </label>
            </div>
        </div>
    </div>
);

const Step4Review = ({ uploads, formData, prefillData }: { uploads: Record<string, FileUpload>, formData: any, prefillData?: BookingPrefill | null }) => (
     <div className="space-y-6">
        <div>
            <h3 className="text-lg font-bold font-headline">Review Your Booking</h3>
            <p className="text-sm text-muted-foreground">Please check all details before confirming your booking.</p>
        </div>
        <Separator/>
        <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><h4 className="font-medium text-sm text-muted-foreground">Check-in</h4><p>{prefillData?.checkIn ? format(parseISO(prefillData.checkIn), 'PPP') : 'N/A'}</p></div>
                <div><h4 className="font-medium text-sm text-muted-foreground">Check-out</h4><p>{prefillData?.checkOut ? format(parseISO(prefillData.checkOut), 'PPP') : 'N/A'}</p></div>
                <div><h4 className="font-medium text-sm text-muted-foreground">Room Type</h4><p>{prefillData?.roomType || 'N/A'}</p></div>
                <div><h4 className="font-medium text-sm text-muted-foreground">Board</h4><p>Half Board</p></div>
            </div>
            <Separator/>
             <div><h4 className="font-medium text-sm text-muted-foreground">Guest</h4><p>{formData.firstName} {formData.lastName} ({formData.email})</p></div>
            <Separator/>
             <div><h4 className="font-medium text-sm text-muted-foreground">Uploaded Documents</h4>
                <ul className="list-disc list-inside text-sm mt-2 space-y-2">
                    {Object.values(uploads).map((upload) => (
                        <li key={upload.name}>
                            {upload.file.name}
                            {upload.progress < 100 && <Progress value={upload.progress} className="mt-1" />}
                        </li>
                    ))}
                </ul>
             </div>
        </div>
     </div>
);


export function BookingForm({ prefillData, linkId, hotelId }: { prefillData?: BookingPrefill | null, linkId?: string, hotelId?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [uploads, setUploads] = useState<Record<string, FileUpload>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { markAsUsed } = useBookingLinks();
  const { toast } = useToast();

  const handleFileUpload = (name: string, file: File) => {
    setUploads(prev => ({ ...prev, [name]: { file, progress: 0, name } }));
  }

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const formElements = (e.target as HTMLFormElement).elements;
    const currentFormData = Object.fromEntries(new FormData(e.target as HTMLFormElement));
    setFormData(prev => ({...prev, ...currentFormData}));
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const uploadFile = (upload: FileUpload, basePath: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!hotelId || !linkId) return reject("Missing hotel or link ID");
            const filePath = `${hotelId}/bookings/${linkId}/${upload.name}-${upload.file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, upload.file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploads(prev => ({
                        ...prev,
                        [upload.name]: { ...prev[upload.name], progress }
                    }));
                }, 
                (error) => reject(error), 
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        resolve(downloadURL);
                    });
                }
            );
        });
    };

  const handleConfirmBooking = async () => {
    if (!linkId || !hotelId || !prefillData) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Booking information is missing. Please use a valid link.",
        });
        return;
    }
    setIsSubmitting(true);

    try {
        const uploadPromises = Object.values(uploads).map(upload => 
            uploadFile(upload, `${hotelId}/bookings/${linkId}`)
        );

        const fileURLs = await Promise.all(uploadPromises);
        
        const uploadedFileMap = Object.values(uploads).reduce((acc, upload, index) => {
            acc[upload.name] = fileURLs[index];
            return acc;
        }, {} as Record<string, string>);

        const bookingData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            checkIn: prefillData.checkIn,
            checkOut: prefillData.checkOut,
            roomType: prefillData.roomType,
            priceTotal: prefillData.priceTotal,
            status: 'Confirmed',
            createdAt: Timestamp.now(),
            documents: uploadedFileMap,
            bookingLinkId: linkId,
            hotelId,
        };

        await addDoc(collection(db, `hotels/${hotelId}/bookings`), bookingData);
        await markAsUsed(linkId, hotelId);

        toast({
            title: "Booking Confirmed!",
            description: "Your booking has been successfully processed."
        });
        router.push(`/guest/${linkId}/thank-you`);

    } catch (error) {
        const err = error as Error;
        console.error("Booking confirmation failed:", err);
        toast({
            variant: "destructive",
            title: "Error",
            description: err.message || "There was a problem confirming your booking. Please try again."
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
            {currentStep === 0 && (prefillData ? 'Your Prefilled Booking' : 'Booking Details')}
            {currentStep === 1 && 'Guest Information'}
            {currentStep === 2 && 'Upload Payment'}
            {currentStep === 3 && 'Confirm Booking'}
        </CardTitle>
        <CardDescription>
            {currentStep === 0 && (prefillData ? 'Your details have been prefilled. Please verify them.' : 'Select your dates and preferences.')}
            {currentStep === 1 && 'Please provide your personal details.'}
            {currentStep === 2 && 'Upload proof of payment to confirm your booking.'}
            {currentStep === 3 && 'Review your booking details below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[250px]">
        {currentStep === 0 && <Step1Details prefillData={prefillData} />}
        {currentStep === 1 && <Step2GuestInfo onFileUpload={handleFileUpload} />}
        {currentStep === 2 && <Step3Payment onFileUpload={handleFileUpload} />}
        {currentStep === 3 && <Step4Review uploads={uploads} formData={formData} prefillData={prefillData} />}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" type="button" onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button type="submit" disabled={isSubmitting}>Next</Button>
        ) : (
          <Button type="button" onClick={handleConfirmBooking} disabled={isSubmitting || Object.values(uploads).some(u => u.progress < 100)}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : 'Confirm Booking'}
          </Button>
        )}
      </CardFooter>
    </Card>
    </form>
  );
}

    