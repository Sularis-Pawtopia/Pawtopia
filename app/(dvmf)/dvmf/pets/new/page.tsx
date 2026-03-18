import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { AddPetForm } from '@/components/shelter/AddPetForm';

export const metadata = {
  title: 'Add Adoptable Pet | Pawtopia',
  description: 'List a new pet for adoption',
};

export default async function AddDvmfPetPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'dvmf') {
    redirect('/dashboard');
  }

  if (!user.is_verified) {
    redirect('/dvmf');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-8">
            <Link
              href="/dvmf/operations"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to DVMF Operations
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Pet</h1>
            <p className="text-gray-600">Fill out the form below to list a new pet for adoption.</p>
          </div>

          <AddPetForm shelterId={user.id} redirectPath="/dvmf/operations" />
        </div>
      </div>
    </div>
  );
}
