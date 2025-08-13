'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { getHotelByOwnerEmail } from '@/lib/actions/hotel.actions';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (role: 'agency' | 'hotelier') => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        if (role === 'agency') {
            router.push('/admin');
        } else {
            const result = await getHotelByOwnerEmail(email);
            if (result.success && result.hotelId) {
                router.push(`/dashboard/${result.hotelId}`);
            } else {
                 toast({ variant: 'destructive', title: "Anmeldefehler", description: result.error || "Für diese E-Mail wurde kein Hotel gefunden." });
            }
        }
      }
    } catch (error) {
        toast({ variant: 'destructive', title: "Anmeldefehler", description: "Ungültige E-Mail oder Passwort." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline">Willkommen zurück</CardTitle>
        <CardDescription>Melden Sie sich an, um auf Ihr Dashboard zuzugreifen</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <Button onClick={() => handleLogin('agency')} disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin" />}
                <span>Login als Agentur</span>
            </Button>
            <Button variant="secondary" onClick={() => handleLogin('hotelier')} disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              <span>Login als Hotelier</span>
            </Button>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Noch kein Agentur-Konto?{' '}
          <Link href="/signup" className="underline font-medium text-primary">
            Registrieren
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
