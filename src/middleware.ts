import { NextResponse, type NextRequest } from 'next/server';
import { getFirebaseAdmin } from './lib/firebase-admin';

// Force the middleware to run on the Node.js runtime
// This is necessary because 'firebase-admin' is not compatible with the Edge runtime
export const runtime = 'nodejs';

async function verifyToken(token: string) {
  try {
    // getFirebaseAdmin now handles the initialization safely within the function call
    const { authAdmin } = getFirebaseAdmin();
    const decodedToken = await authAdmin.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', (error as Error).message);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  const agencyLoginUrl = new URL('/agency/login', request.url);
  const hotelLoginUrl = new URL('/hotel/login', request.url);

  // --- Agency Route Protection ---
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(agencyLoginUrl);
    }
    const decodedToken = await verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'agency') {
      return NextResponse.redirect(agencyLoginUrl);
    }
  }

  // --- Hotelier Route Protection ---
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(hotelLoginUrl);
    }
    const decodedToken = await verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'hotelier' || !decodedToken.hotelId) {
      return NextResponse.redirect(hotelLoginUrl);
    }

    // Extract hotelId from the URL path, e.g., /dashboard/some-hotel-id/...
    const urlHotelId = pathname.split('/')[2];
    if (decodedToken.hotelId !== urlHotelId) {
       console.warn(`Access mismatch: User's hotelId (${decodedToken.hotelId}) does not match URL hotelId (${urlHotelId}). Redirecting.`);
       // Redirect to their own dashboard to prevent accessing others'
       const correctDashboardUrl = new URL(`/dashboard/${decodedToken.hotelId}`, request.url);
       return NextResponse.redirect(correctDashboardUrl);
    }
  }

  // --- Redirect logged-in users from login pages ---
  if (token) {
      const decodedToken = await verifyToken(token);
      if (decodedToken) {
          if (pathname.startsWith('/agency/login') && decodedToken.role === 'agency') {
              return NextResponse.redirect(new URL('/admin', request.url));
          }
          if (pathname.startsWith('/hotel/login') && decodedToken.role === 'hotelier' && decodedToken.hotelId) {
              return NextResponse.redirect(new URL(`/dashboard/${decodedToken.hotelId}`, request.url));
          }
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - guest (public guest booking pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|guest).*)',
  ],
};
