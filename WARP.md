# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands & Workflows

All app code lives under `frontend/`. The backend is Supabase-managed (no custom server).

### Install & Run Locally

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

- Dev server: `npm run dev` (Vite dev server on the usual Vite port).
- Build: `npm run build` (production bundle, used by Vercel).
- Preview built app: `npm run preview` (serves the `dist/` build).

### Environment Configuration

The frontend talks directly to Supabase and requires environment variables in `frontend/.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Notes:
- Use `frontend/.env.example` as a reference for which keys are needed, but **do not** commit real secrets.
- If Supabase is not configured correctly, the app renders a dedicated error screen from `SupabaseConfigError` (see `frontend/src/components/SupabaseConfigError.tsx`).

### Database Migrations (Supabase)

The PostgreSQL schema and security model are managed via Supabase SQL migrations in `supabase/migrations/`:

- `001_initial_schema.sql` – core tables (e.g. `profiles`, `links`) and triggers.
- `002_rls_policies.sql` / `003_fix_rls_policies.sql` – row-level security for per-user data and public profile access.
- `004_app_settings.sql` – `app_settings` table (e.g. the `signup_passkey` value).
- `005_add_bio_column.sql` – adds `bio` to profiles.
- `006_unique_profile_name.sql` – uniqueness constraints around profile identity.

These are intended to be run via the Supabase Dashboard SQL editor (README already describes the flow). Keep them in order when applying.

### Tests & Linting

There are currently **no** test or lint scripts defined in `frontend/package.json`:

- No `test`/`vitest`/`jest` scripts.
- No `lint` script.

If you add tests or linting, expose them via `npm run <script>` and update this section with how to run a single test/spec.

## High-Level Architecture

### Repository Layout

- `frontend/` – React + Vite + TypeScript SPA for the "IraqLinked" link-in-bio app.
- `supabase/` – Supabase project configuration and SQL migrations defining schema, RLS, and app settings.
- `README.md` / `SUPABASE_MIGRATION.md` – user-facing setup and deployment instructions (Supabase project creation, migrations, OAuth setup, and Vercel deployment).

There is **no custom backend server**; all application logic runs in the browser and communicates directly with Supabase.

### Frontend Application Structure

#### Entry & Routing Shell

- `frontend/src/main.tsx` – standard Vite React entry point that renders `<App />` into the DOM.
- `frontend/src/App.tsx`
  - Wraps the app in `AuthProvider` from `@/hooks/useAuth`.
  - Uses Wouter (`Route`, `Switch`, `useLocation`) for client-side routing.
  - Hides the global `Navbar` on public profile routes (`/profile/:username`) so public pages are chrome-less.
  - Renders a `Toaster` (shadcn/ui toast) at the root for notifications.
  - If `isSupabaseConfigured` is false (from `@/lib/supabase`), renders `SupabaseConfigError` instead of the app, enforcing correct env configuration.

Key routes (see `<Switch>` in `App.tsx`):

- `/` → `Home` – marketing/landing page for IraqLinked.
- `/login` → `Login` – email/password & OAuth login.
- `/signup` → `SignUp` – guarded signup flow using a passkey and username.
- `/profile-maker` → `ProfileMaker` – first-time profile creation; required before dashboard access.
- `/dashboard` → `Dashboard` – authenticated user console for managing profile and links.
- `/design` → `Design` – appearance customization (theme, layout) for the public profile.
- `/settings` → `Settings` – account-level settings (username/email/password, delete account).
- `/profile/:username` → `PublicProfile` – public, read-only profile view.

#### Auth & Global User State

- `frontend/src/hooks/useAuth.tsx`
  - Centralizes Supabase auth state and exposes it via React Context.
  - Provides:
    - `user` (id, email, display name, avatar URL).
    - Flags: `isAuthenticated`, `isLoading`, `isLoggingIn`, `isLoggingOut`, `isSigningUp`.
    - Actions: `loginWithGoogle`, `loginWithGithub`, `loginWithCredentials`, `signUpWithPasskey`, `logout`.
  - Initializes from `supabase.auth.getSession()` and subscribes to `onAuthStateChange`.
  - All navigation after auth events uses Wouter's `useLocation` to drive route changes.

**Signup with passkey & username**

- `signUpWithPasskey(email, password, passkey, username)` implements a constrained signup flow:
  - Validates `passkey` via `settingsApi.validatePasskey`, which checks the `app_settings` table for the `signup_passkey` row.
  - On success, calls `supabase.auth.signUp` with metadata including `username`.
  - Sets the local `user` and navigates to `/profile-maker` (not straight to dashboard).

**Auth invariants to preserve:**

- New users **must** complete `ProfileMaker` before the dashboard is fully usable.
- `useAuth` is the single source of truth for whether a user is logged in; all protected pages should rely on it.

#### Supabase Client & API Layer

- `frontend/src/lib/supabase.ts`
  - Creates and exports the configured Supabase client and typed table aliases (e.g. `Link`, `Profile`).
  - Exposes `isSupabaseConfigured` (used by `App.tsx` and `useAuth.tsx`).

- `frontend/src/lib/api.ts`
  - Houses the client-side API layer, grouping calls by domain.

**Links API (`linksApi`)**

- Responsible for CRUD and ordering of link rows in the `links` table:
  - `getAll()` – fetches all links for the current user ordered by `position`.
  - `create(data)` – inserts a new link, computing the next `position` based on existing rows.
  - `update(id, data)` – partial updates (title, URL, visibility).
  - `delete(id)` – deletes a link owned by the current user.
  - `reorder(linkIds)` – batch-updates `position` per link id.
  - `toggleVisibility(id)` – flips the `is_public` flag.

**Profile API (`profileApi`)**

- Models the public profile shape as `ProfileData` (user + links + theme), backed by the `profiles` table:
  - `get(userId)` – fetches profile data by Supabase user id.
  - `getByUsername(username)` – fetches profile by unique `username` and associated public links.
  - `update({ name?, bio?, image?, theme? })` – updates profile fields and enforces uniqueness on display name (maps unique-constraint errors to user-friendly messages).

`ProfileData.user.theme` stores the design configuration; `Design` and `PublicProfile` use this to keep appearance consistent.

**Settings API (`settingsApi`)**

- Connects account and application settings to Supabase:
  - `validatePasskey(passkey)` – checks `app_settings` for `signup_passkey`.
  - `updateUsername(username)` – updates `profiles.username` with uniqueness enforcement.
  - `updateEmail(email)` – wraps `supabase.auth.updateUser({ email })`.
  - `updatePassword(password)` – wraps `supabase.auth.updateUser({ password })`.
  - `deleteAccount()` – calls the `delete_own_account` RPC and then signs out.

**Key backend coupling:** if you change table/column names or add new constraints, audit `api.ts` before deploying.

#### Hooks for Data & UI

- `frontend/src/hooks/useLinks.ts`
  - Encapsulates link-fetching and mutations (likely via React Query) and powers the Dashboard's link list.
  - Exposes `links` array, loading flags (`isLoading`, `isCreating`, `isUpdating`), and mutation helpers (`createLink`, `updateLink`, `deleteLink`, `reorderLinks`, `toggleVisibility`).

- `frontend/src/hooks/use-toast.ts`
  - shadcn/ui toast hook; `Dashboard` and other components use it for user feedback.

Using these hooks instead of talking to `supabase` directly keeps async and error-handling logic centralized.

#### Pages & Core Flows

- `Home.tsx` – marketing page explaining IraqLinked and entry-point CTAs to log in or sign up.

- `Login.tsx` – email/password login and OAuth buttons; uses `useAuth.loginWithCredentials`/`loginWithGoogle`/`loginWithGithub`.

- `SignUp.tsx`
  - Collects email, password, passkey, and **username**.
  - Enforces username rules on the client (lowercase letters/digits/hyphen, 3–20 chars, starts with a letter, no spaces or other special characters).
  - Delegates to `useAuth.signUpWithPasskey`, so the backend passkey and username uniqueness are still the ultimate source of truth.
  - On success, sends the user to `/profile-maker` and does **not** consider the account "complete" until that step is done.

- `ProfileMaker.tsx`
  - On first visit, lets the user set display name, bio, and an initial profile picture.
  - Persists this via `profileApi.update` and then navigates to `/dashboard`.
  - The dashboard additionally enforces that a profile name exists; if not, it redirects back here.

- `Dashboard.tsx` (core of the app)
  - Guards access: if not authenticated, redirects to `/login`.
  - On load, uses `profileApi.get(user.id)` to fetch profile:
    - If `profileData.user.name` is missing, redirects to `/profile-maker` to enforce the "complete profile before dashboard" rule.
    - Syncs profile avatar, display name, bio, and username into local state.
  - Provides a **Dashboard header** with:
    - Title + subtitle.
    - "Copy Profile URL" button that uses the current `username` (or falls back to user id) to build `/profile/:username` URLs and copies them to the clipboard with a toast.
  - Offers two primary navigation cards:
    - **Edit Profile** – opens a modal where users can update avatar (image compression + upload), display name, and bio.
      - Avatar uploads go through `imageUtils` helpers:
        - Images are client-side compressed.
        - New image is uploaded to Supabase Storage via `uploadProfileImage`.
        - Old images are cleaned up via `deleteProfileImage` after successful update.
      - Profile save flows through `profileApi.update` and surfaces validation errors (e.g. duplicate display name) in the modal.
    - **Design Appearance** – navigates to `/design` to manage theme configuration.
  - Manages the **links list** using DnD Kit:
    - Adds new links (title, URL, visibility) via a modal powered by `react-hook-form` + `zod`.
    - Supports drag-and-drop reordering and visibility toggling.

- `Design.tsx`
  - Uses the `ThemeConfig` structure from `api.ts` to allow users to style their public page (background, gradients, shape, typography colors, alignment, etc.).
  - Persists changes via `profileApi.update({ theme })`.

- `Settings.tsx`
  - Exposes account-level operations based on `settingsApi`:
    - Change username (with uniqueness and validation rules matching signup).
    - Change email and password.
    - "Danger zone" area to delete the account (calls `settingsApi.deleteAccount`, which invokes the Supabase RPC and logs the user out).
  - This page is reachable via a "Settings" button in the navbar for authenticated users.

- `PublicProfile.tsx`
  - Route: `/profile/:username` (Wouter param).
  - Uses `profileApi.getByUsername` to fetch the profile and links.
  - Renders a public-facing page without the main `Navbar`, using the stored `theme` to control layout and styling.
  - Shows the larger/smaller profile avatar (depending on recent design tweaks), display name, bio (if present), and the list of public links.

### Shared UI & Components

- `frontend/src/components/Navbar.tsx`
  - Top navigation bar used for non-public routes.
  - Shows different actions depending on authentication state (e.g. links to Dashboard, Settings, login/logout buttons).

- `frontend/src/components/ProfilePreview.tsx`
  - Renders a preview of the public profile using theme + links, typically used in design-related pages so users can see changes.

- `frontend/src/components/SupabaseConfigError.tsx`
  - Dedicated error component rendered when environment variables are missing/misconfigured.

- `frontend/src/components/ui/*`
  - shadcn/ui primitives (Button, Card, Dialog, Input, Textarea, Avatar, Switch, etc.) and `toaster` glue.
  - These are the building blocks for all page UIs; prefer using them for consistency.

### Supabase-Specific Behaviors to Be Aware Of

- **Profiles & Links**
  - `profiles` rows are keyed by Supabase auth user id and hold `name`, `bio`, `image`, `username`, and `theme` JSON.
  - `links` records reference `user_id` and are guarded by RLS so users can only manage their own links.

- **Row-Level Security**
  - Public profile access is enabled via RLS policies that allow reads of public `profiles` and `links` needed for `/profile/:username`.
  - All other operations assume an authenticated user and are constrained accordingly.

- **App Settings (`app_settings` table)**
  - Stores configuration entries like the `signup_passkey` used by the custom signup flow.
  - To change the passkey, update the row where `key = 'signup_passkey'` via Supabase's table editor or SQL.

- **Account Deletion**
  - Implemented via a Supabase RPC function `delete_own_account`, called from `settingsApi.deleteAccount`.
  - This centralizes deletion logic in the database rather than in the client.

When modifying any Supabase-related behavior (signup rules, profile fields, RLS policies), update both the SQL migrations and the corresponding functions in `frontend/src/lib/api.ts` / `frontend/src/hooks/useAuth.tsx` to keep the contract consistent.