# 🚀 Quick Start Guide - Pawtopia Next.js

## Prerequisites
- Node.js 18+ installed
- npm or yarn
- Supabase CLI (for local development)

## 1️⃣ Install Dependencies

```bash
cd pawtopia-next
npm install
```

## 2️⃣ Set Up Supabase

### Option A: Local Development (Recommended)

```bash
# Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# Start local Supabase instance
supabase start

# Note the credentials shown, especially:
# - API URL (usually http://127.0.0.1:54321)
# - anon key
# - service_role key
```

### Option B: Supabase Cloud

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to provision
4. Get credentials from Settings → API

## 3️⃣ Configure Environment

Create `.env.local` in project root:

```bash
# For Local Development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>

# For Production (Supabase Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-cloud-anon-key>
```

## 4️⃣ Import Database Schema

The schema is in `supabase/migrations/database-with-storage.sql`

### For Local Development:
```bash
# Reset database and apply migrations
supabase db reset
```

### For Supabase Cloud:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy contents of `database-with-storage.sql`
5. Run the query

## 5️⃣ Run Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

## 6️⃣ Test the Application

### Create Test Accounts

#### Adopter Account
1. Go to http://localhost:3000/auth/signup
2. Choose "Adopter" role
3. Fill in credentials
4. Complete onboarding at `/onboarding/adopter`
5. Access dashboard at `/dashboard`

#### Shelter Account
1. Sign up with "Shelter" role
2. Complete onboarding at `/onboarding/shelter`
3. Access shelter dashboard at `/shelter`

## 📋 Available Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/auth/login` | Login | No |
| `/auth/signup` | Sign up | No |
| `/pets` | Browse pets | No |
| `/onboarding/adopter` | Adopter setup | Yes |
| `/onboarding/shelter` | Shelter setup | Yes |
| `/dashboard` | Adopter dashboard | Yes (Adopter) |
| `/shelter` | Shelter dashboard | Yes (Shelter) |
| `/profile` | User profile | Yes |

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Start production server
npm start
```

## 🔍 Verify Installation

Run these checks to ensure everything is set up correctly:

```bash
# 1. Type check (should have no errors)
npm run type-check

# 2. Build check (should succeed)
npm run build

# 3. Check Supabase connection
supabase status  # For local dev
```

## ⚡ Quick Database Commands

```bash
# View Supabase status
supabase status

# Stop Supabase
supabase stop

# Reset database (deletes all data!)
supabase db reset

# Generate TypeScript types from database
supabase gen types typescript --local > types/supabase.ts
```

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- Check `.env.local` has correct URL and key
- Verify Supabase is running: `supabase status`
- Restart dev server: `npm run dev`

### "Port 3000 already in use"
- Kill process: `lsof -ti:3000 | xargs kill -9`
- Or Next.js will auto-use port 3001

### Database Schema Errors
- Ensure you ran `supabase db reset`
- Check `database-with-storage.sql` was applied
- Verify migrations: `supabase migration list`

### TypeScript Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Run type check: `npm run type-check`

## 📊 Project Status

✅ **33 TypeScript files** created  
✅ **Zero type errors**  
✅ **Production build successful**  
✅ **All core features implemented**  

## 🎯 Next Actions

1. **Test Authentication**: Create test accounts for both roles
2. **Explore Features**: Try creating pets, posts, adoption requests
3. **Review Code**: Check server actions in `lib/actions/`
4. **Customize**: Update theme colors in `tailwind.config.js`
5. **Deploy**: Follow deployment guide (coming soon)

## 📚 Key Files to Know

- `middleware.ts` - Route protection
- `lib/supabase/` - Database clients
- `lib/actions/` - Server actions (API logic)
- `app/` - All pages and routes
- `components/` - Reusable components
- `types/index.ts` - TypeScript types

## 🎉 You're Ready!

Your Pawtopia Next.js application is now set up and ready for development!

For detailed documentation, see:
- `README.md` - Full project documentation
- `MIGRATION_SUMMARY.md` - Migration details
- `lib/actions/` - Server action examples

---

Need help? Check the inline code comments or refer to:
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
