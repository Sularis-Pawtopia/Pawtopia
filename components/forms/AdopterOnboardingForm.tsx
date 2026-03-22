'use client';

import { useState, useRef } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { notify } from '@/lib/ui/notify';
import { CatLoader } from '@/components/ui/CatLoader';
import { PageLoaderOverlay } from '@/components/ui/PageLoaderOverlay';

interface AdopterFormState {
  // Step 1 - Personal
  firstName: string;
  lastName: string;
  mi: string;
  birthDate: string;
  gender: string;
  contactNumber: string;
  address: string;
  email: string;
  occupation: string;
  businessName: string;
  socialMediaLink: string;
  civilStatus: string;
  promptedBy: string[];
  firstTimeAdopter: string;
  // Alternative Contact
  altFirstName: string;
  altLastName: string;
  altMI: string;
  altBirthDate: string;
  altRelationship: string;
  altContactNumber: string;
  // Step 2 - Questionnaire
  lookingToAdopt: string;
  specificShelterAnimal: string;
  idealPetDescription: string;
  buildingType: string;
  doYouRent: string;
  petWhenMoving: string;
  liveWith: string[];
  householdAllergic: string;
  petCaretaker: string;
  financialResponsible: string;
  vacationCare: string;
  hoursAlone: string;
  introduceSteps: string;
  familySupport: string;
  hadPetsBefore: string;
}

const PROMPTED_OPTIONS = ['Friends', 'Social Media', 'Website', 'Others'] as const;
const LIVE_WITH_OPTIONS = [
  'Living alone',
  'Spouse',
  'Parents',
  'Children over 18',
  'Children below 18',
  'Relatives',
  'Roommate(s)',
] as const;

const HOME_PHOTO_LABELS = [
  'Front of house',
  'Street photo',
  'Living room',
  'Dining area',
  'Kitchen',
  'Bedroom/s',
  'Front & Backyard',
];

