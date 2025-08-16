
import { NextResponse, type NextRequest } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const agencyLoginUrl = new URL('/agency/login', request.url);
  const hotelLoginUrl = new URL('/hotel/login', request.url);
  const adminDashboardUrl = new URL('/admin', request.url);
  
  // Try to get the token from cookies
  const sessionCookie = cookies().get('firebaseIdToken')?.value;

  // If there's no token and user is trying to access a protected route
  if (!sessionCookie) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
      // Redirect to agency login as a default for protected routes
      return NextResponse.redirect(agencyLoginUrl);
    }
    return NextResponse.next();
  }

  // If there is a token, verify it directly on the server
  try {
    const decodedToken = await authAdmin.verifyIdToken(sessionCookie);

    // --- Agency Route Protection ---
    if (pathname.startsWith('/admin')) {
      if (decodedToken.role !== 'agency') {
        // If the role is not agency, redirect to the agency login page.
        return NextResponse.redirect(agencyLoginUrl);
      }
    }

    // --- Hotelier Route Protection ---
    if (pathname.startsWith('/dashboard')) {
      if (decodedToken.role !== 'hotelier' || !decodedToken.hotelId) {
        return NextResponse.redirect(hotelLoginUrl);
      }
      // Extract hotelId from URL, e.g., /dashboard/hotel123 -> hotel123
      const urlHotelId = pathname.split('/')[2];
      if (decodedToken.hotelId !== urlHotelId) {
        // If the user tries to access a different hotel's dashboard, redirect to their own.
        return NextResponse.redirect(new URL(`/dashboard/${decodedToken.hotelId}`, request.url));
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

  } catch (error) {
    console.error('Middleware token verification error:', error);
    // If verification fails, treat as unauthenticated. Clear the invalid cookie.
    const response = NextResponse.redirect(agencyLoginUrl);
    response.cookies.delete('firebaseIdToken');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - guest (public guest booking pages)
     * - api/ (API routes, though we removed the only one used by middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|guest|api/).*)',
  ],
};
