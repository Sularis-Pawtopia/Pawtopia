'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adoptionApplicationSchema, type AdoptionApplicationFormData } from '@/lib/validations';
import { callApiAction } from '@/lib/api/action-client';
import { Heart, Loader2, X } from 'lucide-react';

interface AdoptionApplicationButtonProps {
  petId: string;
  petName: string;
}

export function AdoptionApplicationButton({ petId, petName }: AdoptionApplicationButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdoptionApplicationFormData>({
    resolver: zodResolver(adoptionApplicationSchema),
  });

  const onSubmit = (data: AdoptionApplicationFormData) => {
    setError(null);

    startTransition(async () => {
      const result = await callApiAction('adoption', 'createAdoptionRequest', [petId, data]);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        reset();
        router.refresh();
      }, 2000);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        <Heart className="w-5 h-5" />
        Apply to Adopt {petName}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Adoption Application for {petName}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Application Submitted!
                  </h3>
                  <p className="text-gray-600">
                    The shelter will review your application and contact you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                    Please answer the following questions honestly. Your responses will help 
                    the shelter determine if you&apos;re a good match for {petName}.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Why do you want to adopt this pet? *
                    </label>
                    <textarea
                      {...register('why_adopt')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Tell us why you want to adopt this pet and what drew you to them..."
                    />
                    {errors.why_adopt && (
                      <p className="text-red-500 text-sm mt-1">{errors.why_adopt.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous pet experience *
                    </label>
                    <textarea
                      {...register('previous_pet_experience')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe your experience with pets..."
                    />
                    {errors.previous_pet_experience && (
                      <p className="text-red-500 text-sm mt-1">{errors.previous_pet_experience.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current pets *
                    </label>
                    <textarea
                      {...register('current_pets')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="List any current pets or write 'None'..."
                    />
                    {errors.current_pets && (
                      <p className="text-red-500 text-sm mt-1">{errors.current_pets.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Household members *
                    </label>
                    <textarea
                      {...register('household_members')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe who lives in your household (adults, children, ages)..."
                    />
                    {errors.household_members && (
                      <p className="text-red-500 text-sm mt-1">{errors.household_members.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work schedule *
                    </label>
                    <textarea
                      {...register('work_schedule')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe your typical work schedule and hours away from home..."
                    />
                    {errors.work_schedule && (
                      <p className="text-red-500 text-sm mt-1">{errors.work_schedule.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pet care plan *
                    </label>
                    <textarea
                      {...register('pet_care_plan')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="How will you care for this pet? Include feeding, exercise, veterinary care, etc..."
                    />
                    {errors.pet_care_plan && (
                      <p className="text-red-500 text-sm mt-1">{errors.pet_care_plan.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency plan *
                    </label>
                    <textarea
                      {...register('emergency_plan')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="What's your plan if you can no longer care for the pet?"
                    />
                    {errors.emergency_plan && (
                      <p className="text-red-500 text-sm mt-1">{errors.emergency_plan.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Veterinarian information (optional)
                    </label>
                    <input
                      type="text"
                      {...register('veterinarian_info')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Name and contact of your vet, if you have one..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional notes (optional)
                    </label>
                    <textarea
                      {...register('additional_notes')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Anything else you'd like the shelter to know..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Submit Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