export function AdopterOnboardingForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<AdopterFormState>({
    firstName: '',
    lastName: '',
    mi: '',
    birthDate: '',
    gender: '',
    contactNumber: '',
    address: '',
    email: '',
    occupation: '',
    businessName: '',
    socialMediaLink: '',
    civilStatus: '',
    promptedBy: [],
    firstTimeAdopter: '',
    altFirstName: '',
    altLastName: '',
    altMI: '',
    altBirthDate: '',
    altRelationship: '',
    altContactNumber: '',
    lookingToAdopt: '',
    specificShelterAnimal: '',
    idealPetDescription: '',
    buildingType: '',
    doYouRent: '',
    petWhenMoving: '',
    liveWith: [],
    householdAllergic: '',
    petCaretaker: '',
    financialResponsible: '',
    vacationCare: '',
    hoursAlone: '',
    introduceSteps: '',
    familySupport: '',
    hadPetsBefore: '',
  });

  // File uploads
  const [homePhotoFiles, setHomePhotoFiles] = useState<File[]>([]);
  const [homePhotoPreviews, setHomePhotoPreviews] = useState<string[]>([]);
  const [validIdFiles, setValidIdFiles] = useState<File[]>([]);
  const [validIdPreviews, setValidIdPreviews] = useState<string[]>([]);
  const homePhotoRef = useRef<HTMLInputElement>(null);
  const validIdRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof AdopterFormState, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setStepErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleArrayField = (field: 'promptedBy' | 'liveWith', option: string) => {
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(option)
        ? (prev[field] as string[]).filter((o: string) => o !== option)
        : [...(prev[field] as string[]), option],
    }));
    setStepErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    previewSetter: React.Dispatch<React.SetStateAction<string[]>>,
    max: number
  ) => {
    const files = Array.from(e.target.files || []);
    const newPreviews: string[] = [];
    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push('');
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
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Step 1 validation
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.birthDate) errs.birthDate = 'Birth date is required';
    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    else if (!/^09\d{9}$/.test(form.contactNumber)) errs.contactNumber = 'Must be 11 digits starting with 09';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.occupation.trim()) errs.occupation = 'Occupation is required';
    if (!form.businessName.trim()) errs.businessName = 'Business name is required';
    if (!form.civilStatus) errs.civilStatus = 'Status is required';
    if (form.promptedBy.length === 0) errs.promptedBy = 'Please select at least one option';
    if (!form.firstTimeAdopter) errs.firstTimeAdopter = 'Please select an option';
    // Alternative contact
    if (!form.altFirstName.trim()) errs.altFirstName = 'First name is required';
    if (!form.altLastName.trim()) errs.altLastName = 'Last name is required';
    if (!form.altBirthDate) errs.altBirthDate = 'Birth date is required';
    if (!form.altRelationship.trim()) errs.altRelationship = 'Relationship is required';
    if (!form.altContactNumber.trim()) errs.altContactNumber = 'Contact number is required';
    else if (!/^09\d{9}$/.test(form.altContactNumber)) errs.altContactNumber = 'Must be 11 digits starting with 09';

    setStepErrors(errs);
    if (Object.keys(errs).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errs).length === 0;
  };

  // Step 2 validation
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.lookingToAdopt) errs.lookingToAdopt = 'Please select an option';
    if (!form.specificShelterAnimal) errs.specificShelterAnimal = 'Please select an option';
    if (!form.idealPetDescription.trim()) errs.idealPetDescription = 'This field is required';
    if (!form.buildingType) errs.buildingType = 'Please select an option';
    if (!form.doYouRent) errs.doYouRent = 'Please select an option';
    if (!form.petWhenMoving.trim()) errs.petWhenMoving = 'This field is required';
    if (form.liveWith.length === 0) errs.liveWith = 'Please select at least one option';
    if (!form.householdAllergic) errs.householdAllergic = 'Please select an option';
    if (!form.petCaretaker.trim()) errs.petCaretaker = 'This field is required';
    if (!form.financialResponsible.trim()) errs.financialResponsible = 'This field is required';
    if (!form.vacationCare.trim()) errs.vacationCare = 'This field is required';
    if (!form.hoursAlone.trim()) errs.hoursAlone = 'This field is required';
    if (!form.introduceSteps.trim()) errs.introduceSteps = 'This field is required';
    if (!form.familySupport) errs.familySupport = 'Please select an option';
    if (!form.hadPetsBefore) errs.hadPetsBefore = 'Please select an option';
    if (homePhotoFiles.length === 0) errs.homePhotos = 'Please upload at least one photo';
    if (validIdFiles.length === 0) errs.validId = 'Please upload a valid ID';

    setStepErrors(errs);
    if (Object.keys(errs).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    const objectPaths: string[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) {
        console.error(`Upload failed for ${file.name}:`, error.message);
        errors.push(`${file.name}: ${error.message}`);
      } else {
        objectPaths.push(path);
      }
    }
    if (errors.length > 0) {
      throw new Error(`File upload failed: ${errors.join(', ')}`);
    }
    return objectPaths;
  };

  const onSubmit = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    setError('');

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const message = 'Not authenticated';
        setError(message);
        notify.error({ title: 'Submission failed', description: message });
        setIsLoading(false);
        return;
      }

      // Upload files
      const [homePhotoUrls, validIdUrls] = await Promise.all([
        homePhotoFiles.length > 0
          ? uploadFiles(homePhotoFiles, 'verification-documents', `adopters/${user.id}/home-photos`)
          : Promise.resolve([]),
        validIdFiles.length > 0
          ? uploadFiles(validIdFiles, 'verification-documents', `adopters/${user.id}/valid-ids`)
          : Promise.resolve([]),
      ]);

      const result = await callApiAction('onboarding', 'submitAdopterOnboarding', [user.id, {
        first_name: form.firstName,
        last_name: form.lastName,
        mi: form.mi,
        date_of_birth: form.birthDate || null,
        gender: form.gender,
        contact_number: form.contactNumber,
        address: form.address,
        email: form.email,
        occupation: form.occupation,
        business_name: form.businessName,
        social_media_link: form.socialMediaLink,
        civil_status: form.civilStatus,
        prompted_by: form.promptedBy,
        first_time_adopter: form.firstTimeAdopter === 'yes',
        alt_first_name: form.altFirstName,
        alt_last_name: form.altLastName,
        alt_mi: form.altMI,
        alt_birth_date: form.altBirthDate || null,
        alt_relationship: form.altRelationship,
        alt_contact_number: form.altContactNumber,
        looking_to_adopt: form.lookingToAdopt,
        specific_shelter_animal: form.specificShelterAnimal === 'yes',
        ideal_pet_description: form.idealPetDescription,
        building_type: form.buildingType,
        do_you_rent: form.doYouRent === 'yes',
        pet_when_moving: form.petWhenMoving,
        live_with: form.liveWith,
        household_allergic: form.householdAllergic === 'yes',
        pet_caretaker: form.petCaretaker,
        financial_responsible: form.financialResponsible,
        vacation_care: form.vacationCare,
        hours_alone: form.hoursAlone,
        introduce_steps: form.introduceSteps,
        family_support: form.familySupport === 'yes',
        had_pets_before: form.hadPetsBefore === 'yes',
        home_photos: homePhotoUrls,
        valid_id_urls: validIdUrls,
      }]);

      if (result?.error) {
        setError(result.error);
        notify.error({ title: 'Onboarding failed', description: result.error });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitSuccess(true);
        notify.success({ title: 'Profile submitted', description: 'Your adopter profile has been saved.' });
        const redirectTo = typeof result?.redirectTo === 'string' ? result.redirectTo : '/dashboard';
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1500);
      }
    } catch (err: any) {
      console.error('Adopter onboarding error:', err);
      const message = err?.message || 'An unexpected error occurred';
      setError(message);
      notify.error({ title: 'Onboarding failed', description: message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorMsgClass = 'mt-1 text-xs text-red-600';
  const radioGroupClass = 'flex flex-wrap gap-3';

  // Radio button component
  const RadioOption = ({ name, value, label, checked, onChange }: {
    name: string; value: string; label: string; checked: boolean; onChange: () => void;
  }) => (
    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
      checked ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        checked ? 'border-primary-500' : 'border-gray-300'
      }`}>
        {checked && <span className="w-2 h-2 rounded-full bg-primary-500" />}
      </span>
      {label}
    </label>
  );

  // Checkbox option component
  const CheckboxOption = ({ label, checked, onChange }: {
    label: string; checked: boolean; onChange: () => void;
  }) => (
    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
      checked ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
        checked ? 'bg-primary-500 border-primary-500' : 'border-2 border-gray-300'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );

  return (
    <div>
      {isLoading && !submitSuccess && <PageLoaderOverlay label="Submitting profile..." />}

      {/* Success Overlay */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Profile Created!</h3>
            <p className="text-gray-600 text-sm mb-4">
              Welcome to Pawtopia! You&apos;re being redirected to your feed.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-600">
              <CatLoader size={56} className="-my-4" />
              <span className="text-sm font-medium">Redirecting...</span>
            </div>
          </div>
        </div>
      )}

      {/* Pawtopia Logo */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-xl border border-primary-200 bg-primary-50 flex items-center justify-center p-2">
          <img src="/pawtopia-logo.png" alt="Pawtopia logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-4 gap-0">
        <div className="flex flex-col items-center flex-1">
          <div className={`h-1.5 w-full rounded-full ${step >= 1 ? 'bg-primary-400' : 'bg-gray-200'}`} />
          <span className={`text-xs mt-1 ${step === 1 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>Personal</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div className={`h-1.5 w-full rounded-full ${step >= 2 ? 'bg-primary-400' : 'bg-gray-200'}`} />
          <span className={`text-xs mt-1 ${step === 2 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>Questionnaire</span>
        </div>
      </div>

      {/* Page Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {step === 1 ? "You're almost done!" : 'Your Pet is now within sight!'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1 ? 'Fill in your personal details to continue' : 'Answer a few questions to help us match you'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* ===================== STEP 1: PERSONAL ===================== */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>First Name *</label>
              <input
                className={inputClass}
                placeholder="Juan"
                value={form.firstName}
                onChange={e => updateField('firstName', e.target.value)}
              />
              {stepErrors.firstName && <p className={errorMsgClass}>{stepErrors.firstName}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Last Name *</label>
              <input
                className={inputClass}
                placeholder="Dela Cruz"
                value={form.lastName}
                onChange={e => updateField('lastName', e.target.value)}
              />
              {stepErrors.lastName && <p className={errorMsgClass}>{stepErrors.lastName}</p>}
            </div>
            <div className="col-span-1">
              <label className={labelClass}>M.I.</label>
              <input
                className={inputClass}
                placeholder="A"
                maxLength={2}
                value={form.mi}
                onChange={e => updateField('mi', e.target.value)}
              />
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <label className={labelClass}>Birth Date *</label>
            <input
              type="date"
              className={inputClass}
              value={form.birthDate}
              onChange={e => updateField('birthDate', e.target.value)}
            />
            {stepErrors.birthDate && <p className={errorMsgClass}>{stepErrors.birthDate}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className={labelClass}>Gender *</label>
            <div className={radioGroupClass}>
              <RadioOption name="gender" value="male" label="Male" checked={form.gender === 'male'} onChange={() => updateField('gender', 'male')} />
              <RadioOption name="gender" value="female" label="Female" checked={form.gender === 'female'} onChange={() => updateField('gender', 'female')} />
              <RadioOption name="gender" value="prefer_not_to_say" label="Prefer not to say" checked={form.gender === 'prefer_not_to_say'} onChange={() => updateField('gender', 'prefer_not_to_say')} />
            </div>
            {stepErrors.gender && <p className={errorMsgClass}>{stepErrors.gender}</p>}
          </div>

          {/* Contact Number & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Contact Number *</label>
              <input
                type="tel"
                className={inputClass}
                placeholder="09171234567"
                maxLength={11}
                value={form.contactNumber}
                onChange={e => updateField('contactNumber', e.target.value)}
              />
              {stepErrors.contactNumber && <p className={errorMsgClass}>{stepErrors.contactNumber}</p>}
            </div>
            <div>
              <label className={labelClass}>Address *</label>
              <input
                className={inputClass}
                placeholder="123 Main St, Cebu City"
                value={form.address}
                onChange={e => updateField('address', e.target.value)}
              />
              {stepErrors.address && <p className={errorMsgClass}>{stepErrors.address}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              className={inputClass}
              placeholder="juan@email.com"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
            />
            {stepErrors.email && <p className={errorMsgClass}>{stepErrors.email}</p>}
          </div>

          {/* Occupation & Business Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Occupation *</label>
              <input
                className={inputClass}
                placeholder="Software Engineer"
                value={form.occupation}
                onChange={e => updateField('occupation', e.target.value)}
              />
              {stepErrors.occupation && <p className={errorMsgClass}>{stepErrors.occupation}</p>}
            </div>
            <div>
              <label className={labelClass}>Business Name *</label>
              <input
                className={inputClass}
                placeholder="Company Inc."
                value={form.businessName}
                onChange={e => updateField('businessName', e.target.value)}
              />
              {stepErrors.businessName && <p className={errorMsgClass}>{stepErrors.businessName}</p>}
            </div>
          </div>

          {/* Social Media Link */}
          <div>
            <label className={labelClass}>Social Media Link</label>
            <input
              className={inputClass}
              placeholder="https://facebook.com/yourprofile"
              value={form.socialMediaLink}
              onChange={e => updateField('socialMediaLink', e.target.value)}
            />
          </div>

          {/* Status (Civil) */}
          <div>
            <label className={labelClass}>Status *</label>
            <div className={radioGroupClass}>
              <RadioOption name="civilStatus" value="single" label="Single" checked={form.civilStatus === 'single'} onChange={() => updateField('civilStatus', 'single')} />
              <RadioOption name="civilStatus" value="married" label="Married" checked={form.civilStatus === 'married'} onChange={() => updateField('civilStatus', 'married')} />
              <RadioOption name="civilStatus" value="others" label="Others" checked={form.civilStatus === 'others'} onChange={() => updateField('civilStatus', 'others')} />
            </div>
            {stepErrors.civilStatus && <p className={errorMsgClass}>{stepErrors.civilStatus}</p>}
          </div>

          {/* Prompted By */}
          <div>
            <label className={labelClass}>What prompted you to adopt from Pawtopia? *</label>
            <div className="flex flex-wrap gap-2">
              {PROMPTED_OPTIONS.map(opt => (
                <CheckboxOption
                  key={opt}
                  label={opt}
                  checked={form.promptedBy.includes(opt)}
                  onChange={() => toggleArrayField('promptedBy', opt)}
                />
              ))}
            </div>
            {stepErrors.promptedBy && <p className={errorMsgClass}>{stepErrors.promptedBy}</p>}
          </div>

          {/* First Time Adopter */}
          <div>
            <label className={labelClass}>Is this your first time adopting a pet? *</label>
            <div className={radioGroupClass}>
              <RadioOption name="firstTimeAdopter" value="yes" label="Yes" checked={form.firstTimeAdopter === 'yes'} onChange={() => updateField('firstTimeAdopter', 'yes')} />
              <RadioOption name="firstTimeAdopter" value="no" label="No" checked={form.firstTimeAdopter === 'no'} onChange={() => updateField('firstTimeAdopter', 'no')} />
            </div>
            {stepErrors.firstTimeAdopter && <p className={errorMsgClass}>{stepErrors.firstTimeAdopter}</p>}
          </div>

          {/* ---- Alternative Contact ---- */}
          <div className="border-t pt-5 mt-5">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Alternative Contact</h3>
            <p className="text-xs text-gray-500 mb-4">In case we cannot reach you, who should we contact?</p>

            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>First Name *</label>
                  <input
                    className={inputClass}
                    placeholder="Maria"
                    value={form.altFirstName}
                    onChange={e => updateField('altFirstName', e.target.value)}
                  />
                  {stepErrors.altFirstName && <p className={errorMsgClass}>{stepErrors.altFirstName}</p>}
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Last Name *</label>
                  <input
                    className={inputClass}
                    placeholder="Dela Cruz"
                    value={form.altLastName}
                    onChange={e => updateField('altLastName', e.target.value)}
                  />
                  {stepErrors.altLastName && <p className={errorMsgClass}>{stepErrors.altLastName}</p>}
                </div>
                <div className="col-span-1">
                  <label className={labelClass}>M.I.</label>
                  <input
                    className={inputClass}
                    placeholder="B"
                    maxLength={2}
                    value={form.altMI}
                    onChange={e => updateField('altMI', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Birth Date *</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.altBirthDate}
                    onChange={e => updateField('altBirthDate', e.target.value)}
                  />
                  {stepErrors.altBirthDate && <p className={errorMsgClass}>{stepErrors.altBirthDate}</p>}
                </div>
                <div>
                  <label className={labelClass}>Relationship *</label>
                  <input
                    className={inputClass}
                    placeholder="Mother, Spouse, etc."
                    value={form.altRelationship}
                    onChange={e => updateField('altRelationship', e.target.value)}
                  />
                  {stepErrors.altRelationship && <p className={errorMsgClass}>{stepErrors.altRelationship}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Contact Number *</label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="09181234567"
                  maxLength={11}
                  value={form.altContactNumber}
                  onChange={e => updateField('altContactNumber', e.target.value)}
                />
                {stepErrors.altContactNumber && <p className={errorMsgClass}>{stepErrors.altContactNumber}</p>}
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={goToStep2}
              className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ===================== STEP 2: QUESTIONNAIRE ===================== */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Looking to adopt */}
          <div>
            <label className={labelClass}>What are you looking to adopt? *</label>
            <div className={radioGroupClass}>
              {['Dog', 'Cat', 'Both', 'Not Decided'].map(opt => (
                <RadioOption key={opt} name="lookingToAdopt" value={opt.toLowerCase().replace(' ', '_')} label={opt}
                  checked={form.lookingToAdopt === opt.toLowerCase().replace(' ', '_')}
                  onChange={() => updateField('lookingToAdopt', opt.toLowerCase().replace(' ', '_'))} />
              ))}
            </div>
            {stepErrors.lookingToAdopt && <p className={errorMsgClass}>{stepErrors.lookingToAdopt}</p>}
          </div>

          {/* Specific shelter animal */}
          <div>
            <label className={labelClass}>Are you applying to adopt a specific shelter animal? *</label>
            <div className={radioGroupClass}>
              <RadioOption name="specificShelterAnimal" value="yes" label="Yes"
                checked={form.specificShelterAnimal === 'yes'}
                onChange={() => updateField('specificShelterAnimal', 'yes')} />
              <RadioOption name="specificShelterAnimal" value="no" label="No"
                checked={form.specificShelterAnimal === 'no'}
                onChange={() => updateField('specificShelterAnimal', 'no')} />
            </div>
            {stepErrors.specificShelterAnimal && <p className={errorMsgClass}>{stepErrors.specificShelterAnimal}</p>}
          </div>

          {/* Ideal pet */}
          <div>
            <label className={labelClass}>Describe your ideal pet, including its sex, age, appearance, temperament, etc. *</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="e.g., A medium-sized female dog, 1-3 years old..."
              value={form.idealPetDescription}
              onChange={e => updateField('idealPetDescription', e.target.value)}
            />
            {stepErrors.idealPetDescription && <p className={errorMsgClass}>{stepErrors.idealPetDescription}</p>}
          </div>

          {/* Building type */}
          <div>
            <label className={labelClass}>What type of Building do you live in? *</label>
            <div className={radioGroupClass}>
              {['House', 'Apartment', 'Condo', 'Other'].map(opt => (
                <RadioOption key={opt} name="buildingType" value={opt.toLowerCase()} label={opt}
                  checked={form.buildingType === opt.toLowerCase()}
                  onChange={() => updateField('buildingType', opt.toLowerCase())} />
              ))}
            </div>
            {stepErrors.buildingType && <p className={errorMsgClass}>{stepErrors.buildingType}</p>}
          </div>

          {/* Do you rent */}
          <div>
            <label className={labelClass}>Do you rent? *</label>
            <div className={radioGroupClass}>
              <RadioOption name="doYouRent" value="yes" label="Yes" checked={form.doYouRent === 'yes'} onChange={() => updateField('doYouRent', 'yes')} />
              <RadioOption name="doYouRent" value="no" label="No" checked={form.doYouRent === 'no'} onChange={() => updateField('doYouRent', 'no')} />
            </div>
            {stepErrors.doYouRent && <p className={errorMsgClass}>{stepErrors.doYouRent}</p>}
          </div>

          {/* Pet when moving */}
          <div>
            <label className={labelClass}>What happens to your pet if or when you move? *</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="I will bring my pet with me."
              value={form.petWhenMoving}
              onChange={e => updateField('petWhenMoving', e.target.value)}
            />
            {stepErrors.petWhenMoving && <p className={errorMsgClass}>{stepErrors.petWhenMoving}</p>}
          </div>

          {/* Who do you live with */}
          <div>
            <label className={labelClass}>Who do you live with? *</label>
            <div className="flex flex-wrap gap-2">
              {LIVE_WITH_OPTIONS.map(opt => (
                <CheckboxOption
                  key={opt}
                  label={opt}
                  checked={form.liveWith.includes(opt)}
                  onChange={() => toggleArrayField('liveWith', opt)}
                />
              ))}
            </div>
            {stepErrors.liveWith && <p className={errorMsgClass}>{stepErrors.liveWith}</p>}
          </div>

          {/* Household allergic */}
          <div>
            <label className={labelClass}>Are any members of your household allergic to animals? *</label>
            <div className={radioGroupClass}>
              <RadioOption name="householdAllergic" value="yes" label="Yes" checked={form.householdAllergic === 'yes'} onChange={() => updateField('householdAllergic', 'yes')} />
              <RadioOption name="householdAllergic" value="no" label="No" checked={form.householdAllergic === 'no'} onChange={() => updateField('householdAllergic', 'no')} />
            </div>
            {stepErrors.householdAllergic && <p className={errorMsgClass}>{stepErrors.householdAllergic}</p>}
          </div>

          {/* Pet caretaker */}
          <div>
            <label className={labelClass}>Who will be responsible for feeding, grooming, and generally caring for your pet? *</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="I will be the primary caretaker."
              value={form.petCaretaker}
              onChange={e => updateField('petCaretaker', e.target.value)}
            />
            {stepErrors.petCaretaker && <p className={errorMsgClass}>{stepErrors.petCaretaker}</p>}
          </div>

          {/* Financial responsible */}
          <div>
            <label className={labelClass}>Who will be financially responsible for your pet&apos;s needs (i.e., food, vet bills, etc.)? *</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="I will handle all expenses."
              value={form.financialResponsible}
              onChange={e => updateField('financialResponsible', e.target.value)}
            />
            {stepErrors.financialResponsible && <p className={errorMsgClass}>{stepErrors.financialResponsible}</p>}
          </div>

          {/* Vacation care */}
          <div>
            <label className={labelClass}>Who will look after your pet if you go on vacation or in case of emergency? *</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="My parents will look after my pet."
              value={form.vacationCare}
              onChange={e => updateField('vacationCare', e.target.value)}
            />
            {stepErrors.vacationCare && <p className={errorMsgClass}>{stepErrors.vacationCare}</p>}
          </div>

          {/* Hours alone */}
          <div>
            <label className={labelClass}>How many hours in your average work day will your pet be left alone? *</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="Around 4-6 hours when I'm at work."
              value={form.hoursAlone}
              onChange={e => updateField('hoursAlone', e.target.value)}
            />
            {stepErrors.hoursAlone && <p className={errorMsgClass}>{stepErrors.hoursAlone}</p>}
          </div>

          {/* Introduce steps */}
          <div>
            <label className={labelClass}>What steps will you take to introduce your new pet to his/her surroundings? *</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="Gradual introduction, starting with one room..."
              value={form.introduceSteps}
              onChange={e => updateField('introduceSteps', e.target.value)}
            />
            {stepErrors.introduceSteps && <p className={errorMsgClass}>{stepErrors.introduceSteps}</p>}
          </div>

          {/* Family support */}
          <div>
            <label className={labelClass}>Does everyone in the family support your decision in adopting a pet? *</label>
            <div className={radioGroupClass}>
              <RadioOption name="familySupport" value="yes" label="Yes" checked={form.familySupport === 'yes'} onChange={() => updateField('familySupport', 'yes')} />
              <RadioOption name="familySupport" value="no" label="No" checked={form.familySupport === 'no'} onChange={() => updateField('familySupport', 'no')} />
            </div>
            {stepErrors.familySupport && <p className={errorMsgClass}>{stepErrors.familySupport}</p>}
          </div>

          {/* Had pets before */}
          <div>
            <label className={labelClass}>Have you had any pets in the past? *</label>
            <div className={radioGroupClass}>
              <RadioOption name="hadPetsBefore" value="yes" label="Yes" checked={form.hadPetsBefore === 'yes'} onChange={() => updateField('hadPetsBefore', 'yes')} />
              <RadioOption name="hadPetsBefore" value="no" label="No" checked={form.hadPetsBefore === 'no'} onChange={() => updateField('hadPetsBefore', 'no')} />
            </div>
            {stepErrors.hadPetsBefore && <p className={errorMsgClass}>{stepErrors.hadPetsBefore}</p>}
          </div>

          {/* ---- Home Photos Upload ---- */}
          <div className="border-t pt-5">
            <label className={labelClass}>
              Please attach photos of your home *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              This has replaced our on-site ocular inspections. Please provide the following:
            </p>
            <ul className="text-xs text-gray-500 mb-3 list-disc list-inside grid grid-cols-2 gap-x-4 gap-y-0.5">
              {HOME_PHOTO_LABELS.map(label => (
                <li key={label}>{label}</li>
              ))}
            </ul>

            <input
              ref={homePhotoRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={e => handleFileChange(e, setHomePhotoFiles, setHomePhotoPreviews, 7)}
            />

            {/* Preview Grid */}
            {homePhotoPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {homePhotoPreviews.map((preview, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={`Home ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs text-gray-400">
                        {homePhotoFiles[i]?.name}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i, setHomePhotoFiles, setHomePhotoPreviews)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {homePhotoFiles.length < 7 && (
              <button
                type="button"
                onClick={() => homePhotoRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex flex-col items-center gap-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                Upload Media (Max: 7 images/videos) — {homePhotoFiles.length}/7
              </button>
            )}
            {stepErrors.homePhotos && <p className={errorMsgClass}>{stepErrors.homePhotos}</p>}
          </div>

          {/* ---- Valid ID Upload ---- */}
          <div className="border-t pt-5">
            <label className={labelClass}>Upload a Valid ID *</label>
            <p className="text-xs text-gray-500 mb-3">
              For your privacy, you may hide sensitive details (e.g., ID number) but keep your name and photo visible.
            </p>

            <input
              ref={validIdRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFileChange(e, setValidIdFiles, setValidIdPreviews, 7)}
            />

            {validIdPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {validIdPreviews.map((preview, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={`ID ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs text-gray-400">
                        {validIdFiles[i]?.name}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i, setValidIdFiles, setValidIdPreviews)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {validIdFiles.length < 7 && (
              <button
                type="button"
                onClick={() => validIdRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex flex-col items-center gap-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                Upload Media (Max: 7 images/videos) — {validIdFiles.length}/7
              </button>
            )}
            {stepErrors.validId && <p className={errorMsgClass}>{stepErrors.validId}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={goBackToStep1}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
