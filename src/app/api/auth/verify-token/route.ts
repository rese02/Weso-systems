import { NextResponse, type NextRequest } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; // This route needs the Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const decodedToken = await authAdmin.verifyIdToken(token);
    
    // Return the claims which are needed by the middleware
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
