/**
 * Bootstraps or updates an Admin/StoreManager account: creates (or reuses)
 * the Firebase Auth user, sets the `role` custom claim, and upserts the
 * matching `users/{uid}` Firestore doc.
 *
 * This is the only way to create the first Admin — there's no self-
 * registration and no existing Admin yet to promote anyone via the app.
 *
 * Run locally with your own rotated service-account key, never via an agent:
 *   npm run seed:user -- <email> <password> "<Display Name>" <Admin|StoreManager>
 */
import { config as loadEnv } from "dotenv";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const ROLES = ["Admin", "StoreManager"] as const;
type Role = (typeof ROLES)[number];

function usageError(message: string): never {
  console.error(`Error: ${message}`);
  console.error('Usage: npm run seed:user -- <email> <password> "<Display Name>" <Admin|StoreManager>');
  process.exit(1);
}

function parseArgs() {
  const [email, password, displayName, role] = process.argv.slice(2);
  if (!email || !password || !displayName || !role) {
    usageError("all four arguments are required.");
  }
  if (!ROLES.includes(role as Role)) {
    usageError(`role must be one of: ${ROLES.join(", ")}.`);
  }
  return { email, password, displayName, role: role as Role };
}

async function main() {
  loadEnv({ path: ".env.local" });

  const { email, password, displayName, role } = parseArgs();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    usageError(
      "FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY must be set in " +
        "frontend/.env.local, using a freshly rotated service-account key.",
    );
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey!.replace(/\\n/g, "\n"),
    }),
  });
  const auth = getAuth(app);
  const db = getFirestore(app);

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password, displayName });
    console.log(`User ${email} already exists (${uid}) — updated password/displayName.`);
  } catch {
    const created = await auth.createUser({ email, password, displayName, emailVerified: true });
    uid = created.uid;
    console.log(`Created new user ${email} (${uid}).`);
  }

  await auth.setCustomUserClaims(uid, { role });

  const userRef = db.collection("users").doc(uid);
  const existingDoc = await userRef.get();

  await userRef.set(
    {
      uid,
      email,
      displayName,
      role,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existingDoc.exists ? {} : { createdAt: FieldValue.serverTimestamp(), createdBy: "seed-script" }),
    },
    { merge: true },
  );

  console.log(`Set role=${role} for ${email}.`);
  console.log(
    "Note: this is a temporary password with no forced-change flow in Phase 1 — treat as a known non-goal.",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
