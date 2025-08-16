
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const agencyLoginUrl = new URL('/agency/login', request.url);
  const hotelLoginUrl = new URL('/hotel/login', request.url);
  const adminDashboardUrl = new URL('/admin', request.url);
  
  // Try to get the token from cookies
  const tokenCookie = cookies().get('firebaseIdToken');
  const token = tokenCookie?.value;

  // If there's no token and user is trying to access a protected route
  if (!token) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
      // Redirect to agency login as a default for protected routes
      return NextResponse.redirect(agencyLoginUrl);
    }
    return NextResponse.next();
  }

  // If there is a token, verify it
  try {
    const response = await fetch(new URL('/api/auth/verify-token', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `firebaseIdToken=${token}` // Forward the cookie
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
       // Token is invalid, clear it and redirect to login
       const response = NextResponse.redirect(agencyLoginUrl);
       response.cookies.delete('firebaseIdToken');
       return response;
    }

    const decodedToken = await response.json();

    // --- Agency Route Protection ---
    if (pathname.startsWith('/admin')) {
      if (decodedToken.role !== 'agency') {
        return NextResponse.redirect(agencyLoginUrl);
      }
    }

    // --- Hotelier Route Protection ---
    if (pathname.startsWith('/dashboard')) {
      if (decodedToken.role !== 'hotelier' || !decodedToken.hotelId) {
        return NextResponse.redirect(hotelLoginUrl);
      }
      const urlHotelId = pathname.split('/')[2];
      if (decodedToken.hotelId !== urlHotelId) {
        // Redirect to the correct dashboard if accessing the wrong one
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
    // If verification fails, treat as unauthenticated
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
     * - api/auth (the auth verification route itself to prevent loops)
     */
    '/((?!_next/static|_next/image|favicon.ico|guest|api/auth).*)',
  ],
};
