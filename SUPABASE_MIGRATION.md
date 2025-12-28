# Supabase Migration Guide

This project has been migrated from Express + PostgreSQL to Supabase.

## Migration Overview

- **Backend**: Removed Express server (no longer needed)
- **Database**: Now using Supabase PostgreSQL with Row-Level Security
- **Authentication**: Using Supabase Auth with OAuth (Google & GitHub)
- **Frontend**: Direct Supabase client integration

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Note your project URL and anon key from Settings > API

### 2. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql` - Creates tables and triggers
   - `supabase/migrations/002_rls_policies.sql` - Sets up Row-Level Security

### 3. Configure OAuth Providers

#### Google OAuth:
1. Go to Authentication > Providers in Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

#### GitHub OAuth:
1. Go to Authentication > Providers in Supabase dashboard
2. Enable GitHub provider
3. Create a GitHub OAuth App at [https://github.com/settings/developers](https://github.com/settings/developers)
4. Add your GitHub OAuth credentials:
   - Client ID
   - Client Secret
5. Set Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`

### 4. Configure Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase project settings (Settings > API).

### 5. Install Dependencies

```bash
cd frontend
npm install
```

### 6. Run the Frontend

```bash
npm run dev
```

## Architecture Changes

### Database Schema

- **`profiles`** table: Extends Supabase `auth.users` with additional user data
- **`links`** table: User's links with position and visibility settings
- Automatic profile creation via database trigger when user signs up

### Security (RLS Policies)

- Users can only read/write their own links
- Public links are readable by anyone (for public profile pages)
- Profiles are readable by anyone (for public profile pages)

### Authentication Flow

1. User clicks "Sign in with Google/GitHub"
2. Supabase handles OAuth redirect
3. User is redirected back to `/dashboard`
4. Frontend automatically loads user profile from `profiles` table

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### No Backend Deployment Needed

Since we're using Supabase, there's no Express backend to deploy. All API calls go directly to Supabase from the frontend.

## Migration Notes

- The old Express backend has been removed
- All API routes (`/api/*`) have been replaced with Supabase client calls
- Session-based auth replaced with Supabase JWT tokens
- CSRF protection is handled by Supabase
- Email whitelist functionality removed (can be re-added via Supabase Auth hooks if needed)

## Troubleshooting

### OAuth Redirect Issues

Make sure your redirect URLs are correctly configured in:
1. Supabase dashboard (Authentication > URL Configuration)
2. OAuth provider settings (Google/GitHub)

### RLS Policy Errors

If you get permission errors, check:
1. RLS policies are enabled on tables
2. Policies are correctly set up in `002_rls_policies.sql`
3. User is authenticated (check `supabase.auth.getUser()`)

### Profile Not Created

If user profile isn't created on signup:
1. Check the trigger `on_auth_user_created` exists
2. Check the function `handle_new_user()` exists
3. Verify the trigger is attached to `auth.users` table


