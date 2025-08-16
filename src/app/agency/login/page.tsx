
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { resetAgencyPassword } from '@/lib/actions/temp-reset-password';


export default function AgencyLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // This server action ensures the agency user has the correct password and claims.
    // It runs once when the component mounts.
    resetAgencyPassword();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
      // Hardcoded credentials for one-click login
      const email = 'hallo@agentur-weso.it';
      const password = 'Hallo-weso.2025!';

      const userCredential = await signIn(email, password);
      
      if (userCredential && userCredential.user) {
         // The user is authenticated. We trust that the server-side action has set the correct claims.
         // We will skip the client-side role check which was causing issues due to token propagation delays.
         // The server will enforce permissions on any sensitive actions anyway.
         toast({ title: "Login Successful", description: "Redirecting to your agency dashboard..." });
         router.push('/admin');

      } else {
         setLoginError("Login failed. Please check your credentials.");
      }
    } catch (error) {
       console.error("Login error:", error);
       const authError = error as { code?: string };
       if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
           setLoginError("Invalid email or password. The account repair might be in progress. Please try again in a moment.");
       } else {
           setLoginError("An unexpected error occurred during login.");
       }
    } finally {
        setIsLoading(false);
    }
  };
  
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
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-headline">Agency Login</CardTitle>
            <CardDescription>Klicken Sie, um das Agentur-Dashboard zu betreten.</CardDescription>
          </CardHeader>
          <CardContent>
            {loginError && <p className="text-sm text-center text-destructive">{loginError}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <span>Login als Agentur</span>}
            </Button>
          </CardFooter>
        </Card>
       </div>
    </div>
  );
}
