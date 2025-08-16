
import { NextResponse, type NextRequest } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const sessionCookie = cookies().get('firebaseIdToken')?.value;
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'No session cookie provided.' }, { status: 401 });
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(sessionCookie);
    
    // Return the claims needed by the middleware
    return NextResponse.json({
      uid: decodedToken.uid,
      role: decodedToken.role,
      hotelId: decodedToken.hotelId,
    });

  } catch (error) {
    console.error('API Token verification failed:', (error as Error).message);
    // Return a generic error to the client to avoid leaking implementation details
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
