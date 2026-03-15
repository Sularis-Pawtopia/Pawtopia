# Pawtopia - Next.js 14 + Supabase Migration

> **Professional-grade pet adoption platform** built with Next.js 14, TypeScript, Supabase (PostgreSQL), and TailwindCSS.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architectural Decisions](#architectural-decisions)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Migration from Firebase](#migration-from-firebase)

---

## 🌟 Overview

Pawtopia is a full-stack pet adoption platform that connects animal shelters with potential adopters. This is a complete rewrite/migration from the original React + Firebase version to a modern, scalable architecture using:

- **Next.js 14** with App Router for optimal performance
- **TypeScript** with strict mode for type safety
- **Supabase** (PostgreSQL) for relational database with RLS
- **Server Actions** for backend logic
- **React Query** for client-side data management
- **Zod** for runtime validation

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: TailwindCSS 3.4
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components with Tailwind
- **Icons**: Lucide React
- **Animations**: Framer Motion

### **Backend**
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **API**: Next.js Route Handlers (`app/api/*`) + Server Services
- **Validation**: Zod schemas

### **DevOps**
- **Hosting**: Vercel (recommended)
- **Database**: Supabase Cloud
- **Version Control**: Git
- **Package Manager**: npm

---

## ✨ Key Features

### **For Adopters**
- ✅ Browse available pets with advanced filters
- ✅ Submit adoption applications
- ✅ Track application status
- ✅ View adoption history
- ✅ Post lost pets
- ✅ Social feed with likes/comments
- ✅ Follow favorite shelters

### **For Shelters**
- ✅ Manage pet listings (CRUD)
- ✅ Review adoption applications
- ✅ Approve/reject applications
- ✅ Complete adoption process
- ✅ Analytics dashboard
- ✅ Event management
- ✅ Success stories

### **Common Features**
- ✅ Role-based authentication
- ✅ Email verification
- ✅ Profile management
- ✅ Image uploads
- ✅ Real-time updates
- ✅ Responsive design
- ✅ SEO optimized

---

## 📁 Project Structure

```
pawtopia-next/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Adopter dashboard (route group)
│   │   ├── dashboard/
│   │   │   ├── feed/
│   │   │   ├── explore/
│   │   │   └── events/
│   │   └── layout.tsx
│   ├── (shelter)/                # Shelter dashboard (route group)
│   │   ├── shelter/
│   │   │   ├── pets/
│   │   │   ├── applications/
│   │   │   └── analytics/
│   │   └── layout.tsx
│   ├── onboarding/               # Onboarding flows
│   │   ├── adopter/
│   │   └── shelter/
│   ├── pets/                     # Pet browsing/details
│   │   ├── [id]/
│   │   └── page.tsx
│   ├── profile/                  # User profiles
│   │   └── [username]/
│   ├── api/                      # API routes (if needed)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── providers.tsx             # Client providers
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── forms/                    # Form components
│   ├── feed/                     # Feed-related components
│   ├── pets/                     # Pet-related components
│   ├── shelter/                  # Shelter-specific components
│   └── layout/                   # Layout components
│
├── lib/                          # Core utilities
│   ├── supabase/                 # Supabase clients
│   ├── server/                   # Server-only services and API utilities
│   │   ├── services/             # Domain services (shared by actions/routes)
│   │   └── api/                  # API route helpers
│   ├── api/                      # Frontend API client helpers

---

## API Layer Standard

The codebase now supports a consistent API-first pattern for all existing domains.

- Domain action endpoints live under `app/api/<domain>/actions/route.ts`
- Shared request contract:

```json
{
  "action": "createEvent",
  "args": [
    {
      "event_name": "Community Drive"
    }
  ]
}
```

- Frontend helper: `lib/api/action-client.ts`

Example:

```ts
import { callApiAction } from '@/lib/api/action-client';

const result = await callApiAction('events', 'createEvent', [payload]);
```

Current domains exposed:
- `auth`, `adoption`, `dvmf`, `events`, `explore`, `lost-pets`, `onboarding`, `pets`, `posts`, `profile`, `reports`, `roles`, `store`, `stories`, `volunteer`

This gives a clear separation between frontend components and backend process logic while preserving current feature behavior.
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware helper
│   ├── actions/                  # Server Actions
│   │   ├── auth.actions.ts
│   │   ├── pet.actions.ts
│   │   ├── post.actions.ts
│   │   ├── adoption.actions.ts
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── utils.ts                  # Utility functions
│   ├── validations.ts            # Zod schemas
│   └── constants.ts              # App constants
│
├── types/                        # TypeScript types
│   ├── database.types.ts         # Generated from Supabase
│   └── index.ts                  # Application types
│
├── middleware.ts                 # Next.js middleware (auth)
├── database.sql                  # PostgreSQL schema
├── database-diagram.dbml         # Database diagram
├── MIGRATION_GUIDE.md            # Detailed migration guide
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pawtopia-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Go to SQL Editor
   - Run the contents of `database.sql`
   - Create storage buckets (see MIGRATION_GUIDE.md)

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Architectural Decisions

### **1. Server Components First**

**Decision**: Use Server Components by default, Client Components only when necessary.

**Rationale**:
- ✅ Smaller JavaScript bundle
- ✅ Better SEO
- ✅ Faster initial page load
- ✅ Direct database access
- ✅ Automatic code splitting

**Implementation**:
```typescript
// Server Component (default) - No 'use client'
export default async function PetsPage() {
  const pets = await getAvailablePets(); // Server Action
  return <PetGrid pets={pets} />;
}

// Client Component - Marked with 'use client'
'use client';
export function PetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Interactive logic here
}
```

---

### **2. Server Actions vs API Routes**

**Decision**: Prefer Server Actions over API Routes.

**Rationale**:
- ✅ Type-safe by default
- ✅ No need to define routes manually
- ✅ Automatic serialization
- ✅ Better developer experience
- ✅ Integrated with forms

**When to use API Routes**:
- Webhooks from external services
- Non-form POST requests
- Third-party integrations

---

### **3. Database: PostgreSQL vs NoSQL**

**Decision**: Use PostgreSQL (Supabase) instead of Firestore.

**Comparison**:

| Feature | Firestore (NoSQL) | PostgreSQL (Supabase) |
|---------|-------------------|----------------------|
| **Data Model** | Document-based | Relational |
| **Queries** | Limited joins | Full SQL support |
| **Transactions** | Limited | ACID compliant |
| **Relationships** | Manual via subcollections | Foreign keys |
| **Analytics** | Difficult | Built-in aggregations |
| **Type Safety** | Weak | Strong with generated types |
| **Security** | Security Rules | Row-Level Security (RLS) |

**Winner**: PostgreSQL for scalability and complex queries.

---

### **4. Authentication Strategy**

**Decision**: Use Supabase Auth with middleware-based protection.

**Flow**:
```
User Sign Up
  ↓
