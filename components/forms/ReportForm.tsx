'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  reportFormSchema, 
  type ReportFormValues,
  REPORT_CATEGORIES 
} from '@/lib/validators/expanded.validators';
import { createReport, uploadReportMedia } from '@/lib/actions/report.actions';

interface ReportFormProps {
  isAuthenticated: boolean;
}

export function ReportForm({ isAuthenticated }: ReportFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      is_anonymous: !isAuthenticated,
      animal_count: 1,
      urgency_level: 'normal',
    },
  });

  const isAnonymous = watch('is_anonymous');
  const reportType = watch('report_type');

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setValue('location_lat', latitude);
        setValue('location_lng', longitude);
        setGettingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Unable to get your location. Please enter it manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }

    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isSmallEnough = file.size <= 50 * 1024 * 1024; // 50MB
      return isValid && isSmallEnough;
    });

    setMediaFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove file
  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormValues) => {
    setIsLoading(true);
    setError('');

    try {
      // Upload media files first
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const uploadResult = await uploadReportMedia(file);
        if (uploadResult.success && uploadResult.data) {
          mediaUrls.push(uploadResult.data);
        }
      }

      // Build report data
      const reportData = {
        report_type: data.report_type,
        title: data.title,
        description: data.description,
        is_anonymous: data.is_anonymous,
        address: data.location_address,
        city: data.location_city,
        province: data.location_state,
        barangay: data.location_zip,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        location_notes: data.location_notes,
        animal_type: data.animal_species,
        animal_breed: data.animal_breed,
        animal_color: data.animal_color,
        animal_count: data.animal_count,
        animal_condition: data.animal_condition,
        urgency_level: data.urgency_level,
        reporter_contact_info: data.is_anonymous && (data.contact_email || data.contact_phone) 
          ? { email: data.contact_email, phone: data.contact_phone }
          : null,
      };

      const result = await createReport(reportData, mediaUrls);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/reports/success');
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Submit report error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Report Submitted Successfully
        </h3>
        <p className="text-green-600">
          Thank you for reporting. Your report has been sent to the local animal welfare authorities.
          {!isAnonymous && ' You can track the status of your report in your dashboard.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h4 className="font-medium text-blue-800">Your Privacy Matters</h4>
            <p className="text-sm text-blue-600">
              Reports are sent directly to City Pound (DVMF) authorities only. 
              You can choose to remain anonymous - your identity will not be revealed to anyone.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Anonymous Toggle */}
      <div className="bg-gray-50 rounded-xl p-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-900">Submit Anonymously</span>
            <p className="text-sm text-gray-500 mt-1">
              Your identity will be hidden from the report
            </p>
          </div>
          <input
            type="checkbox"
            {...register('is_anonymous')}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>

        {isAnonymous && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              Optional: Provide contact info if you'd like updates on your report
            </p>
            <div className="grid grid-cols-2 gap-4">
              <input
                {...register('contact_email')}
                type="email"
                placeholder="Email (optional)"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                {...register('contact_phone')}
                type="tel"
                placeholder="Phone (optional)"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Type of Report *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REPORT_CATEGORIES.map((category) => (
            <label
              key={category.value}
              className={`
                p-4 border-2 rounded-xl cursor-pointer transition-all
                ${reportType === category.value 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <input
                type="radio"
                {...register('report_type')}
                value={category.value}
                className="sr-only"
              />
              <span className="font-medium text-gray-900">{category.label}</span>
              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
            </label>
          ))}
        </div>
        {errors.report_type && (
          <p className="mt-1 text-sm text-red-600">{errors.report_type.message}</p>
        )}
      </div>

      {/* Urgency Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urgency Level *
        </label>
        <select
          {...register('urgency_level')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="low">Low - Not urgent, can be addressed when possible</option>
          <option value="normal">Normal - Should be addressed soon</option>
          <option value="high">High - Needs prompt attention</option>
          <option value="critical">Critical - Life-threatening, immediate action needed</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Title *
        </label>
        <input
          {...register('title')}
          type="text"
          placeholder="Brief summary of the incident"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Description *
        </label>
        <textarea
          {...register('description')}
          rows={5}
          placeholder="Please provide as much detail as possible about the situation..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Location Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          📍 Location Information
        </h3>

        <div className="mb-4">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {gettingLocation ? (
              <>
                <span className="animate-spin">⏳</span>
                Getting location...
              </>
            ) : (
              <>
                <span>📍</span>
                Use Current Location
              </>
            )}
          </button>
          {location && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <input
              {...register('location_address')}
              type="text"
              placeholder="Street Address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <input
            {...register('location_city')}
            type="text"
            placeholder="City"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <input
            {...register('location_state')}
            type="text"
            placeholder="State/Province"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <input
            {...register('location_zip')}
            type="text"
            placeholder="ZIP/Postal Code"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            {...register('location_notes')}
            placeholder="Additional location details (landmarks, directions, etc.)"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            rows={2}
          />
        </div>
      </div>

      {/* Animal Details */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          🐾 Animal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Species</label>
            <select
              {...register('animal_species')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="horse">Horse</option>
              <option value="livestock">Livestock</option>
              <option value="wildlife">Wildlife</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Breed (if known)</label>
            <input
              {...register('animal_breed')}
              type="text"
              placeholder="Breed"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Color/Markings</label>
            <input
              {...register('animal_color')}
              type="text"
              placeholder="Color description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Number of Animals</label>
            <input
              {...register('animal_count', { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Condition/Symptoms</label>
            <input
              {...register('animal_condition')}
              type="text"
              placeholder="Describe the animal's condition"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos/Videos (Optional but helpful)
        </label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-4xl mb-2">📷</div>
          <p className="text-gray-600">Click to upload photos or videos</p>
          <p className="text-sm text-gray-400">Max 5 files, 50MB each</p>
        </div>

        {mediaPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-red-600 text-white py-4 rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Submitting Report...' : 'Submit Report'}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        By submitting this report, you confirm that the information provided is accurate 
        to the best of your knowledge. False reports may be subject to legal action.
      </p>
    </form>
  );
}
