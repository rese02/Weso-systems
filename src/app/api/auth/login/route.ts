import { authAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID token is required.' }, { status: 400 });
    }
    
    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    
    // This is a secure, server-side operation.
    // The session cookie is set here.
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });
    const { role, hotelId } = decodedToken;

    cookies().set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });

    return NextResponse.json({ success: true, role, hotelId });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 401 });
  }
}
