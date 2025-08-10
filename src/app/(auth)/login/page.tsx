import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
        <CardDescription>Login to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <Button asChild>
                <Link href="/admin">Login as Admin</Link>
            </Button>
            <Button variant="secondary" asChild>
                <Link href="/dashboard/aDg0Yo80GEfuuKFnyGF0">Login as Hotelier</Link>
            </Button>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an agency account?{' '}
          <Link href="/signup" className="underline font-medium text-primary">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
