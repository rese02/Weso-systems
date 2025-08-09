
'use client';

// This file is now a legacy route.
// The new, unified guest route is /guest/[linkId]/page.tsx
// We keep this file to prevent 404s from old links but it just shows an error.

import { Building2 } from 'lucide-react';

export default function LegacyBookingPage() {
  return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <Building2 className="h-12 w-12 text-destructive" />
            <h1 className="text-4xl font-bold font-headline">Invalid Link</h1>
            <p className="text-muted-foreground max-w-md">This booking link is outdated. Please use the new link provided by the hotel.</p>
        </div>
      </div>
    )
}
