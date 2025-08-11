'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (path: string) => {
    // In a real app, you'd have actual authentication logic here.
    // For this prototype, we just navigate.
    router.push(path);
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
          <Input id="email" type="email" placeholder="m@example.com" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" type="password" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <Button onClick={() => handleLogin('/admin')}>Als Agentur anmelden</Button>
            <Button variant="secondary" onClick={() => handleLogin('/dashboard/hotel-paradise')}>
              Als Hotelier anmelden
            </Button>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Sie haben noch kein Agentur-Konto?{' '}
          <Link href="/signup" className="underline font-medium text-primary">
            Registrieren
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
