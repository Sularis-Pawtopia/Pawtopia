import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { AddPetForm } from '@/components/shelter/AddPetForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Add New Pet | Pawtopia',
  description: 'List a new pet for adoption',
};

export default async function AddPetPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (user.role !== 'shelter') {
    redirect('/dashboard');
  }
  
  if (!user.is_verified) {
    redirect('/onboarding/shelter');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/shelter"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Add New Pet
            </h1>
            <p className="text-gray-600">
              Fill out the form below to list a new pet for adoption
            </p>
          </div>

          {/* Form */}
          <AddPetForm shelterId={user.id} />
        </div>
      </div>
    </div>
  );
}
