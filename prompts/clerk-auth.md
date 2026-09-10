# Clerk authentication

## Goal
Wire Clerk authentication into Vertex (AGENTS.md §5, §7): Clerk in Next.js
proxy, visible sign-in / sign-up / signed-in controls in the nav, secret key
server-only.

## Skills / docs read
- `clerk-setup` skill (the invoking command).
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` —
  Next.js 16 renames Middleware to Proxy; `proxy.ts` at project root, default
  export supported. `clerkMiddleware()` as the default export is correct here.
- `node_modules/@clerk/nextjs` type surface — confirms `Show`, `UserButton`,
  `SignInButton`, `SignUpButton` are exported by v7.9.2.

## Code inspected
- `app/layout.tsx` — root layout, fonts + `h-full` html / `min-h-full` body.
- `app/components/ui/Nav.tsx` — presentational header, takes an `actions` slot.
- `app/page.tsx:50` `HeaderActions` — bell + placeholder avatar, with a comment
  already stating the avatar becomes Clerk's `<UserButton />` when auth lands.
- `app/sign-in`, `app/sign-up`, `proxy.ts` — scaffolded by `clerk init`.

## Already done by `clerk init --app app_3J8Ssrjou0gdcrVgklsWBqn9beD`
- Installed `@clerk/nextjs@^7.9.2`.
- Wrapped `{children}` in `<ClerkProvider>` inside `<body>` in `app/layout.tsx`.
- Added `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`.
- Added `proxy.ts` with `clerkMiddleware()`.
- Wrote keys to `.env.local` (gitignored, not read or printed).

## Decisions & assumptions
- Browsing stays public (AGENTS.md §7): `clerkMiddleware()` gates nothing yet.
  Route protection lands with the features that need it.
- Keep the scaffolded `<SignIn />` / `<SignUp />` pages as-is for now; they are
  not in the design references, so there is nothing to match exactly yet.
- Nav auth controls replace the placeholder avatar only. The bell stays
  presentational (AGENTS.md §7).
- Sign-in / sign-up buttons are styled with the existing `Button` /
  `ButtonLink` patterns rather than new styles (AGENTS.md §3).

## Files to touch
- `proxy.ts` — add `'/__clerk/:path*'` to `config.matcher` after `'/(api|trpc)(.*)'`.
- `app/layout.tsx` — restore trailing newline removed by the CLI.
- `app/page.tsx` — `HeaderActions`: `Show when="signed-out"` → sign in / sign up;
  `Show when="signed-in"` → `<UserButton />`.
- `.env.example` — add the canonical Clerk key names (AGENTS.md §12).
- `.gitignore` — `.env*` currently also ignores `.env.example`; add a
  `!.env.example` negation so the canonical list can be committed.

## Security
- `CLERK_SECRET_KEY` stays server-only; never imported into a client component.
- Only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` reaches the browser.
- `.env.local` is gitignored; `.env.example` holds names with empty values only.
- Auth is enforced in `proxy.ts`, not in client code.

## Acceptance criteria
1. Signed out, the nav shows Sign in and Sign up; signed in, it shows the Clerk
   user button and the placeholder avatar is gone.
2. Sign-up creates an account and the header switches without a manual reload.
3. `.env.example` lists both Clerk key names, no values.
4. Home page visual design is otherwise unchanged.

## Checks
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (proxy.ts, layout, and routes changed)
- `clerk doctor`
- `npm run dev`

## Manual test steps
1. `npm run dev`, open http://localhost:3000.
2. Header shows Sign in / Sign up at the right of the nav.
3. Click Sign up, create an account with a real email, complete verification.
4. Land back on the site; the header now shows the Clerk user button.
5. Open the user button, sign out; header returns to Sign in / Sign up.
6. Resize to mobile width, confirm the nav still wraps as designed.
