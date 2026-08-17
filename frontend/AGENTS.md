<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

This is the frontend for a physics-driven transformer manufacturing ERP. Beyond the standard Next.js
guidance above:

- **Auth**: Firebase Auth (client SDK) + `firebase-admin` (server-only) — not a separate REST/Express
  backend. Route protection is a `src/proxy.ts` file (Node.js runtime — see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`),
  backed by `src/lib/auth/session.ts`. Server Actions are not covered by the proxy's matcher, so every
  mutating Server Action must call `requireRole()` itself rather than assuming the proxy already checked.
- **Roles**: exactly two — `Admin` and `StoreManager` — stored as a Firebase Auth custom claim (`role`),
  set via `frontend/scripts/seed-user.ts` (there is no self-registration).
- **Data access**: Firestore via `firebase-admin` inside Server Actions/Server Components for now.
  Firebase Cloud Functions are introduced in a later phase for the stateless BOM calculation engine.
- **UI**: shadcn/ui (Base UI primitives, not Radix) — see `components.json`. Run
  `npx shadcn@latest add <component>` rather than hand-rolling primitives.
- **State**: zustand (`src/store/`) for client-side UI state; the Firestore session cookie, not the
  client Firebase Auth state, is the source of truth for authorization.
