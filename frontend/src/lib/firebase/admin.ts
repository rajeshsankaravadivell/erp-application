import "server-only";

import { cert, getApp, initializeApp, type App, type Credential } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Returns an explicit service-account credential built from .env.local, or
// null if those vars aren't set. Used for local dev, where Application
// Default Credentials usually aren't configured.
function loadExplicitCredential(): Credential | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  return cert({
    projectId,
    clientEmail,
    // .env files store the PEM with literal "\n" sequences; convert them back to real newlines.
    privateKey: privateKey.replace(/\\n/g, "\n"),
  });
}

let app: App | undefined;

// Lazy on purpose: `next build`'s page-data collection step imports this
// module without a real request (and without real credentials) present.
// Deferring initialization until something actually calls getAdminAuth()/
// getAdminDb() keeps the build from failing before the app ever serves a
// request.
function getAdminApp(): App {
  if (!app) {
    // Don't use getApps().length as a proxy for "the default app exists" —
    // same fix as functions/src/lib/admin.ts: something else initializing a
    // non-default-named app would make that check wrongly skip our own init.
    try {
      app = getApp();
    } catch {
      // In Cloud Run / Firebase App Hosting, Application Default Credentials
      // are available automatically via the backend's attached service
      // account — no explicit key needed there. Locally, fall back to the
      // explicit service-account credential from .env.local (ADC usually
      // isn't configured on a dev machine).
      const explicitCredential = loadExplicitCredential();
      app = explicitCredential ? initializeApp({ credential: explicitCredential }) : initializeApp();
    }
  }
  return app;
}

let auth: Auth | undefined;
export function getAdminAuth(): Auth {
  if (!auth) auth = getAuth(getAdminApp());
  return auth;
}

let db: Firestore | undefined;
export function getAdminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}
