// This file is intentionally left blank and can be removed.
// The login logic has been split into /agency/login and /hotel/login.
// This page is no longer used and can be deleted to avoid confusion.
// Redirecting from the root page to /agency/login for a better default experience.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/agency/login');
  }, [router]);
  return null;
}
