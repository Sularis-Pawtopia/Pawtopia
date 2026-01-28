# Pawtopia Migration Guide: Firebase → Next.js 14 + Supabase

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Architectural Decisions](#architectural-decisions)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [File Structure](#file-structure)
6. [Migration Steps](#migration-steps)
7. [API Reference](#api-reference)
8. [Deployment Guide](#deployment-guide)

---

## 🏗️ Architecture Overview

### **Tech Stack Comparison**

| Feature | Old Stack (React + Firebase) | New Stack (Next.js + Supabase) |
|---------|------------------------------|--------------------------------|
| **Framework** | React 18 + Vite | Next.js 14 (App Router) |
| **Language** | JavaScript | TypeScript (Strict Mode) |
| **Database** | Firestore (NoSQL) | PostgreSQL (Relational) |
| **Auth** | Firebase Auth | Supabase Auth |
| **Storage** | Firebase Storage | Supabase Storage |
| **State Management** | Context API + SWR | React Query (TanStack) |
| **Routing** | React Router v7 | Next.js App Router |
| **Data Fetching** | Client-side hooks | Server Components + Server Actions |
| **Validation** | Manual | Zod Schemas |
| **Type Safety** | None | Full TypeScript |

---

## 🎯 Architectural Decisions

### **1. Server Components vs Client Components**

**Decision**: Use Server Components by default, Client Components only when needed.

**When to use Server Components:**
- Page layouts and static content
- Data fetching from database
- SEO-important content
- No user interactivity required

**When to use Client Components:**
- Forms with React Hook Form
- Interactive UI (modals, dropdowns)
- State management (useState, useContext)
- Browser APIs (localStorage, geolocation)
- Event handlers (onClick, onChange)

**Example:**
```typescript
// Server Component (default)
// app/pets/page.tsx
export default async function PetsPage() {
  const pets = await getAvailablePets();
  return <PetGrid pets={pets} />;
}

// Client Component (marked with 'use client')
// components/PetForm.tsx
'use client';
export function PetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ... form logic
}
```

---

### **2. Supabase Client Selection**

**Server-side Client** (`lib/supabase/server.ts`):
- Use in Server Components
- Use in Server Actions
- Use in Route Handlers
- Has access to cookies
- Better for authenticated requests

**Browser Client** (`lib/supabase/client.ts`):
- Use in Client Components
- Use in hooks
- Use for real-time subscriptions
- Use when user interaction triggers data change

**Example:**
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server';

export async function getPets() {
  const supabase = await createClient(); // Server client
  return await supabase.from('pets').select('*');
}

// Client Component
'use client';
import { createClient } from '@/lib/supabase/client';

export function usePets() {
  const supabase = createClient(); // Browser client
  // ... use in useEffect, event handlers, etc.
}
```

---

### **3. Data Fetching Strategy**

**Old Pattern (Firebase)**:
```javascript
// Client-side hook
export function useFeedPosts() {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, []);
  
  return posts;
}
```

**New Pattern (Supabase + Next.js)**:
```typescript
// Server Component (for initial load)
export default async function FeedPage() {
  const { data: posts } = await getPosts();
  return <FeedList initialPosts={posts} />;
}

// Client Component (for interactions)
'use client';
import { useQuery } from '@tanstack/react-query';

export function FeedList({ initialPosts }: { initialPosts: Post[] }) {
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: initialPosts,
  });
  
  return <div>{/* render posts */}</div>;
}
```

---

### **4. Authentication Flow**

**Flow Diagram:**
```
User Sign Up → Email Verification → Role Selection
                                          ↓
                              ┌───────────┴───────────┐
                              ↓                       ↓
                        Adopter Onboarding    Shelter Onboarding
                              ↓                       ↓
                      Complete Profile Form   Complete Legitimacy Form
                              ↓                       ↓
                      Upload Documents        Upload License/Documents
                              ↓                       ↓
                      Set is_verified=true    Set is_verified=true
                              ↓                       ↓
                        Adopter Dashboard       Shelter Dashboard
```

**Middleware Protection:**
- Unauthenticated users → Redirect to `/auth/login`
- Unverified users → Redirect to `/onboarding/{role}`
- Verified users → Access granted to dashboards

---

### **5. Database Design Philosophy**

**Firestore (NoSQL) Pattern:**
```
posts/{postId}
  ├── adoptionRequests/{requestId}
  └── comments/{commentId}
      └── replies/{replyId}
```

**PostgreSQL (Relational) Pattern:**
```sql
-- Normalized, relational design
posts (id, user_id, post_type, ...)
pets (id, post_id, shelter_id, ...)
adoption_requests (id, pet_id, adopter_id, ...)
comments (id, post_id, parent_comment_id, ...)
```

**Benefits of Relational:**
- ✅ ACID compliance
- ✅ Complex queries with JOINs
- ✅ Data integrity via foreign keys
- ✅ Better for analytics
- ✅ Row-Level Security (RLS)

---

### **6. Type Safety & Validation**

**Three-Layer Type System:**

1. **Database Types** (`types/database.types.ts`)
   - Auto-generated from Supabase schema
   - Represents raw database structure

2. **Application Types** (`types/index.ts`)
   - Extended types with relations
   - Business logic types

3. **Validation Schemas** (`lib/validations.ts`)
   - Runtime validation with Zod
   - Form data validation

**Example:**
```typescript
// Database type
type UserRow = Database['public']['Tables']['users']['Row'];

// Application type (extended)
interface UserWithProfile extends UserRow {
  shelter_profile?: ShelterProfile;
  adopter_profile?: AdopterProfile;
}

// Validation schema
const userUpdateSchema = z.object({
  username: z.string().min(3),
  bio: z.string().max(500),
});
```

---

### **7. Performance Optimizations**

**1. Server Components for Initial Load**
- Reduces client-side JavaScript
- Faster initial page load
- Better SEO

**2. React Query for Client-side Data**
- Automatic caching
- Background refetching
- Optimistic updates

**3. Image Optimization**
- Next.js Image component
- Automatic WebP conversion
- Lazy loading

**4. Database Indexes**
- All foreign keys indexed
- Common query patterns indexed
- Full-text search on descriptions

**5. Row-Level Security**
- Database-level access control
- No need for API-level checks
- Better security

---

### **8. Storage Strategy**

**Supabase Storage Buckets:**

| Bucket | Public | Purpose | Max Size |
|--------|--------|---------|----------|
| `pet-images` | ✅ Yes | Pet photos | 10MB/file |
| `profile-avatars` | ✅ Yes | User avatars | 2MB/file |
| `event-images` | ✅ Yes | Event photos | 10MB/file |
| `documents` | ❌ No | Legal docs, IDs | 20MB/file |
| `stories` | ✅ Yes | Success stories | 10MB/file |

**Upload Pattern:**
```typescript
// Server Action
export async function uploadPetImages(files: File[]) {
  const supabase = await createClient();
  
  const uploadPromises = files.map(async (file) => {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('pet-images')
      .upload(fileName, file);
    
    return data?.path;
  });
  
  return await Promise.all(uploadPromises);
}
```

---

## 📊 Database Schema

### **Key Tables**

#### **users**
- Core user information
- Role-based (adopter/shelter)
- Verification status

#### **shelter_profiles** / **adopter_profiles**
- Role-specific data
- One-to-one with users

#### **posts**
- Unified table for all post types
- Polymorphic structure

#### **pets**
- Adoptable pets
- Links to posts and shelters

#### **adoption_requests**
- Application submissions
- Status tracking

#### **adoptions**
- Successful adoptions
- Historical record

#### **comments** / **likes**
- Social interactions
- Nested comments support

**See `database.sql` for full schema with RLS policies.**

---

## 🔐 Authentication Flow

### **Sign Up Process**

```typescript
// 1. User submits signup form
const { data, error } = await signUp({
  email: 'user@example.com',
  password: 'password123',
  username: 'johndoe',
  role: 'adopter',
});

// 2. Server Action creates:
// - Auth user (Supabase Auth)
// - User profile (users table)

// 3. Email verification sent

// 4. User redirected to onboarding
```

### **Login Process**

```typescript
// 1. User submits login form
const { error } = await login({
  email: 'user@example.com',
  password: 'password123',
});

// 2. Server checks:
// - Credentials valid?
// - Email verified?
// - Profile completed?

// 3. Redirect based on status:
// - Not verified → /onboarding/{role}
// - Verified → /dashboard or /shelter
```

### **Protected Routes**

**Middleware** (`middleware.ts`):
```typescript
// Runs on every request
// Checks authentication status
// Enforces role-based access
// Redirects unauthenticated users
```

**Protected Paths:**
- `/dashboard` - Adopter dashboard
- `/shelter` - Shelter dashboard
- `/profile` - User profile
- `/onboarding` - Onboarding forms

---

## 📁 File Structure

```
pawtopia-next/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       ├── page.tsx
│   │       └── selection/page.tsx
│   ├── (dashboard)/              # Adopter dashboard group
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── feed/
│   │   │   ├── explore/
│   │   │   ├── find/
│   │   │   └── events/
│   │   └── layout.tsx
│   ├── (shelter)/                # Shelter dashboard group
│   │   ├── shelter/
│   │   │   ├── page.tsx
│   │   │   ├── pets/
│   │   │   ├── applications/
│   │   │   └── analytics/
│   │   └── layout.tsx
│   ├── onboarding/
│   │   ├── adopter/
│   │   │   └── page.tsx
│   │   └── shelter/
│   │       └── page.tsx
│   ├── pets/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── profile/
│   │   ├── [username]/
│   │   │   └── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   ├── api/                      # API Route Handlers
│   │   ├── upload/
│   │   └── webhook/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── feed/
│   │   ├── FeedCard.tsx
│   │   ├── FeedList.tsx
│   │   └── CreatePost.tsx
│   ├── pets/
│   │   ├── PetCard.tsx
│   │   ├── PetGrid.tsx
│   │   ├── PetDetails.tsx
│   │   └── PetForm.tsx
│   ├── forms/
│   │   ├── AdopterOnboardingForm.tsx
│   │   ├── ShelterOnboardingForm.tsx
│   │   ├── AdoptionApplicationForm.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   └── shared/
│       ├── UserAvatar.tsx
│       ├── ImageUploader.tsx
│       ├── LoadingSpinner.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware helper
│   ├── actions/                  # Server Actions
│   │   ├── auth.actions.ts
│   │   ├── onboarding.actions.ts
│   │   ├── pet.actions.ts
│   │   ├── post.actions.ts
│   │   ├── adoption.actions.ts
│   │   ├── comment.actions.ts
│   │   └── ...
│   ├── hooks/                    # Client-side hooks
│   │   ├── useUser.ts
│   │   ├── usePets.ts
│   │   ├── usePosts.ts
│   │   └── ...
│   ├── utils.ts                  # Utility functions
│   ├── validations.ts            # Zod schemas
│   └── constants.ts              # App constants
├── types/
│   ├── database.types.ts         # Generated from Supabase
│   └── index.ts                  # Application types
├── middleware.ts                 # Next.js middleware
├── database.sql                  # Database schema
├── database-diagram.dbml         # dbdiagram.io format
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Migration Steps

### **Step 1: Project Setup**

```bash
# Navigate to the project directory
cd pawtopia-next

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

**Configure `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### **Step 2: Initialize Supabase**

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Save connection credentials

2. **Run Database Schema**
   ```bash
   # In Supabase Dashboard → SQL Editor
   # Copy and run the contents of database.sql
   ```

3. **Set up Storage Buckets**
   ```bash
   # In Supabase Dashboard → Storage
   # Create buckets: pet-images, profile-avatars, event-images, documents, stories
   ```

4. **Configure Storage Policies**
   ```sql
   -- Allow authenticated uploads
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'pet-images');

   -- Allow public reads
   CREATE POLICY "Allow public reads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'pet-images');
   ```

---

### **Step 3: Migrate Authentication**

**User Migration Strategy:**

1. **Export Firebase users**
   ```bash
   # Use Firebase Admin SDK
   firebase auth:export users.json
   ```

2. **Transform data**
   ```typescript
   // Convert Firebase format to Supabase format
   const supabaseUsers = firebaseUsers.map(user => ({
     email: user.email,
     password: user.passwordHash, // Handle password migration
     user_metadata: {
       username: user.displayName,
       role: user.customClaims?.role || 'adopter',
     }
   }));
   ```

3. **Import to Supabase**
   ```typescript
   // Use Supabase Admin API
   for (const user of supabaseUsers) {
     await supabase.auth.admin.createUser(user);
   }
   ```

**Or start fresh:**
- Users re-register
- Send migration email notifications
- Offer incentives for re-registration

---

### **Step 4: Migrate Firestore → PostgreSQL**

**Data Export Script:**
```typescript
// scripts/migrate-firestore.ts
import { initializeApp } from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

async function migrateData() {
  // 1. Export Posts
  const postsSnapshot = await firestore.collection('posts').get();
  
  for (const doc of postsSnapshot.docs) {
    const data = doc.data();
    
    // 2. Transform structure
    const post = {
      id: doc.id,
      user_id: data.userId,
      post_type: mapPostType(data.postType),
      description: data.description,
      media_urls: data.mediaUrls,
      tags: data.tags,
      created_at: data.createdAt.toDate(),
    };
    
    // 3. Insert into Supabase
    await supabase.from('posts').insert(post);
    
    // 4. If adoptable pet, create pet record
    if (data.postType === 'List a Pet') {
      await supabase.from('pets').insert({
        post_id: post.id,
        shelter_id: data.userId,
        name: data.petName,
        // ... map all fields
      });
    }
  }
}
```

**Key Transformations:**

| Firestore | PostgreSQL |
|-----------|-----------|
| `userId` | `user_id` |
| `createdAt` (Timestamp) | `created_at` (timestamptz) |
| `postType: "List a Pet"` | `post_type: 'adoptable'` |
| Subcollections | Foreign keys |
| Document arrays | JSONB columns |

---

### **Step 5: Migrate Firebase Storage → Supabase Storage**

```typescript
// scripts/migrate-storage.ts
import { getStorage } from 'firebase-admin/storage';
import { createClient } from '@supabase/supabase-js';

async function migrateImages() {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles();
  
  for (const file of files) {
    // 1. Download from Firebase
    const [buffer] = await file.download();
    
    // 2. Determine Supabase bucket
    const bucketName = determineBucket(file.name);
    
    // 3. Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(file.name, buffer);
    
    // 4. Update database URLs
    await updateImageUrls(file.name, data.path);
  }
}
```

---

### **Step 6: Convert Components to TypeScript**

**Old Component (JSX):**
```javascript
// components/Feed/FeedCard.jsx
export function FeedCard({ post }) {
  const [liked, setLiked] = useState(false);
  
  const handleLike = async () => {
    await likePost(post.id);
    setLiked(true);
  };
  
  return (
    <div>
      <p>{post.description}</p>
      <button onClick={handleLike}>
        {liked ? 'Liked' : 'Like'}
      </button>
    </div>
  );
}
```

**New Component (TSX):**
```typescript
// components/feed/FeedCard.tsx
'use client';

import { useState } from 'react';
import type { PostWithDetails } from '@/types';
import { likePost } from '@/lib/actions/post.actions';

interface FeedCardProps {
  post: PostWithDetails;
  initialLiked: boolean;
}

export function FeedCard({ post, initialLiked }: FeedCardProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  
  const handleLike = async () => {
    const { error } = await likePost(post.id);
    if (!error) {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    }
  };
  
  return (
    <div className="rounded-lg border p-4">
      <p className="text-gray-700">{post.description}</p>
      <button
        onClick={handleLike}
        className={cn(
          'mt-2 px-4 py-2 rounded',
          liked ? 'bg-red-500 text-white' : 'bg-gray-200'
        )}
      >
        {liked ? 'Liked' : 'Like'} ({likeCount})
      </button>
    </div>
  );
}
```

---

### **Step 7: Implement Protected Routes**

**Middleware** (already created):
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

**Page Protection:**
```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (!user.is_verified) {
    redirect(`/onboarding/${user.role}`);
  }
  
  return <DashboardContent user={user} />;
}
```

---

### **Step 8: Set Up React Query**

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Usage in Components:**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPets } from '@/lib/actions/pet.actions';

