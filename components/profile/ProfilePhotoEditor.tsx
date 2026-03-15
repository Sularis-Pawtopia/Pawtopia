'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { callApiAction } from '@/lib/api/action-client';

interface ProfilePhotoEditorProps {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePhotoEditor({ profile, isOpen, onClose }: ProfilePhotoEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || '');
  const [coverPreview, setCoverPreview] = useState(profile.cover_photo_url || '');
  
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB max for cover, 5MB for avatar)
    const maxSize = type === 'cover' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const limit = type === 'cover' ? '10MB' : '5MB';
      setError(`Image size must be less than ${limit}`);
      return;
    }

    const preview = URL.createObjectURL(file);
    
    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(preview);
    } else {
      setCoverFile(file);
      setCoverPreview(preview);
    }
    
    setError('');
  };

  const uploadFile = async (file: File, folder: string, bucket: string): Promise<string> => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!avatarFile && !coverFile) {
      setError('Please select at least one photo to update');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const updates: { avatar_url?: string; cover_photo_url?: string } = {};

      if (avatarFile) {
        updates.avatar_url = await uploadFile(avatarFile, `${profile.id}/avatar`, 'profile-avatars');
      }

      if (coverFile) {
        updates.cover_photo_url = await uploadFile(coverFile, `${profile.id}/cover`, 'profile-covers');
      }

      const result = await callApiAction('profile', 'updateUserPhotos', [profile.id, updates]);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Update Profile Photos</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Photos updated successfully!
            </div>
          )}

          <div className="space-y-6">
            {/* Cover Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
              <div className="relative">
                <div 
                  className="h-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => coverRef.current?.click()}
                >
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={coverPreview} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Click to upload cover photo</span>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'cover')}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">Recommended: 1200x300px, under 10MB</p>
              </div>
            </div>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-4 border-white shadow-lg"
                  onClick={() => avatarRef.current?.click()}
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={avatarPreview} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center text-2xl">
                      {profile.role === 'shelter' ? '🏠' : '👤'}
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                  >
                    Change Avatar
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Recommended: 400x400px, under 5MB</p>
                </div>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || (!avatarFile && !coverFile)}
              className="flex-1 bg-primary-500 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : 'Save Photos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}