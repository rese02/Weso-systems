
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { getHotelByOwnerEmail } from '@/lib/actions/hotel.actions';


export default function AgencyLoginPage() {
  const router = useRouter();
  const { signIn, user, loading, logout } = useAuth();
  const [email, setEmail] = useState('hallo@agentur-weso.it');
  const [password, setPassword] = useState('Hallo-weso.2025!');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
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

  if (loading) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
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
            <CardTitle className="text-2xl font-headline">Agency Login</CardTitle>
            <CardDescription>Enter your credentials to access the agency dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {loginError && <p className="text-sm text-center text-destructive">{loginError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <span>Login as Agency</span>}
            </Button>
          </CardFooter>
        </Card>
       </div>
    </div>
  );
}
