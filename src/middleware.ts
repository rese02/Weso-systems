import { NextResponse, type NextRequest } from 'next/server';

// The middleware does not need the Node.js runtime anymore, it can run on the Edge.
// export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  const agencyLoginUrl = new URL('/agency/login', request.url);
  const hotelLoginUrl = new URL('/hotel/login', request.url);

  // A helper function to verify the token by calling our new API route
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(new URL('/api/auth/verify-token', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error verifying token via API route:', error);
      return null;
    }
  };
  
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

    const urlHotelId = pathname.split('/')[2];
    if (decodedToken.hotelId !== urlHotelId) {
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
     * - api (API routes are now handled internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - guest (public guest booking pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|guest).*)',
  ],
};
