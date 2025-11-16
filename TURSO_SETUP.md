# Turso Database Setup Instructions

## Overview
The FREAK newsletter system has been updated to use **Turso** - a cloud-hosted SQLite database. This ensures newsletter subscriptions persist even when the app is redeployed on Vercel.

## Why Turso?
- **Free Tier**: 3 databases, 8GB storage, perfect for small projects
- **Persistent Storage**: Unlike Vercel's ephemeral filesystem, Turso keeps data between deployments
- **LibSQL**: SQLite-compatible API, easy migration from local SQLite
- **Reliable**: Managed database service by Turso

## Setup Steps

### Step 1: Create Turso Account
1. Go to https://turso.tech
2. Sign up (you already have: `teddywop02-png` organization)
3. Log in to your dashboard

### Step 2: Create Database
1. In Turso dashboard, click "Create Database"
2. Name it: `freak-newsletter`
3. Select region closest to you (or default)
4. Click "Create"

### Step 3: Get Database URL
1. After creation, click on the database
2. Look for the **Primary URL** (starts with `libsql://`)
3. Copy the full URL (should look like: `libsql://freak-newsletter-teddywop02-png.turso.tech`)

### Step 4: Update .env File
Open `.env` and update:

```
TURSO_API_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJYSFh4YzhMbkVmQ0tma0tHcU93SnFRIn0.A5XmgRLDcuVYFvYbXkkGHoTmqxPJtVKQb1GZL1hwULAkaQ1kFIIXLpTlTaF7BsilGmfurn6Mouysa6-FvGbBCg
TURSO_DB_URL=libsql://freak-newsletter-teddywop02-png.turso.tech
```

**Replace `TURSO_DB_URL` with your actual database URL from Step 3**

### Step 5: Test Locally
1. Restart the server: `npm start`
2. Check console for: `Connected to Turso database`
3. Submit a test email at `localhost:3001`
4. Check console for success message

### Step 6: Deploy to Vercel
1. Commit and push changes:
```bash
git add .
git commit -m "Migrate newsletter to Turso cloud database"
git push
```

2. In Vercel dashboard:
   - Go to your FREAK project
   - Settings → Environment Variables
   - Add two new variables:
     - `TURSO_API_TOKEN`: (paste from .env)
     - `TURSO_DB_URL`: (paste your database URL)
   - Save

3. Vercel will auto-redeploy
4. Test live newsletter form

## Troubleshooting

### "SERVER_ERROR: HTTP 401"
- Database URL is wrong or database doesn't exist
- Verify database exists in Turso dashboard
- Check `.env` has correct URL format

### "UNIQUE constraint failed"
- Email already subscribed
- This is expected behavior

### Newsletter service temporarily unavailable
- Turso hasn't initialized yet
- Check TURSO_DB_URL is set in `.env`
- Restart server

## Database Schema
The newsletter table is auto-created with:
```sql
CREATE TABLE newsletter_subs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Key Changes in Code
- **server.js**: Replaced sqlite3 calls with Turso async/await
- **Newsletter endpoints**: 
  - POST `/api/newsletter` - Subscribe
  - GET `/api/admin/newsletter-subscribers` - List all
- Both endpoints gracefully handle Turso initialization

## Migration Complete ✓
The server now:
1. Attempts Turso connection on startup
2. Falls back gracefully if Turso unavailable
3. Uses persistent cloud database for newsletter
4. Ready for production deployment
