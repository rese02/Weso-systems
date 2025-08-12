
import { Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
            <Link href="/" className="flex items-center gap-2 text-foreground">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold font-headline">HotelHub Central</span>
            </Link>
        </div>
        {children}
       </div>
    </div>
  );
}

    