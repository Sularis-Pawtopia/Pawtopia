'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petSchema, type PetFormData } from '@/lib/validations';
import { callApiAction } from '@/lib/api/action-client';
import { Upload, X, PawPrint } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/ui/notify';
import { PageLoaderOverlay } from '@/components/ui/PageLoaderOverlay';

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'guinea_pig', label: 'Guinea Pig' },
  { value: 'other', label: 'Other' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small (0-10 kg)' },
  { value: 'medium', label: 'Medium (10-25 kg)' },
  { value: 'large', label: 'Large (25-45 kg)' },
  { value: 'extra_large', label: 'Extra Large (45+ kg)' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unknown', label: 'Unknown' },
];

const ENERGY_OPTIONS = [
  { value: 'low', label: 'Low - Couch potato' },
  { value: 'medium', label: 'Medium - Balanced' },
  { value: 'high', label: 'High - Very active' },
];

const TEMPERAMENT_OPTIONS = [
  'Friendly',
  'Playful',
  'Calm',
  'Energetic',
  'Shy',
  'Affectionate',
  'Independent',
  'Loyal',
  'Protective',
  'Curious',
  'Gentle',
  'Social',
];

interface AddPetFormProps {
  shelterId: string;
  redirectPath?: string;
}

export function AddPetForm({ shelterId, redirectPath = '/shelter/operations' }: AddPetFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      is_vaccinated: false,
      is_spayed_neutered: false,
      good_with_kids: false,
      good_with_dogs: false,
      good_with_cats: false,
      temperament: [],
      tags: [],
    },
  });

  const selectedTemperaments = watch('temperament') || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      const message = 'Maximum 5 images allowed';
      setError(message);
      notify.error({ title: 'Too many images', description: message });
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTemperament = (temp: string) => {
    const current = selectedTemperaments;
    if (current.includes(temp)) {
      setValue(
        'temperament',
        current.filter((t) => t !== temp)
      );
    } else {
      setValue('temperament', [...current, temp]);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploadingImages(true);
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    try {
      for (const image of images) {
        const fileName = `${shelterId}/${Date.now()}-${image.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('pet-images')
          .upload(fileName, image);

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('pet-images').getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  };

  const onSubmit = (data: PetFormData) => {
    setError(null);

    startTransition(async () => {
      try {
        // Upload images first
        const mediaUrls = await uploadImages();

        // Create pet
        const result = await callApiAction('pets', 'createPet', [data, mediaUrls]);

        if (result.error) {
          setError(result.error);
          notify.error({ title: 'Create pet failed', description: result.error });
          return;
        }

        notify.success({ title: 'Pet listing created' });
        router.push(redirectPath);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        notify.error({ title: 'Create pet failed', description: message });
      }
    });
  };

  return (
    <>
      {(isPending || uploadingImages) && <PageLoaderOverlay label={uploadingImages ? 'Uploading pet photos...' : 'Creating pet listing...'} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-green-600" />
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pet Name *
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Buddy"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Species *
            </label>
            <select
              {...register('species')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select species</option>
              {SPECIES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.species && (
              <p className="text-red-500 text-sm mt-1">{errors.species.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Breed
            </label>
            <input
              type="text"
              {...register('breed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Golden Retriever"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              {...register('color')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Golden, Black & White"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min="0"
                {...register('age_years')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age (Months)
              </label>
              <input
                type="number"
                min="0"
                max="11"
                {...register('age_months')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              {...register('weight')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <select
              {...register('gender')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size *
            </label>
            <select
              {...register('size')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select size</option>
              {SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.size && (
              <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Photos (up to 5)
        </h2>

        <div className="flex flex-wrap gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative w-24 h-24">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Health Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Health Information
        </h2>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_vaccinated')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Vaccinated</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_spayed_neutered')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Spayed/Neutered</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical History
            </label>
            <textarea
              {...register('medical_history')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Any medical conditions, allergies, or treatments..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Needs
            </label>
            <textarea
              {...register('special_needs')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Any special care requirements..."
            />
          </div>
        </div>
      </div>

      {/* Personality & Behavior */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Personality & Behavior
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperament * (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPERAMENT_OPTIONS.map((temp) => (
                <button
                  key={temp}
                  type="button"
                  onClick={() => toggleTemperament(temp)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedTemperaments.includes(temp)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {temp}
                </button>
              ))}
            </div>
            {errors.temperament && (
              <p className="text-red-500 text-sm mt-1">
                {errors.temperament.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Energy Level *
            </label>
            <select
              {...register('energy_level')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select energy level</option>
              {ENERGY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.energy_level && (
              <p className="text-red-500 text-sm mt-1">
                {errors.energy_level.message}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('good_with_kids')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Good with Kids</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('good_with_dogs')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Good with Dogs</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('good_with_cats')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Good with Cats</span>
            </label>
          </div>
        </div>
      </div>

      {/* Description & Adoption */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Description & Adoption Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Tell potential adopters about this pet's story, personality, and what makes them special..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adoption Fee (PHP)
            </label>
            <input
              type="number"
              min="0"
              {...register('adoption_fee')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0 for free adoption"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || uploadingImages}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploadingImages ? 'Uploading Images...' : isPending ? 'Creating Pet...' : 'Add Pet'}
        </button>
      </div>
      </form>
    </>
  );
}
