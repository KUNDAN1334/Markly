import { cookies } from 'next/headers';
import LandingPageClient from '@/components/landing/LandingPageClient';
import { firebaseAdminAuth } from '@/lib/firebase-admin';
import { getSessionCookieName } from '@/lib/auth';

async function getInitialIsAuthed() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getSessionCookieName())?.value;

  if (!sessionCookie) return false;

  try {
    await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
    return true;
  } catch {
    return false;
  }
}

export default async function LandingPage() {
  const initialIsAuthed = await getInitialIsAuthed();

  return <LandingPageClient initialIsAuthed={initialIsAuthed} />;
}
