import { getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

// Lazy on purpose, mirroring frontend/src/lib/firebase/admin.ts — importing
// this module (directly or transitively, e.g. via bom/repository.ts) must
// not trigger any SDK initialization at module-load time. That matters here
// for the same reason it did in Next.js: unit tests that import files next
// to repository.ts (calculate.ts, types.ts, etc.) must not require Firebase
// credentials just to run. In production, gen2 Cloud Functions get
// Application Default Credentials automatically — no cert()/env vars needed.
function getAdminApp(): App {
  if (!app) {
    // Don't use getApps().length as a proxy for "the default app exists" —
    // firebase-functions' own callable-request verification (ID token /
    // App Check checks) lazily initializes its own non-default-named Admin
    // app before this code runs, so getApps() can be non-empty while no
    // app is actually named "[DEFAULT]". getApp() only looks up that exact
    // name, so try it directly and initialize on failure instead.
    try {
      app = getApp();
    } catch {
      app = initializeApp();
    }
  }
  return app;
}

let db: Firestore | undefined;
export function getAdminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}
