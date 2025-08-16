'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { useAuth } from '@/context/auth-context';

export default function AgencyLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (userCredential && userCredential.user) {
         const idTokenResult = await userCredential.user.getIdTokenResult(true); // Force refresh
         const userRole = idTokenResult.claims.role;

         if (userRole === 'agency') {
             toast({ title: "Login erfolgreich", description: "Sie werden zum Agentur-Dashboard weitergeleitet..." });
             router.push('/admin');
         } else {
            setLoginError("Dieses Konto ist nicht für den Agenturzugang konfiguriert.");
         }
      } else {
        setLoginError("Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.");
      }
    } catch (error) {
       console.error("Login-Fehler:", error);
       setLoginError("Ungültige E-Mail-Adresse oder falsches Passwort.");
    } finally {
        setIsLoading(false);
    }
  };

   if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is already logged in as agency, redirect them
  if (user?.claims.role === 'agency') {
    router.push('/admin');
    return null;
  }
  
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
            <CardTitle className="text-2xl font-headline">Agentur-Login</CardTitle>
            <CardDescription>Melden Sie sich an, um auf das Dashboard zuzugreifen.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {loginError && <p className="text-sm text-center text-destructive">{loginError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" placeholder="admin@weso.it" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <span>Anmelden</span>}
            </Button>
          </CardFooter>
        </Card>
       </div>
    </div>
  );
}
