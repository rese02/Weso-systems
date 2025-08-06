'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './step-indicator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, UploadCloud } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

const steps = ['Details', 'Guest Info', 'Payment', 'Review'];

const Step1Details = () => {
    const [checkInDate, setCheckInDate] = useState<Date>();
    const [checkOutDate, setCheckOutDate] = useState<Date>();

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
             <Select>
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
    </div>
    )
};

const Step2GuestInfo = () => (
    <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="first-name">First Name</Label><Input id="first-name" placeholder="John" /></div>
            <div className="grid gap-2"><Label htmlFor="last-name">Last Name</Label><Input id="last-name" placeholder="Doe" /></div>
        </div>
        <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="john.doe@example.com" /></div>
        <div className="grid gap-2">
            <Label htmlFor="id-upload">Upload ID Document</Label>
             <div className="flex items-center justify-center w-full">
                <label htmlFor="id-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <Input id="id-upload" type="file" className="hidden" />
                </label>
            </div> 
        </div>
    </div>
);

const Step3Payment = () => (
    <div className="grid gap-4">
        <div>
            <h3 className="font-medium">Payment Instructions</h3>
            <p className="text-sm text-muted-foreground">Please upload proof of your down payment. Details for the payment have been sent to your email.</p>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="payment-upload">Upload Payment Confirmation</Label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="payment-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <Input id="payment-upload" type="file" className="hidden" />
                </label>
            </div>
        </div>
    </div>
);

const Step4Review = () => (
     <div className="space-y-6">
        <div>
            <h3 className="text-lg font-bold font-headline">Review Your Booking</h3>
            <p className="text-sm text-muted-foreground">Please check all details before confirming your booking.</p>
        </div>
        <Separator/>
        <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><h4 className="font-medium text-sm text-muted-foreground">Check-in</h4><p>August 15, 2024</p></div>
                <div><h4 className="font-medium text-sm text-muted-foreground">Check-out</h4><p>August 20, 2024</p></div>
                 <div><h4 className="font-medium text-sm text-muted-foreground">Room Type</h4><p>Double Room</p></div>
                <div><h4 className="font-medium text-sm text-muted-foreground">Board</h4><p>Half Board</p></div>
            </div>
            <Separator/>
             <div><h4 className="font-medium text-sm text-muted-foreground">Guest</h4><p>John Doe (john.doe@example.com)</p></div>
            <Separator/>
             <div><h4 className="font-medium text-sm text-muted-foreground">Uploaded Documents</h4>
                <ul className="list-disc list-inside text-sm mt-2">
                    <li>id_document.pdf</li>
                    <li>payment_proof.jpg</li>
                </ul>
             </div>
        </div>
     </div>
);


export function BookingForm() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="mb-6">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
        <CardTitle className="font-headline text-2xl">
            {currentStep === 0 && 'Booking Details'}
            {currentStep === 1 && 'Guest Information'}
            {currentStep === 2 && 'Upload Payment'}
            {currentStep === 3 && 'Confirm Booking'}
        </CardTitle>
        <CardDescription>
            {currentStep === 0 && 'Select your dates and preferences.'}
            {currentStep === 1 && 'Please provide your personal details.'}
            {currentStep === 2 && 'Upload proof of payment to confirm your booking.'}
            {currentStep === 3 && 'Review your booking details below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[250px]">
        {currentStep === 0 && <Step1Details />}
        {currentStep === 1 && <Step2GuestInfo />}
        {currentStep === 2 && <Step3Payment />}
        {currentStep === 3 && <Step4Review />}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={nextStep}>Next</Button>
        ) : (
          <Button>Confirm Booking</Button>
        )}
      </CardFooter>
    </Card>
  );
}
