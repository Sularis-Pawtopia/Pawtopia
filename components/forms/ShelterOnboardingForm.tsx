'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { submitShelterOnboarding } from '@/lib/actions/onboarding.actions';

type PolicyOption = 'yes' | 'no' | 'sometimes';

interface ShelterFormState {
  // Step 1 - Personal
  shelterName: string;
  yearEstablished: string;
  registrationNumber: string;
  contactLastName: string;
  contactFirstName: string;
  contactMI: string;
  contactNo: string;
  address: string;
  emailAddress: string;
  websiteOrSocial: string;
  promptedBy: string[];
  typeOfAnimals: string;
  openingHours: string;
  closingHours: string;
  areasCovered: string;
  // Step 2 - Legitimacy
  spayingPolicy: PolicyOption | '';
  vaccinationPolicy: PolicyOption | '';
  fosteringPrograms: PolicyOption | '';
}

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
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
] as const;

export function ShelterOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ShelterFormState>({
    shelterName: '',
    yearEstablished: '',
    registrationNumber: '',
    contactLastName: '',
    contactFirstName: '',
    contactMI: '',
    contactNo: '',
    address: '',
    emailAddress: '',
    websiteOrSocial: '',
    promptedBy: [],
    typeOfAnimals: '',
    openingHours: '',
    closingHours: '',
    areasCovered: '',
    spayingPolicy: '',
    vaccinationPolicy: '',
    fosteringPrograms: '',
  });

  // File uploads
  const [welfareCertFiles, setWelfareCertFiles] = useState<File[]>([]);
  const [businessPermitFiles, setBusinessPermitFiles] = useState<File[]>([]);
  const [welfareCertPreviews, setWelfareCertPreviews] = useState<string[]>([]);
  const [businessPermitPreviews, setBusinessPermitPreviews] = useState<string[]>([]);
  const welfareCertRef = useRef<HTMLInputElement>(null);
  const businessPermitRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof ShelterFormState, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setStepErrors(prev => ({ ...prev, [field]: '' }));
  };

  const togglePromptedBy = (option: string) => {
    setForm(prev => ({
      ...prev,
      promptedBy: prev.promptedBy.includes(option)
        ? prev.promptedBy.filter(o => o !== option)
        : [...prev.promptedBy, option],
    }));
    setStepErrors(prev => ({ ...prev, promptedBy: '' }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    previewSetter: React.Dispatch<React.SetStateAction<string[]>>,
    max: number
  ) => {
    const files = Array.from(e.target.files || []);
    
    // Create preview URLs
    const newPreviews: string[] = [];
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push(''); // No preview for non-images
      }
    });
    
    setter(prev => [...prev, ...files].slice(0, max));
    previewSetter(prev => [...prev, ...newPreviews].slice(0, max));
    e.target.value = '';
  };

  const removeFile = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    previewSetter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
    previewSetter(prev => {
      // Clean up URL object to prevent memory leaks
      if (prev[index]) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Step 1 validation
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.shelterName.trim()) errs.shelterName = 'Shelter name is required';
    if (!form.yearEstablished.trim()) errs.yearEstablished = 'Year established is required';
    else if (isNaN(Number(form.yearEstablished)) || Number(form.yearEstablished) < 1900 || Number(form.yearEstablished) > new Date().getFullYear())
      errs.yearEstablished = 'Please enter a valid year';
    if (!form.registrationNumber.trim()) errs.registrationNumber = 'Registration number is required';
    if (!form.contactLastName.trim()) errs.contactLastName = 'Last name is required';
    if (!form.contactFirstName.trim()) errs.contactFirstName = 'First name is required';
    if (!form.contactNo.trim()) errs.contactNo = 'Contact number is required';
    else if (!/^09\d{9}$/.test(form.contactNo)) errs.contactNo = 'Must be 11 digits starting with 09';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.emailAddress.trim()) errs.emailAddress = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress)) errs.emailAddress = 'Invalid email address';
    if (!form.websiteOrSocial.trim()) errs.websiteOrSocial = 'Website or social media link is required';
    if (form.promptedBy.length === 0) errs.promptedBy = 'Please select at least one option';
    if (!form.typeOfAnimals.trim()) errs.typeOfAnimals = 'Type of animals is required';
    if (!form.openingHours.trim()) errs.openingHours = 'Opening hours is required';
    if (!form.closingHours.trim()) errs.closingHours = 'Closing hours is required';
    if (!form.areasCovered.trim()) errs.areasCovered = 'Areas covered is required';
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 validation
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.spayingPolicy) errs.spayingPolicy = 'Please select an option';
    if (!form.vaccinationPolicy) errs.vaccinationPolicy = 'Please select an option';
    if (!form.fosteringPrograms) errs.fosteringPrograms = 'Please select an option';
    if (welfareCertFiles.length === 0) errs.welfareCert = 'Animal welfare registration certificate is required';
    if (businessPermitFiles.length === 0) errs.businessPermit = 'Business permit is required';
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  const uploadFiles = async (files: File[], bucket: string, folder: string): Promise<string[]> => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const urls: string[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) {
        console.error(`Upload failed for ${file.name}:`, error.message);
        errors.push(`${file.name}: ${error.message}`);
      } else {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    if (errors.length > 0) {
      throw new Error(`File upload failed: ${errors.join(', ')}`);
    }
    return urls;
  };

  const onSubmit = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    setError('');

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      // Upload files
      const [welfareCertUrls, businessPermitUrls] = await Promise.all([
        uploadFiles(welfareCertFiles, 'verification-documents', `shelters/${user.id}/welfare-cert`),
        uploadFiles(businessPermitFiles, 'verification-documents', `shelters/${user.id}/business-permit`),
      ]);

      console.log('Uploaded welfare cert URLs:', welfareCertUrls);
      console.log('Uploaded business permit URLs:', businessPermitUrls);

      const result = await submitShelterOnboarding(
        user.id,
        {
          shelter_name: form.shelterName,
          phone: form.contactNo,
          address: form.address,
          city: '',
          state: '',
          zip_code: '',
          registration_number: form.registrationNumber,
          website: form.websiteOrSocial || undefined,
          description: '',
          // Extended fields
          year_established: Number(form.yearEstablished),
          contact_first_name: form.contactFirstName,
          contact_last_name: form.contactLastName,
          contact_mi: form.contactMI,
          email_address: form.emailAddress,
          type_of_animals: form.typeOfAnimals,
          opening_hours: form.openingHours,
          closing_hours: form.closingHours,
          areas_covered: form.areasCovered,
          prompted_by: form.promptedBy,
          spaying_policy: form.spayingPolicy as PolicyOption,
          vaccination_policy: form.vaccinationPolicy as PolicyOption,
          fostering_programs: form.fosteringPrograms as PolicyOption,
        },
        {
          verification_documents: welfareCertUrls,
          business_permit_urls: businessPermitUrls,
        }
      );

      if (result?.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitSuccess(true);
        // Small delay so user sees the success message before redirect
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (err: any) {
      console.error('Shelter onboarding error:', err);
      setError(err?.message || 'An unexpected error occurred');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all';
  const selectClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <div>
      {/* Success Overlay */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-600 text-sm mb-4">
              Your shelter verification is under review. You&apos;ll be redirected to your dashboard shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-600">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Redirecting...</span>
            </div>
          </div>
        </div>
      )}

      {/* Logo Placeholder */}
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-primary-50 border-2 border-dashed border-primary-300 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 bg-primary-200 rounded-lg mx-auto mb-2"></div>
            <span className="text-xs text-primary-600 font-medium">Logo</span>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-6 gap-0">
        <div className="flex flex-col items-center flex-1">
          <div className={`h-1.5 w-full rounded-full ${step >= 1 ? 'bg-primary-400' : 'bg-gray-200'}`} />
          <span className={`text-xs mt-1 ${step === 1 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>Personal</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div className={`h-1.5 w-full rounded-full ${step >= 2 ? 'bg-primary-400' : 'bg-gray-200'}`} />
          <span className={`text-xs mt-1 ${step === 2 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>Legitimacy</span>
        </div>
      </div>

      {/* Skip for now */}
      <div className="text-right mb-4">
        <button
          type="button"
          onClick={() => router.push('/shelter')}
          className="text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Skip for now
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* ======== STEP 1: Personal ======== */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Shelter Name */}
          <div>
            <label className={labelClass}>Shelter Name <span className="text-red-500">*</span></label>
            <input
              value={form.shelterName}
              onChange={e => updateField('shelterName', e.target.value)}
              className={inputClass}
              placeholder="e.g. Happy Paws Animal Shelter"
            />
            {stepErrors.shelterName && <p className={errorClass}>{stepErrors.shelterName}</p>}
          </div>

          {/* Year Established & Registration Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Year Established <span className="text-red-500">*</span></label>
              <input
                value={form.yearEstablished}
                onChange={e => updateField('yearEstablished', e.target.value)}
                className={inputClass}
                placeholder="e.g. 2015"
                maxLength={4}
              />
              {stepErrors.yearEstablished && <p className={errorClass}>{stepErrors.yearEstablished}</p>}
            </div>
            <div>
              <label className={labelClass}>Registration Number <span className="text-red-500">*</span></label>
              <input
                value={form.registrationNumber}
                onChange={e => updateField('registrationNumber', e.target.value)}
                className={inputClass}
              />
              {stepErrors.registrationNumber && <p className={errorClass}>{stepErrors.registrationNumber}</p>}
            </div>
          </div>

          {/* Primary Contact Person */}
          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-3">Primary Contact Person</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                <input
                  value={form.contactLastName}
                  onChange={e => updateField('contactLastName', e.target.value)}
                  className={inputClass}
                />
                {stepErrors.contactLastName && <p className={errorClass}>{stepErrors.contactLastName}</p>}
              </div>
              <div>
                <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                <input
                  value={form.contactFirstName}
                  onChange={e => updateField('contactFirstName', e.target.value)}
                  className={inputClass}
                />
                {stepErrors.contactFirstName && <p className={errorClass}>{stepErrors.contactFirstName}</p>}
              </div>
              <div>
                <label className={labelClass}>MI</label>
                <input
                  value={form.contactMI}
                  onChange={e => updateField('contactMI', e.target.value)}
                  className={inputClass}
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Contact No & Address */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact No. <span className="text-red-500">*</span></label>
              <input
                value={form.contactNo}
                onChange={e => updateField('contactNo', e.target.value)}
                className={inputClass}
                placeholder="09171234567"
                maxLength={11}
              />
              {stepErrors.contactNo && <p className={errorClass}>{stepErrors.contactNo}</p>}
            </div>
            <div>
              <label className={labelClass}>Address <span className="text-red-500">*</span></label>
              <input
                value={form.address}
                onChange={e => updateField('address', e.target.value)}
                className={inputClass}
              />
              {stepErrors.address && <p className={errorClass}>{stepErrors.address}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.emailAddress}
              onChange={e => updateField('emailAddress', e.target.value)}
              className={inputClass}
              placeholder="name@example.com"
            />
            {stepErrors.emailAddress && <p className={errorClass}>{stepErrors.emailAddress}</p>}
          </div>

          {/* Website or Social Media */}
          <div>
            <label className={labelClass}>Website or Social Media Link <span className="text-red-500">*</span></label>
            <input
              value={form.websiteOrSocial}
              onChange={e => updateField('websiteOrSocial', e.target.value)}
              className={inputClass}
              placeholder="Type N/A if none"
            />
            {stepErrors.websiteOrSocial && <p className={errorClass}>{stepErrors.websiteOrSocial}</p>}
          </div>

          {/* What prompted you */}
          <div>
            <label className={labelClass}>What prompted you to use Pawtopia? <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-6 mt-2">
              {PROMPTED_OPTIONS.map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.promptedBy.includes(option)}
                    onChange={() => togglePromptedBy(option)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {stepErrors.promptedBy && <p className={errorClass}>{stepErrors.promptedBy}</p>}
          </div>

          {/* Type of Animals, Hours, Areas */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Type of Animals <span className="text-red-500">*</span></label>
              <select
                value={form.typeOfAnimals}
                onChange={e => updateField('typeOfAnimals', e.target.value)}
                className={selectClass}
              >
                <option value="">Select animal types...</option>
                {ANIMAL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {stepErrors.typeOfAnimals && <p className={errorClass}>{stepErrors.typeOfAnimals}</p>}
            </div>
            <div>
              <label className={labelClass}>Opening Hours <span className="text-red-500">*</span></label>
              <select
                value={form.openingHours}
                onChange={e => updateField('openingHours', e.target.value)}
                className={selectClass}
              >
                <option value="">Select opening time...</option>
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {stepErrors.openingHours && <p className={errorClass}>{stepErrors.openingHours}</p>}
            </div>
            <div>
              <label className={labelClass}>Closing Hours <span className="text-red-500">*</span></label>
              <select
                value={form.closingHours}
                onChange={e => updateField('closingHours', e.target.value)}
                className={selectClass}
              >
                <option value="">Select closing time...</option>
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {stepErrors.closingHours && <p className={errorClass}>{stepErrors.closingHours}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Areas Covered <span className="text-red-500">*</span></label>
            <input
              value={form.areasCovered}
              onChange={e => updateField('areasCovered', e.target.value)}
              className={inputClass}
              placeholder="e.g. neighboring provinces, etc."
            />
            {stepErrors.areasCovered && <p className={errorClass}>{stepErrors.areasCovered}</p>}
          </div>

          <button
            type="button"
            onClick={goToStep2}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Next: Legitimacy
          </button>
        </div>
      )}

      {/* ======== STEP 2: Legitimacy ======== */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-extrabold text-gray-900">Almost There!</h2>
            <p className="text-sm text-blue-600 mt-1">
              Create an account in order to gain access to Pawtopia.
            </p>
          </div>

          {/* Spaying/Neutering Policy */}
          <div>
            <label className={labelClass}>
              Spaying/Neutering Policy (If pets are spayed/neutered before adoption?)
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6 mt-2">
              {(['yes', 'no', 'sometimes'] as const).map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="spayingPolicy"
                    checked={form.spayingPolicy === opt}
                    onChange={() => updateField('spayingPolicy', opt)}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700 capitalize">{opt === 'sometimes' ? 'Sometimes / Case-by-case' : opt === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {stepErrors.spayingPolicy && <p className={errorClass}>{stepErrors.spayingPolicy}</p>}
          </div>

          {/* Vaccination & Medical Care */}
          <div>
            <label className={labelClass}>
              Vaccination & Medical Care (Are pets fully vaccinated before adoption?)
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6 mt-2">
              {(['yes', 'no', 'sometimes'] as const).map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vaccinationPolicy"
                    checked={form.vaccinationPolicy === opt}
                    onChange={() => updateField('vaccinationPolicy', opt)}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700 capitalize">{opt === 'sometimes' ? 'Sometimes / Case-by-case' : opt === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {stepErrors.vaccinationPolicy && <p className={errorClass}>{stepErrors.vaccinationPolicy}</p>}
          </div>

          {/* Fostering & Volunteering Programs */}
          <div>
            <label className={labelClass}>
              Fostering & Volunteering Programs
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6 mt-2">
              {(['yes', 'no', 'sometimes'] as const).map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fosteringPrograms"
                    checked={form.fosteringPrograms === opt}
                    onChange={() => updateField('fosteringPrograms', opt)}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700 capitalize">{opt === 'sometimes' ? 'Sometimes / Case-by-case' : opt === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {stepErrors.fosteringPrograms && <p className={errorClass}>{stepErrors.fosteringPrograms}</p>}
          </div>

          {/* Privacy note */}
          <p className="text-sm text-blue-600">
            We value your privacy. Your photos won&apos;t be used for any other purpose than this registration process application.
          </p>

          {/* Animal Welfare Registration Certificate */}
          <div>
            <label className={labelClass}>
              Animal Welfare Registration Certificate<span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {welfareCertFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {welfareCertFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      {welfareCertPreviews[i] ? (
                        <div className="relative">
                          <img 
                            src={welfareCertPreviews[i]} 
                            alt={`Preview ${i + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeFile(i, setWelfareCertFiles, setWelfareCertPreviews)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-all"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative bg-gray-100 rounded-lg px-3 py-6 text-center">
                          <div className="text-gray-400 text-xs mb-1">📄</div>
                          <span className="text-xs text-gray-600 block truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i, setWelfareCertFiles, setWelfareCertPreviews)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-all"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={welfareCertRef}
                type="file"
                accept="image/*,video/*,.pdf"
                multiple
                onChange={e => handleFileChange(e, setWelfareCertFiles, setWelfareCertPreviews, 7)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => welfareCertRef.current?.click()}
                disabled={welfareCertFiles.length >= 7}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Upload Media
              </button>
              <p className="text-xs text-gray-400 mt-2">Supports images & videos (Max: 7)</p>
            </div>
            {stepErrors.welfareCert && <p className={errorClass}>{stepErrors.welfareCert}</p>}
          </div>

          {/* Business Permit */}
          <div>
            <label className={labelClass}>
              Business Permit<span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {businessPermitFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {businessPermitFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      {businessPermitPreviews[i] ? (
                        <div className="relative">
                          <img 
                            src={businessPermitPreviews[i]} 
                            alt={`Preview ${i + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeFile(i, setBusinessPermitFiles, setBusinessPermitPreviews)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-all"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative bg-gray-100 rounded-lg px-3 py-6 text-center">
                          <div className="text-gray-400 text-xs mb-1">📄</div>
                          <span className="text-xs text-gray-600 block truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i, setBusinessPermitFiles, setBusinessPermitPreviews)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-all"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={businessPermitRef}
                type="file"
                accept="image/*,video/*,.pdf"
                multiple
                onChange={e => handleFileChange(e, setBusinessPermitFiles, setBusinessPermitPreviews, 7)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => businessPermitRef.current?.click()}
                disabled={businessPermitFiles.length >= 7}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Upload Media
              </button>
              <p className="text-xs text-gray-400 mt-2">Supports images & videos (Max: 7)</p>
            </div>
            {stepErrors.businessPermit && <p className={errorClass}>{stepErrors.businessPermit}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBackToStep1}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
