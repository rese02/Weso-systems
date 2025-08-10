
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold font-headline">Vielen Dank!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>
            Ihre Buchungsdaten wurden erfolgreich an das Hotel übermittelt. Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details.
          </CardDescription>
          <Button asChild>
            <Link href="/">Zur Startseite</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
