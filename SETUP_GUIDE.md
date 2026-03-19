# ✅ Pawtopia Next.js Migration - Setup Guide

## 🎯 **What's Been Fixed**

### 1. **Next.js Configuration** ✅
- Converted `next.config.ts` → `next.config.mjs` (Next.js 14.2 doesn't support TS config)
- Fixed CSS `border-border` class error

### 2. **Database Schema** ✅
- Fixed SQL syntax error: `references` → `reference_contacts` (reserved keyword conflict)
- Complete PostgreSQL schema with:
  - ✅ All tables (users, pets, shelters, adoptions, etc.)
  - ✅ Enums (user_role, adoption_status, pet_status, etc.)
  - ✅ Row Level Security (RLS) policies
  - ✅ Indexes for performance
  - ✅ Triggers & Functions
  - ✅ Storage buckets & policies

### 3. **Environment Setup** ✅
- `.env.local` configured with local Supabase credentials
- Using `http://127.0.0.1:54321` (local Supabase instance)

---

## 📋 **Next Steps to Complete the Migration**

### **Step 1: Import Database Schema to Supabase**

**Option A: Using Supabase Dashboard (Recommended)**
1. Open Supabase Studio: `http://127.0.0.1:54323`
2. Go to **SQL Editor**
3. Copy contents from `database-with-storage.sql`
4. Paste and click **RUN**

**Option B: Using Supabase CLI**
```bash
cd /Users/yonken/Projects/pawtopia-migration/pawtopia-next
supabase db reset
# Then manually run the SQL in the dashboard
```

### **Step 2: Configure Storage Buckets**

After running the schema, the storage buckets will be created automatically:
- ✅ `pet-images` (public, 10MB limit)
- ✅ `profile-avatars` (public, 5MB limit)  
- ✅ `event-images` (public, 10MB limit)
- ✅ `documents` (private, 20MB limit)
- ✅ `stories` (public, 10MB limit)

**Verify in Supabase Dashboard:**
- Go to: `http://127.0.0.1:54323` → **Storage**
- You should see all 5 buckets listed

### **Step 3: Start the Development Server**

```bash
cd /Users/yonken/Projects/pawtopia-migration/pawtopia-next
pnpm run dev
```

Visit: `http://localhost:3000`

### **Step 3.1: Configure Maya Sandbox for Healthcare Payments**

Add these variables to `.env.local` for local sandbox checkout and callback testing:

```env
HEALTHCARE_PLATFORM_SERVICE_FEE_PHP=50
NEXT_PUBLIC_HEALTHCARE_PLATFORM_SERVICE_FEE_PHP=50
MAYA_SANDBOX_BASE_URL=https://pg-sandbox.paymaya.com
MAYA_API_KEY=<maya_sandbox_api_key>
MAYA_SECRET_KEY=<maya_sandbox_secret_key>
MAYA_WEBHOOK_SECRET=<maya_webhook_secret>
```

Register your webhook callback URL in Maya sandbox:

- Local with tunnel: `https://<your-tunnel-domain>/api/healthcare/webhooks/maya`
- Validation header expected by backend: `x-maya-signature` (HMAC SHA256)

### **Step 4: Test Authentication Flow**

1. Navigate to `/auth/login` or `/auth/signup`
2. Create a test account
3. Verify user is created in Supabase Dashboard → **Authentication** → **Users**

### **Step 5: Migrate Firebase Data (Optional)**

If you want to migrate existing Firebase data to Supabase:

**Users Migration:**
```sql
-- Export from Firebase, then import to Supabase
INSERT INTO users (id, email, username, role, is_verified)
VALUES (...);
```

**Pets/Posts Migration:**
```sql
-- Convert Firestore documents to PostgreSQL rows
INSERT INTO posts (user_id, post_type, description, media_urls)
VALUES (...);

INSERT INTO pets (post_id, shelter_id, name, species, breed, ...)
VALUES (...);
```

---

## 🗄️ **Database Schema Overview**

### **Core Tables**
- `users` - All users (adopters + shelters)
- `shelter_profiles` - Shelter-specific data
- `adopter_profiles` - Adopter-specific data
- `posts` - Unified post system (pets, events, stories, lost pets)
- `pets` - Adoptable pets
- `lost_pets` - Lost/found pets
- `events` - Shelter events
- `stories` - Success stories
- `adoption_requests` - Adoption applications
- `adoptions` - Completed adoptions
- `comments` - Post comments
- `likes` - Post/comment likes
- `notifications` - User notifications
- `follows` - User follows (shelter following)

### **Storage Buckets**
- `pet-images` - Pet photos (public)
- `profile-avatars` - User avatars (public)
- `event-images` - Event banners (public)
- `documents` - Adoption docs (private)
- `stories` - Success story media (public)

---

## 🔑 **Environment Variables Explained**

```env
# Local Supabase Instance
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# When you deploy to production, update these with:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_anon_key>
# SUPABASE_SERVICE_ROLE_KEY=<production_service_role_key>
```

---

## 🚀 **Production Deployment Checklist**

### **1. Create Supabase Project**
- Go to [supabase.com](https://supabase.com)
- Click **New Project**
- Note your project URL and keys

### **2. Run Schema on Production**
- Copy `database-with-storage.sql`
- Run in Production SQL Editor

### **3. Update Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### **4. Deploy to Vercel/Netlify**
```bash
# Build locally first
pnpm run build

# Deploy to Vercel
vercel --prod

# Or push to GitHub and deploy via Vercel Dashboard
```

### **5. Configure Storage**
- Enable public access for image buckets
- Configure CDN caching
- Set up image transformations (optional)

---

## 📁 **Project Structure**

```
pawtopia-next/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── page.tsx          # Adopter dashboard
│   ├── (shelter)/
│   │   └── shelter/
│   │       └── page.tsx          # Shelter dashboard
│   ├── pets/
│   │   └── page.tsx              # Pet listings
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── providers.tsx              # React Query provider
├── components/
│   ├── forms/
│   │   └── LoginForm.tsx          # Login form component
│   └── ui/                        # Shared UI components
├── lib/
│   ├── actions/
│   │   ├── auth.actions.ts        # Server actions for auth
│   │   ├── pet.actions.ts         # Server actions for pets
│   │   ├── adoption.actions.ts    # Server actions for adoptions
│   │   └── post.actions.ts        # Server actions for posts
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client
│   │   └── middleware.ts          # Middleware helper
│   ├── utils.ts                   # Utility functions
│   └── validations.ts             # Zod schemas
├── types/
│   ├── database.types.ts          # Generated Supabase types
│   └── index.ts                   # Custom types
├── middleware.ts                  # Next.js middleware (auth)
├── database-with-storage.sql      # Complete SQL schema
├── .env.local                     # Local environment variables
└── package.json
```

---

## 🔧 **Troubleshooting**

### **Issue: "Invalid supabaseUrl" Error**
**Solution:** ✅ Already fixed - `.env.local` has been updated with correct local Supabase URL

### **Issue: CSS `border-border` class not found**
**Solution:** ✅ Already fixed - Updated `globals.css` to use standard Tailwind classes

### **Issue: SQL syntax error "references"**
**Solution:** ✅ Already fixed - Renamed field to `reference_contacts`

### **Issue: Supabase not starting**
```bash
# Check if Supabase is running
supabase status

# If not running, start it
supabase start

# If issues persist, reset
supabase stop
supabase start
```

### **Issue: Port conflicts**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

---

## 📊 **Database Diagram**

Check `database-diagram.dbml` for a visual representation of the database schema. You can view it at:
- [dbdiagram.io](https://dbdiagram.io/d) - Paste the DBML content

---

## 🎓 **Migration from Firebase**

### **Authentication**
| Firebase | Supabase |
|----------|----------|
| `firebase.auth()` | `supabase.auth` |
| `signInWithEmailAndPassword` | `supabase.auth.signInWithPassword` |
| `createUserWithEmailAndPassword` | `supabase.auth.signUp` |
| `signOut` | `supabase.auth.signOut` |
| `onAuthStateChanged` | `supabase.auth.onAuthStateChange` |

### **Database**
| Firebase | Supabase |
|----------|----------|
| `db.collection().doc()` | `supabase.from('table').select()` |
| `.add()` | `.insert()` |
| `.update()` | `.update()` |
| `.delete()` | `.delete()` |
| `.where()` | `.eq()`, `.gte()`, `.like()` |

### **Storage**
| Firebase | Supabase |
|----------|----------|
| `storage.ref()` | `supabase.storage.from('bucket')` |
| `.put()` | `.upload()` |
| `.getDownloadURL()` | `.getPublicUrl()` |
| `.delete()` | `.remove()` |

---

## ✅ **Migration Completion Checklist**

- [x] Next.js project setup
- [x] Database schema created
- [x] Environment variables configured
- [x] Storage buckets defined
- [ ] Import SQL schema to Supabase
- [ ] Test authentication flow
- [ ] Create first shelter account
- [ ] Create first adopter account
- [ ] Upload test pet images
- [ ] Create test pet listing
- [ ] Test adoption request flow
- [ ] Verify RLS policies work
- [ ] Test storage uploads
- [ ] Migrate existing Firebase data (if applicable)
- [ ] Deploy to production

---

## 📞 **Support & Resources**

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **React Query Docs:** https://tanstack.com/query/latest
- **Tailwind CSS Docs:** https://tailwindcss.com/docs

---

## 🎉 **You're All Set!**

Your Pawtopia migration is ready to go. The main fixes applied:
1. ✅ Fixed Next.js config (TypeScript → JavaScript)
2. ✅ Fixed SQL syntax error (`references` keyword)
3. ✅ Fixed CSS class error
4. ✅ Configured local Supabase

**Next:** Run the SQL schema in Supabase Dashboard and start building! 🚀
