import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// NOTE: We cannot use the Firebase Admin SDK here because the middleware
// can run in the Edge runtime, which doesn't support all Node.js APIs.
// Instead, we call a separate API route that runs in the Node.js runtime.

interface DecodedToken {
  uid: string;
  role?: 'agency' | 'hotelier';
  hotelId?: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const agencyLoginUrl = new URL('/agency/login', request.url);
  const hotelLoginUrl = new URL('/hotel/login', request.url);
  const adminDashboardUrl = new URL('/admin', request.url);
  
  const sessionCookie = cookies().get('firebaseIdToken')?.value;

  let decodedToken: DecodedToken | null = null;

  if (sessionCookie) {
    try {
      const response = await fetch(new URL('/api/auth/verify-token', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionCookie }),
      });
      
      if (response.ok) {
        decodedToken = await response.json();
      } else {
         // Clear the invalid cookie
        const res = NextResponse.redirect(agencyLoginUrl);
        res.cookies.delete('firebaseIdToken');
        return res;
      }
    } catch (error) {
       console.error('Middleware fetch error:', error);
       // On error, assume token is invalid and redirect
       const res = NextResponse.redirect(agencyLoginUrl);
       res.cookies.delete('firebaseIdToken');
       return res;
    }
  }

  // If there's no token and user is trying to access a protected route
  if (!decodedToken) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(agencyLoginUrl);
    }
    return NextResponse.next();
  }

  // --- Agency Route Protection ---
  if (pathname.startsWith('/admin')) {
    if (decodedToken.role !== 'agency') {
      return NextResponse.redirect(agencyLoginUrl);
    }
  }

  // --- Hotelier Route Protection ---
  if (pathname.startsWith('/dashboard')) {
    const urlHotelId = pathname.split('/')[2];
    if (decodedToken.role !== 'hotelier' || decodedToken.hotelId !== urlHotelId) {
      // If role is wrong or hotelId doesn't match, redirect to their own dashboard or login
      const destination = (decodedToken.role === 'hotelier' && decodedToken.hotelId)
        ? new URL(`/dashboard/${decodedToken.hotelId}`, request.url)
        : hotelLoginUrl;
      return NextResponse.redirect(destination);
    }
  }

  // --- Redirect logged-in users from login pages ---
  if (pathname.startsWith('/agency/login') && decodedToken.role === 'agency') {
    return NextResponse.redirect(adminDashboardUrl);
  }
  if (pathname.startsWith('/hotel/login') && decodedToken.role === 'hotelier' && decodedToken.hotelId) {
    return NextResponse.redirect(new URL(`/dashboard/${decodedToken.hotelId}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - guest (public guest booking pages)
     * - api/auth/verify-token (the verification route itself)
     */
    '/((?!_next/static|_next/image|favicon.ico|guest|api/auth/verify-token).*)',
  ],
};
