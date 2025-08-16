'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';

export default function AgencyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('hallo@agentur-weso.it');
  const [password, setPassword] = useState('Hallo-weso.2025!');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (userCredential && userCredential.user) {
         const idToken = await userCredential.user.getIdToken();
         
         // Send the token to the server to set a cookie
         const response = await fetch('/api/auth/login', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({ idToken }),
         });

         const result = await response.json();

         if (response.ok && result.success) {
            if (result.role === 'agency') {
               toast({ title: "Login erfolgreich", description: "Sie werden zum Agentur-Dashboard weitergeleitet..." });
               router.push('/admin');
            } else {
               setLoginError("Dieses Konto ist nicht für den Agenturzugang konfiguriert.");
               await fetch('/api/auth/logout', { method: 'POST' }); // Log out server-side
               await auth.signOut(); // Log out client-side
            }
         } else {
            setLoginError(result.error || "Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.");
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
  
  return (
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
  );
}
