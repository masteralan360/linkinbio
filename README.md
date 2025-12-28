# Link in Bio

A personal "Link in Bio" web application built with React and Supabase.

## Tech Stack

### Frontend
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- React Query + React Hook Form + Zod
- Wouter (routing)

### Backend & Database
- Supabase (PostgreSQL + Auth + Row-Level Security)
- Direct client-side integration (no Express server needed)

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project ([create one here](https://app.supabase.com))

### Setup

1. **Create a Supabase Project**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Create a new project
   - Note your project URL and anon key from Settings > API

2. **Run Database Migrations**
   - In your Supabase project, go to SQL Editor
   - Run the migrations in `supabase/migrations/` in order:
     - `001_initial_schema.sql`
     - `002_rls_policies.sql`

3. **Configure OAuth Providers**
   - In Supabase dashboard: Authentication > Providers
   - Enable Google and/or GitHub
   - Add your OAuth credentials
   - Set redirect URLs to: `https://your-project-ref.supabase.co/auth/v1/callback`

4. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Configure Environment Variables**
   
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Set root directory to `frontend`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### No Backend Deployment Needed

Since we're using Supabase, there's no Express backend to deploy. All API calls go directly to Supabase from the frontend.

## Project Structure

```
linkinbio/
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React hooks (useAuth, useLinks)
│   │   ├── lib/            # Supabase client, API functions
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app
│   │   └── main.tsx        # Entry point
│   └── package.json
├── supabase/
│   └── migrations/         # Database migration SQL files
└── README.md
```

## Features

- ✅ OAuth login (Google, GitHub) via Supabase Auth
- ✅ Create, edit, delete links
- ✅ Drag and drop reordering
- ✅ Toggle link visibility (public/private)
- ✅ Public profile page
- ✅ Row-Level Security (RLS) for data protection
- ✅ Optimistic updates with React Query

## Migration Notes

This project was migrated from Express + PostgreSQL to Supabase. See `SUPABASE_MIGRATION.md` for detailed migration information.
