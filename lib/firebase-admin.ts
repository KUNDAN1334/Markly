import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseAdminApp: App;

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  return key?.replace(/\\n/g, '\n');
}

if (getApps().length > 0) {
  firebaseAdminApp = getApps()[0]!;
} else {
  firebaseAdminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

export const firebaseAdminAuth = getAuth(firebaseAdminApp);