Email Verification
  ↓
Role Selection (Adopter/Shelter)
  ↓
Onboarding Form
  ↓
Profile Complete → Dashboard Access
```

**Middleware Protection**:
- Checks auth status on every request
- Redirects unauthenticated users
- Enforces role-based access
- Handles onboarding flow

---

### **5. Data Fetching Pattern**

**Old Pattern** (Firebase):
```javascript
// Client-side only
const [posts, setPosts] = useState([]);
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    setPosts(snapshot.docs.map(doc => doc.data()));
  });
  return unsubscribe;
}, []);
```

**New Pattern** (Next.js + Supabase):
```typescript
// Server Component (initial load)
export default async function FeedPage() {
  const { data: posts } = await getFeedPosts();
  return <FeedList initialPosts={posts} />;
}

// Client Component (interactions)
'use client';
export function FeedList({ initialPosts }) {
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: initialPosts, // No loading state on mount!
  });
}
```

**Benefits**:
- ✅ Instant initial render (no loading spinner)
- ✅ SEO-friendly
- ✅ Automatic caching with React Query
- ✅ Optimistic updates

---

### **6. Type Safety Strategy**

**Three-Layer Type System**:

1. **Database Types** (Auto-generated from Supabase schema)
   ```typescript
   // types/database.types.ts
   type UserRow = Database['public']['Tables']['users']['Row'];
   ```

2. **Application Types** (Extended with relations)
   ```typescript
   // types/index.ts
   interface UserWithProfile extends UserRow {
     shelter_profile?: ShelterProfile;
   }
   ```

3. **Validation Schemas** (Runtime validation)
   ```typescript
   // lib/validations.ts
   const loginSchema = z.object({
     email: z.string().email(),
     password: z.string().min(6),
   });
   ```

---

### **7. File Upload Strategy**

**Decision**: Use Supabase Storage with separate buckets.

**Buckets**:
- `pet-images` (public) - Pet photos
- `profile-avatars` (public) - User avatars
- `event-images` (public) - Event photos
- `documents` (private) - Legal documents, IDs
- `stories` (public) - Success story media

**Upload Pattern**:
```typescript
// Server Action
export async function uploadPetImages(files: File[]) {
  const supabase = await createClient();
  
  const urls = await Promise.all(
    files.map(async (file) => {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { data } = await supabase.storage
        .from('pet-images')
        .upload(path, file);
      
      return supabase.storage
        .from('pet-images')
        .getPublicUrl(data.path).data.publicUrl;
    })
  );
  
  return urls;
}
```

---

### **8. Error Handling**

**Consistent Pattern**:
```typescript
// Server Action
export async function createPet(data: PetFormData) {
  try {
    const { error } = await supabase.from('pets').insert(data);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
}

// Client Component
const handleSubmit = async (data) => {
  const result = await createPet(data);
  if (result.error) {
    toast.error(result.error);
  } else {
    toast.success('Pet created successfully!');
    router.push('/shelter');
  }
};
```

---

## 🗄️ Database Schema

### **Core Tables**

#### **users**
- Primary user information
- Role-based (`adopter` | `shelter`)
- Verification status
- Contact information

#### **shelter_profiles** / **adopter_profiles**
- Role-specific extended information
- One-to-one relationship with `users`
- Contains verification documents

#### **posts**
- Unified table for all post types
- Supports: adoptable pets, lost pets, events, stories, feed posts
- Polymorphic structure

#### **pets**
- Adoptable pets information
- Links to `posts` (one-to-one)
- Detailed pet attributes (breed, age, temperament, etc.)

#### **adoption_requests**
- Application submissions
- Status tracking (pending, approved, rejected, completed)
- Stores application questionnaire data

#### **adoptions**
- Successful adoption records
- Historical data
- Contract and payment information

### **Relationships**

```
users (1) → (many) posts
users (1) → (many) pets
users (1) → (1) shelter_profile | adopter_profile

pets (1) → (1) post
pets (1) → (many) adoption_requests
adoption_requests (1) → (1) adoption (when completed)

posts (1) → (many) comments
posts (1) → (many) likes
comments (1) → (many) comments (replies)
```

**See `database.sql` and `database-diagram.dbml` for complete schema.**

---

## 🔐 Authentication

### **Sign Up Flow**

1. User submits signup form (email, password, username, role)
2. Server Action creates:
   - Supabase Auth user
   - User record in `users` table
3. Email verification sent
4. User redirected to onboarding based on role

### **Login Flow**

1. User submits credentials
2. Server Action authenticates via Supabase
3. Check verification status:
   - Not verified → Redirect to onboarding
   - Verified → Redirect to dashboard (role-based)

### **Protected Routes**

Handled by `middleware.ts`:
- Checks authentication on every request
- Validates session
- Enforces role-based access
- Redirects unauthenticated users to `/auth/login`

---

## 🚢 Deployment

### **Vercel (Recommended)**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
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

### **Alternative: Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔄 Migration from Firebase

### **Data Migration Steps**

1. **Export Firebase Data**
   ```bash
   firebase firestore:export ./firestore-backup
   ```

2. **Transform Data**
   - Convert document structure to relational
   - Map field names (camelCase → snake_case)
   - Transform timestamps

3. **Import to Supabase**
   - Use migration scripts
   - Bulk insert with transactions
   - Verify data integrity

### **Key Transformations**

| Firebase | Supabase (PostgreSQL) |
|----------|----------------------|
| `userId` | `user_id` |
| `createdAt` (Timestamp) | `created_at` (timestamptz) |
| `postType: "List a Pet"` | `post_type: 'adoptable'` |
| Subcollections | Foreign keys + JOIN queries |
| Arrays in documents | JSONB columns or separate tables |

**See `MIGRATION_GUIDE.md` for complete migration instructions.**

---

## 📚 Documentation

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Comprehensive migration guide
- **[database.sql](./database.sql)** - Complete PostgreSQL schema with RLS
- **[database-diagram.dbml](./database-diagram.dbml)** - Database diagram (dbdiagram.io)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Original Pawtopia** - React + Firebase version
- **Next.js Team** - Amazing framework
- **Supabase** - Firebase alternative
- **Vercel** - Deployment platform

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for animals and their future families**
