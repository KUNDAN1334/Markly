import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth } from '@/lib/firebase-admin';
import {
  getSessionCookieName,
  getSessionMaxAgeMs,
  requireAuthenticatedUser,
  unauthorizedResponse,
  upsertAuthenticatedUser,
} from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  idToken: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const user = await requireAuthenticatedUser(req);
  if (!user) return unauthorizedResponse();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = loginSchema.parse(body);

    const decoded = await firebaseAdminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
      expiresIn: getSessionMaxAgeMs(),
    });

    const user = await upsertAuthenticatedUser({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    });

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
    });

    response.cookies.set(getSessionCookieName(), sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(getSessionMaxAgeMs() / 1000),
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to start session' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
