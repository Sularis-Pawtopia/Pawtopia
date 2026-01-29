'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petSchema, type PetFormData } from '@/lib/validations';
import { updatePet, deletePet } from '@/lib/actions/pet.actions';
import { Upload, X, Loader2, PawPrint, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

interface EditPetFormProps {
  pet: any;
  shelterId: string;
}

export function EditPetForm({ pet, shelterId }: EditPetFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(pet.post?.media_urls || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
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
      name: pet.name || '',
      species: pet.species || '',
      breed: pet.breed || '',
      age_years: pet.age_years || 0,
      age_months: pet.age_months || 0,
      gender: pet.gender || 'unknown',
      size: pet.size || 'medium',
      color: pet.color || '',
      weight: pet.weight || 0,
      is_vaccinated: pet.is_vaccinated || false,
      is_spayed_neutered: pet.is_spayed_neutered || false,
      medical_history: pet.medical_history || '',
      temperament: pet.temperament || [],
      good_with_kids: pet.good_with_kids || false,
      good_with_dogs: pet.good_with_dogs || false,
      good_with_cats: pet.good_with_cats || false,
      energy_level: pet.energy_level || 'medium',
      special_needs: pet.special_needs || '',
      adoption_fee: pet.adoption_fee || 0,
      description: pet.post?.description || '',
      tags: pet.post?.tags || [],
    },
  });

  const selectedTemperaments = watch('temperament') || [];

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setNewImages((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

  const uploadNewImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return [];

    setUploadingImages(true);
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    try {
      for (const image of newImages) {
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
        // Upload new images
        const newMediaUrls = await uploadNewImages();
        const allMediaUrls = [...existingImages, ...newMediaUrls];

        // Update pet
        const result = await updatePet(pet.id, data, allMediaUrls);

        if (result.error) {
          setError(result.error);
          return;
        }

        router.push('/shelter');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePet(pet.id);
      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
        return;
      }
      router.push('/shelter');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pet');
      setIsDeleting(false);
    }
  };

  return (
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
          {/* Existing images */}
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className="relative w-24 h-24">
              <img
                src={url}
                alt={`Pet photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* New image previews */}
          {newImagePreviews.map((preview, index) => (
            <div key={`new-${index}`} className="relative w-24 h-24">
              <img
                src={preview}
                alt={`New photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border-2 border-green-500"
              />
              <button
                type="button"
                onClick={() => removeNewImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {existingImages.length + newImages.length < 5 && (
            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewImageChange}
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
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-700 mb-4">
          Danger Zone
        </h2>
        
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Pet Listing
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this pet listing? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Delete Pet
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
          {(isPending || uploadingImages) && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {uploadingImages ? 'Uploading Images...' : isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
