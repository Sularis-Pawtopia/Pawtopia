'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { callApiAction } from '@/lib/api/action-client';
import { toVerificationDocumentUrl } from '@/lib/storage/verification-documents';

type PolicyOption = 'yes' | 'no' | 'sometimes' | '';

const PROMPTED_OPTIONS = ['Friends', 'SocialMedia', 'Website', 'Other'] as const;
const ANIMAL_TYPES = [
  { value: 'dogs', label: 'Dogs' },
  { value: 'cats', label: 'Cats' },
  { value: 'dogs-cats', label: 'Dogs & Cats' },
] as const;
const TIME_OPTIONS = [
  '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM', '2:30 AM',
  '3:00 AM', '3:30 AM', '4:00 AM', '4:30 AM', '5:00 AM', '5:30 AM',
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
] as const;

interface ShelterEditFormProps {
  profile: any;
  onCancel: () => void;
  onSaved: () => void;
}

export function ShelterEditForm({ profile, onCancel, onSaved }: ShelterEditFormProps) {
  const router = useRouter();
  const p = profile.profile || {};
  const operatingHours = p.operating_hours || {};
  const socialMedia = p.social_media || {};

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Shelter info
  const [shelterName, setShelterName] = useState(p.shelter_name || '');
  const [description, setDescription] = useState(p.description || '');
  const [yearEstablished, setYearEstablished] = useState(p.year_established?.toString() || '');
  const [registrationNumber, setRegistrationNumber] = useState(p.registration_number || '');
  const [capacity, setCapacity] = useState(p.capacity?.toString() || '');
  const [typeOfAnimals, setTypeOfAnimals] = useState(p.type_of_animals || '');
  const [areasCovered, setAreasCovered] = useState(p.areas_covered || '');

  // Contact
  const [contactFirstName, setContactFirstName] = useState(p.contact_first_name || '');
  const [contactLastName, setContactLastName] = useState(p.contact_last_name || '');
  const [contactMI, setContactMI] = useState(p.contact_mi || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [website, setWebsite] = useState(p.website || '');

  // Social media
  const [facebook, setFacebook] = useState(socialMedia.facebook || '');
  const [instagram, setInstagram] = useState(socialMedia.instagram || '');
  const [twitter, setTwitter] = useState(socialMedia.twitter || '');

  // Hours
  const [openingHours, setOpeningHours] = useState(operatingHours.open || '');
  const [closingHours, setClosingHours] = useState(operatingHours.close || '');

  // Policies
  const [spayingPolicy, setSpayingPolicy] = useState<PolicyOption>(p.spaying_policy || '');
  const [vaccinationPolicy, setVaccinationPolicy] = useState<PolicyOption>(p.vaccination_policy || '');
  const [fosteringPrograms, setFosteringPrograms] = useState<PolicyOption>(p.fostering_programs || '');

  // Prompted by
  const [promptedBy, setPromptedBy] = useState<string[]>(p.prompted_by || []);

  // File uploads
  const [welfareCertFiles, setWelfareCertFiles] = useState<File[]>([]);
  const [welfareCertPreviews, setWelfareCertPreviews] = useState<string[]>(
    Array.isArray(p.verification_documents) ? p.verification_documents : []
  );
  const [businessPermitFiles, setBusinessPermitFiles] = useState<File[]>([]);
  const [businessPermitPreviews, setBusinessPermitPreviews] = useState<string[]>(
    Array.isArray(p.business_permit_urls) ? p.business_permit_urls : []
  );
  const [existingWelfareCerts] = useState<string[]>(
    Array.isArray(p.verification_documents) ? p.verification_documents : []
  );
  const [existingBusinessPermits] = useState<string[]>(
    Array.isArray(p.business_permit_urls) ? p.business_permit_urls : []
  );

  const welfareCertRef = useRef<HTMLInputElement>(null);
  const businessPermitRef = useRef<HTMLInputElement>(null);

  const toggleArray = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const handleNewFiles = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    previewSetter: React.Dispatch<React.SetStateAction<string[]>>,
    max: number
  ) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    setter(prev => [...prev, ...files].slice(0, max));
    previewSetter(prev => [...prev, ...newPreviews].slice(0, max));
    e.target.value = '';
  };

  const removePreview = (
    index: number,
    fileSetter: React.Dispatch<React.SetStateAction<File[]>>,
    previewSetter: React.Dispatch<React.SetStateAction<string[]>>,
    existingCount: number
  ) => {
    previewSetter(prev => prev.filter((_, i) => i !== index));
    if (index >= existingCount) {
      fileSetter(prev => prev.filter((_, i) => i !== (index - existingCount)));
    }
  };

  const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
    if (files.length === 0) return [];
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const objectPaths: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('verification-documents').upload(path, file);
      if (error) throw new Error(`Upload failed: ${error.message}`);
      objectPaths.push(path);
    }
    return objectPaths;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    // Basic validation
    if (!shelterName.trim() || !contactFirstName.trim() || !contactLastName.trim()) {
      setError('Shelter name, contact first name, and last name are required');
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      // Upload new files
      const newWelfareCertUrls = await uploadFiles(welfareCertFiles, `shelters/${profile.id}/welfare-certs`);
      const newBusinessPermitUrls = await uploadFiles(businessPermitFiles, `shelters/${profile.id}/business-permits`);

      // Combine existing (remaining) + new uploads
      const finalWelfareCerts = welfareCertPreviews
        .filter(url => existingWelfareCerts.includes(url))
        .concat(newWelfareCertUrls);
      const finalBusinessPermits = businessPermitPreviews
        .filter(url => existingBusinessPermits.includes(url))
        .concat(newBusinessPermitUrls);

      const data: Record<string, any> = {
        shelter_name: shelterName.trim(),
        description: description.trim() || null,
        year_established: yearEstablished && !isNaN(parseInt(yearEstablished)) ? parseInt(yearEstablished) : null,
        registration_number: registrationNumber.trim() || null,
        capacity: capacity && !isNaN(parseInt(capacity)) ? parseInt(capacity) : null,
        type_of_animals: typeOfAnimals || null,
        areas_covered: areasCovered.trim() || null,
        contact_first_name: contactFirstName.trim(),
        contact_last_name: contactLastName.trim(),
        contact_mi: contactMI.trim() || null,
        website: website.trim() || null,
        social_media: {
          facebook: facebook || null,
          instagram: instagram || null,
          twitter: twitter || null,
        },
        operating_hours: {
          open: openingHours || null,
          close: closingHours || null,
        },
        spaying_policy: spayingPolicy || null,
        vaccination_policy: vaccinationPolicy || null,
        fostering_programs: fosteringPrograms || null,
        prompted_by: promptedBy,
        verification_documents: finalWelfareCerts,
        business_permit_urls: finalBusinessPermits,
        // shared fields
        phone: phone.trim() || null,
        address: address.trim() || null,
      };

      const result = await callApiAction('profile', 'updateShelterProfileByUserId', [profile.id, data]);
      if (result.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          onSaved();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all text-sm';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  const RadioOption = ({ name, value, label, checked, onChange }: any) => (
    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm ${
      checked ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-primary-500' : 'border-gray-300'}`}>
        {checked && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
      </span>
      {label}
    </label>
  );

  const CheckboxOption = ({ label, checked, onChange }: any) => (
    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm ${
      checked ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-primary-500' : 'border-2 border-gray-300'}`}>
        {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </span>
      {label}
    </label>
  );

  const PolicyRadioGroup = ({ name, value, onChange }: { name: string; value: PolicyOption; onChange: (v: PolicyOption) => void }) => (
    <div className="flex flex-wrap gap-2">
      <RadioOption name={name} value="yes" label="Yes" checked={value === 'yes'} onChange={() => onChange('yes')} />
      <RadioOption name={name} value="no" label="No" checked={value === 'no'} onChange={() => onChange('no')} />
      <RadioOption name={name} value="sometimes" label="Sometimes" checked={value === 'sometimes'} onChange={() => onChange('sometimes')} />
    </div>
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Profile updated successfully!
        </div>
      )}

      {/* === SHELTER INFO === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Shelter Information</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Shelter Name</label>
              <input className={inputClass} value={shelterName} onChange={e => setShelterName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Year Established</label>
              <input type="number" className={inputClass} value={yearEstablished} onChange={e => setYearEstablished(e.target.value)} min={1900} max={new Date().getFullYear()} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your shelter..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Registration Number</label>
              <input className={inputClass} value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Capacity</label>
              <input type="number" className={inputClass} value={capacity} onChange={e => setCapacity(e.target.value)} min={0} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Type of Animals</label>
            <div className="flex flex-wrap gap-2">
              {ANIMAL_TYPES.map(t => (
                <RadioOption key={t.value} name="animalType" value={t.value} label={t.label} checked={typeOfAnimals === t.value} onChange={() => setTypeOfAnimals(t.value)} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Areas Covered</label>
            <input className={inputClass} value={areasCovered} onChange={e => setAreasCovered(e.target.value)} placeholder="e.g. Metro Manila, Cavite" />
          </div>
        </div>
      </div>

      {/* === CONTACT === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Contact Person</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>First Name</label>
              <input className={inputClass} value={contactFirstName} onChange={e => setContactFirstName(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Last Name</label>
              <input className={inputClass} value={contactLastName} onChange={e => setContactLastName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>M.I.</label>
              <input className={inputClass} value={contactMI} onChange={e => setContactMI(e.target.value)} maxLength={2} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} maxLength={11} />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Website</label>
              <input className={inputClass} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </div>
        </div>
      </div>

      {/* === SOCIAL MEDIA === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Social Media</h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Facebook</label>
            <input className={inputClass} value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input className={inputClass} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className={labelClass}>Twitter / X</label>
            <input className={inputClass} value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/..." />
          </div>
        </div>
      </div>

      {/* === OPERATING HOURS === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Operating Hours</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Opening Time</label>
            <select className={inputClass} value={openingHours} onChange={e => setOpeningHours(e.target.value)}>
              <option value="">Select time</option>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Closing Time</label>
            <select className={inputClass} value={closingHours} onChange={e => setClosingHours(e.target.value)}>
              <option value="">Select time</option>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* === POLICIES & PROGRAMS === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Policies & Programs</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Spaying / Neutering Policy</label>
            <PolicyRadioGroup name="spaying" value={spayingPolicy} onChange={setSpayingPolicy} />
          </div>
          <div>
            <label className={labelClass}>Vaccination Policy</label>
            <PolicyRadioGroup name="vaccination" value={vaccinationPolicy} onChange={setVaccinationPolicy} />
          </div>
          <div>
            <label className={labelClass}>Fostering Programs</label>
            <PolicyRadioGroup name="fostering" value={fosteringPrograms} onChange={setFosteringPrograms} />
          </div>
        </div>
      </div>

      {/* === PROMPTED BY === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">How Did You Find Pawtopia?</h3>
        <div className="flex flex-wrap gap-2">
          {PROMPTED_OPTIONS.map(opt => (
            <CheckboxOption key={opt} label={opt === 'SocialMedia' ? 'Social Media' : opt} checked={promptedBy.includes(opt)} onChange={() => toggleArray(promptedBy, setPromptedBy, opt)} />
          ))}
        </div>
      </div>

      {/* === WELFARE CERTIFICATES === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Welfare Certificates</h3>
        <input ref={welfareCertRef} type="file" accept="image/*,.pdf" multiple className="hidden"
          onChange={e => handleNewFiles(e, setWelfareCertFiles, setWelfareCertPreviews, 5)} />
        {welfareCertPreviews.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {welfareCertPreviews.map((preview, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                {preview && (preview.startsWith('http') || preview.startsWith('blob:')) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={toVerificationDocumentUrl(preview)} alt={`Cert ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Document</div>
                )}
                <button type="button" onClick={() => removePreview(i, setWelfareCertFiles, setWelfareCertPreviews, existingWelfareCerts.length)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
              </div>
            ))}
          </div>
        )}
        {welfareCertPreviews.length < 5 && (
          <button type="button" onClick={() => welfareCertRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            + Upload Certificates ({welfareCertPreviews.length}/5)
          </button>
        )}
      </div>

      {/* === BUSINESS PERMITS === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Business Permits</h3>
        <input ref={businessPermitRef} type="file" accept="image/*,.pdf" multiple className="hidden"
          onChange={e => handleNewFiles(e, setBusinessPermitFiles, setBusinessPermitPreviews, 5)} />
        {businessPermitPreviews.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {businessPermitPreviews.map((preview, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                {preview && (preview.startsWith('http') || preview.startsWith('blob:')) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={toVerificationDocumentUrl(preview)} alt={`Permit ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Document</div>
                )}
                <button type="button" onClick={() => removePreview(i, setBusinessPermitFiles, setBusinessPermitPreviews, existingBusinessPermits.length)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
              </div>
            ))}
          </div>
        )}
        {businessPermitPreviews.length < 5 && (
          <button type="button" onClick={() => businessPermitRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            + Upload Permits ({businessPermitPreviews.length}/5)
          </button>
        )}
      </div>

      {/* === BUTTONS === */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={isLoading}
          className="flex-1 bg-primary-500 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Saving...
            </>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
