# Supabase Setup Guide for Flousy

This guide explains how to connect Flousy to Supabase for **authentication** and **database**.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in **Name** (`flousy`), **Database Password** (save it!), **Region**
4. Click **"Create new project"** and wait ~1 minute

---

## Step 2 — Run the Schema

1. In the dashboard click **SQL Editor** → **New query**
2. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Click **Run**

This creates all tables, indexes, RLS policies, and an auto-profile trigger.

---

## Step 3 — Disable Email Confirmation (dev)

For development, disable email confirmation so sign-ups work instantly:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle OFF **"Confirm email"**
3. Click **Save**

---

## Step 4 — Get Your Keys

1. Go to **Project Settings** → **API**
2. Copy **Project URL** and **anon / public key**
3. Go to **Project Settings** → **Database**
4. Copy the **Connection string** (URI) — replace `[YOUR-PASSWORD]`

---

## Step 5 — Configure `.env.local`

```env
# Supabase Auth (from Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Supabase PostgreSQL (from Project Settings → Database)
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

---

## Step 6 — Run the App

```bash
npm install
npm run dev
```

Open http://localhost:3000 → **Get Started** → create an account.

---

## How Auth Works

| Layer | Technology |
|-------|------------|
| Sign up / Sign in / Sign out | Supabase Auth (client-side via `@supabase/ssr`) |
| Session management | Supabase cookies + Next.js middleware |
| Route protection | Middleware redirects unauthenticated users |
| User profile data | `users` table queried via Drizzle ORM |
| Profile creation | Lazy: `/api/auth/me` creates profile on first access |

**Flow:**
1. User signs up → Supabase creates `auth.users` row + session cookie
2. Supabase trigger auto-creates a `public.users` profile row
3. App fetches `/api/auth/me` → server verifies session, returns profile
4. All API routes verify session server-side via `getAuthUser()`

---

## Schema Overview

```
auth.users (Supabase-managed)
  │
  └── public.users (app profile — auto-created on signup)
        │
        ├── month_budgets (1:N)
        │     ├── variable_expenses (1:N)
        │     └── fixed_expenses (1:N)
        │
        └── saving_goals (1:N)
```

| Table | Description |
|-------|-------------|
| `users` | Profile, preferences, currency (id = Supabase auth uid) |
| `month_budgets` | Monthly budget allocations (bank/home/wallet) |
| `variable_expenses` | Day-to-day expenses |
| `fixed_expenses` | Recurring charges |
| `saving_goals` | Savings targets |

---

## App Structure

### Public pages — Landing layout
| Route | Page |
|-------|------|
| `/` | Landing page |
| `/login` | Sign in / Sign up |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

### Authenticated pages — App layout
| Route | Page | Bottom nav |
|-------|------|------------|
| `/dashboard` | Budget management | ✅ Home |
| `/reports` | Spending analytics | ✅ Reports |
| `/savings` | Saving goals | ✅ Savings |
| `/history` | Transaction history | ✅ History |
| `/settings` | Profile & settings | ✅ Profile |
| `/export` | Data export | — |
| `/onboarding` | Setup wizard | — |
| `/help` | FAQ | — |

### Mobile navigation
- **Bottom bar**: floating pill at 1.5rem from bottom, 5 items
- **Desktop**: full sidebar with all navigation items

---

## Troubleshooting

### "Invalid API key" or auth errors
→ Double-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### Sign-up says "check your email"
→ Disable email confirmation: Auth → Providers → Email → toggle off "Confirm email"

### Database connection refused
→ Use the **Transaction pooler** connection string (port `6543`) from Project Settings → Database

### Profile not created after signup
→ Make sure you ran `supabase/schema.sql` which includes the `handle_new_user()` trigger
→ The app also lazily creates profiles via `/api/auth/me` as a fallback

---

## Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth + Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
