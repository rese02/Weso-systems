
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

export default function AgencyLoginPage() {
  const router = useRouter();
  const { signIn, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
      // Hardcoded credentials for one-click login
      const email = 'hallo@agentur-weso.it';
      const password = 'Hallo-weso.2025!';

      const userCredential = await signIn(email, password);
      
      if (userCredential && userCredential.user) {
         // Force refresh the token to get the latest claims
         const idTokenResult = await userCredential.user.getIdTokenResult(true);
         const userRole = idTokenResult.claims.role;

         if (userRole === 'agency-owner') {
             toast({ title: "Login Successful", description: "Redirecting to your agency dashboard..." });
             router.push('/admin');
         } else {
            setLoginError("Access denied. This account does not have agency permissions.");
            await logout();
         }
      } else {
         setLoginError("Login failed. Please check your credentials.");
      }
    } catch (error) {
       console.error("Login error:", error);
       setLoginError("Invalid email or password.");
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
