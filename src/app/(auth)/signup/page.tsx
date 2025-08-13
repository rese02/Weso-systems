'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAgency } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Shield } from 'lucide-react';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      <span>Create Account</span>
    </Button>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(createAgency, { success: false, error: null });

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Account Created",
        description: "Your agency account has been successfully created. Please log in.",
      });
      router.push('/agency/login');
    }
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: state.error,
      });
    }
  }, [state, router, toast]);

  return (
     <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
            <Link href="/" className="flex items-center gap-2 text-foreground">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold font-headline">Weso Systems</span>
            </Link>
        </div>
        <Card>
          <form action={formAction}>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-headline">Create your Agency</CardTitle>
              <CardDescription>
                Sign up to start managing your hotel booking systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input id="agencyName" name="agencyName" placeholder="My Awesome Agency" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="admin@myagency.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <SubmitButton />
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/agency/login" className="underline font-medium text-primary">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
       </div>
    </div>
  );
}
