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

export default function HotelierLoginPage() {
  const router = useRouter();
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const userCredential = await signIn(email, password);
      
      if (userCredential && userCredential.user) {
         const idTokenResult = await userCredential.user.getIdTokenResult();
         const userRole = idTokenResult.claims.role;
         const hotelId = idTokenResult.claims.hotelId;

         if (userRole === 'hotelier' && hotelId) {
             toast({ title: "Login Successful", description: "Redirecting to your hotel dashboard..." });
             router.push(`/dashboard/${hotelId}`);
         } else {
            setLoginError("This account is not configured for hotel access.");
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
            {/* In a real multi-tenant app, this logo would be dynamic based on the hotel */}
            <Link href="/" className="flex items-center gap-2 text-foreground">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold font-headline">Hotel Login</span>
            </Link>
        </div>
         <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-headline">Welcome Back, Hotelier</CardTitle>
            <CardDescription>Sign in to access your hotel's dashboard.</CardDescription>
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
                {isLoading ? <Loader2 className="animate-spin" /> : <span>Login as Hotelier</span>}
            </Button>
          </CardFooter>
        </Card>
       </div>
    </div>
  );
}
