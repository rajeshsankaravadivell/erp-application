import { create } from "zustand";
import type { User } from "firebase/auth";

/**
 * Mirrors the Firebase client SDK's auth state for client components (e.g.
 * disabling the login form while Firebase resolves its initial state).
 *
 * This is NOT the source of truth for authorization — that's the server
 * session cookie, checked by `proxy.ts` and `requireRole()`. The two can
 * briefly disagree (e.g. right after sign-in, before the session cookie is
 * set) so never gate rendering of protected content on this store alone.
 */
interface AuthState {
  firebaseUser: User | null;
  initializing: boolean;
  setFirebaseUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  initializing: true,
  setFirebaseUser: (user) => set({ firebaseUser: user, initializing: false }),
}));
