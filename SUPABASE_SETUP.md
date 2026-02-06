# Supabase Setup Guide for iRetro

This guide will help you set up Supabase for user authentication and cloud sync of liked songs.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose your organization
4. Enter project details:
   - **Name**: `monad` (or any name you like)
   - **Database Password**: Choose a strong password (save it somewhere)
   - **Region**: Choose the closest region to you
5. Click **"Create new project"** and wait ~2 minutes for setup

## Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL** (looks like `https://xyzproject.supabase.co`)
   - **anon public** key (a long JWT token)

## Step 3: Update supabase.js

Edit `web/supabase.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';  // Your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI...';  // Your anon key
```

## Step 4: Create the Database Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create liked_songs table
CREATE TABLE IF NOT EXISTS liked_songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    songs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE liked_songs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own liked songs
CREATE POLICY "Users can view own liked songs"
    ON liked_songs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own liked songs
CREATE POLICY "Users can insert own liked songs"
    ON liked_songs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own liked songs
CREATE POLICY "Users can update own liked songs"
    ON liked_songs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own liked songs
CREATE POLICY "Users can delete own liked songs"
    ON liked_songs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id ON liked_songs(user_id);
```

## Step 5: Configure Authentication

1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Optional: Disable "Confirm email" for testing:
   - Go to **Authentication → Settings**
   - Under "Email Auth", toggle off **"Enable email confirmations"**

## Step 6: Test It!

1. Start your backend server:
   ```bash
   cd backend && go run main.go
   ```

2. Open the web app (serve `web/` folder):
   ```bash
   cd web && python3 -m http.server 3000
   ```

3. Open http://localhost:3000

4. Go to **Settings → Sign In**

5. Create an account and sign in

6. Like some songs - they'll sync to the cloud! 🎉

## How It Works

- When you **sign up**, Supabase creates a user account
- When you **like a song**, it saves to:
  1. Local storage (works offline)
  2. Supabase database (syncs across devices)
- When you **sign in on another device**, your liked songs are fetched and merged

## Troubleshooting

### "Supabase not configured" message
- Make sure you updated `web/supabase.js` with your real credentials

### Can't sign in
- Check if email confirmations are enabled (disable for testing)
- Check the browser console for error details

### Songs not syncing
- Check browser console for sync errors
- Make sure the `liked_songs` table exists (Step 4)
- Verify RLS policies are set up correctly

## Free Tier Limits

Supabase free tier includes:
- 50,000 monthly active users
- 500MB database storage
- Unlimited API requests

More than enough for personal use!
