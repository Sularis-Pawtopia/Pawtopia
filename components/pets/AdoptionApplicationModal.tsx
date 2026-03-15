'use client';

import { useState, useTransition } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { callApiAction } from '@/lib/api/action-client';

interface AdoptionApplicationModalProps {
  petId: string;
  petName: string;
  shelterName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const applicationQuestions = [
  {
    key: 'why_adopt',
    label: 'Why do you want to adopt this pet?',
    type: 'textarea' as const,
    required: true,
    placeholder: 'Tell us about your motivation for adopting...',
  },
  {
    key: 'living_situation',
    label: 'Describe your living situation',
    type: 'textarea' as const,
    required: true,
    placeholder: 'House/apartment, yard, fenced area, etc.',
  },
  {
    key: 'previous_experience',
    label: 'Do you have previous experience with pets?',
    type: 'textarea' as const,
    required: true,
    placeholder: 'Tell us about your experience caring for animals...',
  },
  {
    key: 'other_pets',
    label: 'Do you currently have other pets? If yes, please describe.',
    type: 'textarea' as const,
    required: false,
    placeholder: 'Type, breed, age of current pets...',
  },
  {
    key: 'household_members',
    label: 'Who lives in your household?',
    type: 'textarea' as const,
    required: true,
    placeholder: 'Number of adults, children, ages...',
  },
  {
    key: 'daily_schedule',
    label: 'What is your daily schedule like? How much time at home?',
    type: 'textarea' as const,
    required: true,
    placeholder: 'Work schedule, time available for the pet...',
  },
  {
    key: 'veterinarian',
    label: 'Do you have a veterinarian? If yes, provide details.',
    type: 'text' as const,
    required: false,
    placeholder: 'Vet name, clinic, phone number',
  },
  {
    key: 'additional_notes',
    label: 'Anything else you\'d like us to know?',
    type: 'textarea' as const,
    required: false,
    placeholder: 'Additional information to support your application...',
  },
];

export function AdoptionApplicationModal({ petId, petName, shelterName, onClose, onSuccess }: AdoptionApplicationModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const missing = applicationQuestions
      .filter((q) => q.required && !formData[q.key]?.trim())
      .map((q) => q.label);
    
    if (missing.length > 0) {
      setError(`Please fill in the required fields: ${missing.join(', ')}`);
      return false;
    }
    setError(null);
    return true;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await callApiAction('adoption', 'createAdoptionRequest', [petId, formData]);
      if (result.error) {
        setError(result.error);
        setStep('form');
      } else {
        onSuccess();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'form' ? 'Adoption Application' : 'Confirm Your Application'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'form' 
                ? `Apply to adopt ${petName}${shelterName ? ` from ${shelterName}` : ''}`
                : 'Review your answers before submitting'
              }
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        {step === 'form' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {applicationQuestions.map((q) => (
                <div key={q.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {q.label}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {q.type === 'textarea' ? (
                    <textarea
                      value={formData[q.key] || ''}
                      onChange={(e) => handleChange(q.key, e.target.value)}
                      placeholder={q.placeholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[q.key] || ''}
                      onChange={(e) => handleChange(q.key, e.target.value)}
                      placeholder={q.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
              >
                Review Application
              </button>
            </div>
          </>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Please review your application carefully.</strong> Once submitted, you cannot edit your responses. 
                The shelter will review your application and update the status.
              </div>

              {applicationQuestions.map((q) => {
                const answer = formData[q.key];
                if (!answer?.trim()) return null;
                return (
                  <div key={q.key} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {q.label}
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{answer}</p>
                  </div>
                );
              })}
            </div>

            {/* Confirm Actions */}
            <div className="p-6 border-t border-gray-100 flex justify-between flex-shrink-0">
              <button
                onClick={() => setStep('form')}
                disabled={isPending}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