export function PetList() {
  const { data: pets, isLoading } = useQuery({
    queryKey: ['pets'],
    queryFn: () => getPets(),
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  return <PetGrid pets={pets} />;
}
```

---

### **Step 9: Implement Row-Level Security (RLS)**

RLS policies are already defined in `database.sql`. Test them:

```typescript
// As adopter
const { data } = await supabase
  .from('pets')
  .select('*');
// ✅ Can see all available pets

// As shelter
const { data } = await supabase
  .from('pets')
  .insert({ ... });
// ✅ Can create pets

// As adopter
const { data } = await supabase
  .from('pets')
  .insert({ ... });
// ❌ Policy violation - adopters can't create pets
```

---

### **Step 10: Quality Assurance**

**Testing Checklist:**

- [ ] User signup with email verification
- [ ] User login and role-based redirect
- [ ] Adopter onboarding form submission
- [ ] Shelter onboarding form submission
- [ ] Create adoptable pet listing
- [ ] Submit adoption application
- [ ] Approve/reject adoption request
- [ ] Post lost pet
- [ ] Create event
- [ ] Share success story
- [ ] Like and comment on posts
- [ ] Search and filter pets
- [ ] Profile editing
- [ ] Image uploads to storage
- [ ] Protected route access
- [ ] RLS policy enforcement

---

## 📚 API Reference

### **Server Actions**

#### **Authentication**
```typescript
signUp(formData: SignUpFormData)
login(formData: LoginFormData)
logout()
getCurrentUser()
updateUserProfile(userId, data)
resetPassword(email)
```

#### **Onboarding**
```typescript
submitAdopterOnboarding(userId, formData, fileUrls)
submitShelterOnboarding(userId, formData, fileUrls)
updateAdopterProfile(profileId, data)
updateShelterProfile(profileId, data)
```

#### **Pets**
```typescript
createPet(shelterId, formData, mediaUrls)
updatePet(petId, formData, mediaUrls)
updatePetStatus(petId, status)
deletePet(petId)
getPet(petId)
getAvailablePets(filters)
getShelterPets(shelterId, status)
searchPets(searchTerm)
```

---

## 🚀 Deployment Guide

### **Vercel Deployment**

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Import repository
   - Add environment variables
   - Deploy

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

---

## ✅ Migration Checklist

### **Pre-Migration**
- [ ] Backup all Firebase data
- [ ] Export user list with emails
- [ ] Document current Firebase rules
- [ ] List all Firebase Storage files
- [ ] Test local development setup

### **Infrastructure**
- [ ] Create Supabase project
- [ ] Run database schema (database.sql)
- [ ] Create storage buckets
- [ ] Configure storage policies
- [ ] Set up environment variables

### **Authentication**
- [ ] Migrate user accounts
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test email verification
- [ ] Test password reset
- [ ] Test role-based redirects

### **Database Migration**
- [ ] Migrate users table
- [ ] Migrate shelter profiles
- [ ] Migrate adopter profiles
- [ ] Migrate posts
- [ ] Migrate pets
- [ ] Migrate adoption requests
- [ ] Migrate adoptions
- [ ] Migrate comments
- [ ] Migrate likes
- [ ] Verify data integrity

### **Storage Migration**
- [ ] Migrate pet images
- [ ] Migrate profile avatars
- [ ] Migrate event images
- [ ] Migrate documents
- [ ] Update image URLs in database
- [ ] Test image uploads
- [ ] Test image access

### **Features**
- [ ] Adopter onboarding
- [ ] Shelter onboarding
- [ ] Create pet listing
- [ ] Adoption application
- [ ] Application approval/rejection
- [ ] Post lost pet
- [ ] Create event
- [ ] Success stories
- [ ] Feed posts
- [ ] Comments
- [ ] Likes
- [ ] Search functionality
- [ ] Filter functionality

### **UI/UX**
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states
- [ ] Error handling
- [ ] Success messages
- [ ] Form validation
- [ ] Image optimization
- [ ] Accessibility (ARIA labels)

### **Performance**
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Database query optimization
- [ ] Image lazy loading
- [ ] Code splitting

### **Security**
- [ ] RLS policies tested
- [ ] API routes protected
- [ ] Server actions validated
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Input sanitization

### **Deployment**
- [ ] Production environment variables
- [ ] Domain configuration
- [ ] SSL certificate
- [ ] CDN setup
- [ ] Error monitoring (Sentry)
- [ ] Analytics (Google Analytics)

### **Post-Migration**
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Create user migration guide
- [ ] Deprecate old Firebase app
- [ ] Announce new version

---

## 🎓 Learning Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query Guide](https://tanstack.com/query/latest/docs/react/overview)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🐛 Troubleshooting

### **Common Issues**

**Issue: "Cannot find module '@supabase/ssr'"**
```bash
# Solution: Install dependencies
npm install @supabase/ssr @supabase/supabase-js
```

**Issue: "Middleware not protecting routes"**
```typescript
// Check middleware.ts config.matcher
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Issue: "RLS policy blocking legitimate access"**
```sql
-- Check policies in Supabase Dashboard
-- Ensure auth.uid() matches user_id in queries
```

---

**This migration guide provides a complete roadmap for transitioning from Firebase to Supabase. Follow the steps sequentially for a smooth migration process.**
