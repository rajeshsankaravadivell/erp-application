import "server-only";

import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function loadCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY " +
        "env vars — set them in frontend/.env.local from a rotated service-account key.",
    );
  }

  return {
    projectId,
    clientEmail,
    // .env files store the PEM with literal "\n" sequences; convert them back to real newlines.
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

let app: App | undefined;

// Lazy on purpose: `next build`'s page-data collection step imports this
// module without a real request (and without real credentials) present.
// Deferring initialization until something actually calls getAdminAuth()/
// getAdminDb() keeps the build from failing before the app ever serves a
// request.
function getAdminApp(): App {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp({ credential: cert(loadCredential()) });
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
