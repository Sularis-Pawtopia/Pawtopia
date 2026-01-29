import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getPet } from '@/lib/actions/pet.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { EditPetForm } from '@/components/shelter/EditPetForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Edit Pet | Pawtopia',
  description: 'Edit pet listing details',
};

export default async function EditPetPage({
  params,
}: {
  params: { petId: string };
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (user.role !== 'shelter') {
    redirect('/dashboard');
  }

  const petResult = await getPet(params.petId);
  
  if (petResult.error || !petResult.data) {
    notFound();
  }

  const pet = petResult.data;

  // Check ownership
  if (pet.shelter_id !== user.id) {
    redirect('/shelter');
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
              Edit Pet: {pet.name}
            </h1>
            <p className="text-gray-600">
              Update the pet&apos;s information below
            </p>
          </div>

          {/* Form */}
          <EditPetForm pet={pet} shelterId={user.id} />
        </div>
      </div>
    </div>
  );
}
