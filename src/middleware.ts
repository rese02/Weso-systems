import { NextResponse, type NextRequest } from 'next/server';
import { authAdmin } from './lib/firebase-admin'; // Use relative path for stability
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

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
      const token = await authAdmin.verifyIdToken(sessionCookie, true);
      decodedToken = {
        uid: token.uid,
        role: token.role as any,
        hotelId: token.hotelId as any,
      };
    } catch (error) {
       console.error('Middleware token verification failed:', error);
       // Clear the invalid cookie and redirect
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
    // Allow agency to view hotelier dashboards
    if (decodedToken.role === 'agency') {
      return NextResponse.next();
    }
    if (decodedToken.role !== 'hotelier' || decodedToken.hotelId !== urlHotelId) {
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
     * - api (API routes, though we removed the only one)
     */
    '/((?!_next/static|_next/image|favicon.ico|guest|api).*)',
  ],
};
