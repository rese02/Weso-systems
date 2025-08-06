import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, KeyRound, LayoutDashboard, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold font-headline text-foreground">WESO Booking Systems</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-grow">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight text-foreground">
              All Your Hotel Bookings, <span className="text-primary">One Central Hub</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              WESO Booking Systems is the ultimate SaaS platform for agency owners to create and manage multiple hotel booking systems with ease.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Create Your Agency</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Access Your Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline text-foreground">Powerful Features for Modern Agencies</h2>
              <p className="mt-2 text-muted-foreground">Everything you need to scale your hotel management business.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline mt-4">Centralized Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Oversee all your hotel clients from a single, intuitive admin dashboard.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline mt-4">White-Glove Systems</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Create bespoke booking systems for each hotel, complete with separate data and logins.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline mt-4">Advanced Role Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Secure access for agency owners, hoteliers, and guests with robust role-based permissions.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} WESO Booking Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
