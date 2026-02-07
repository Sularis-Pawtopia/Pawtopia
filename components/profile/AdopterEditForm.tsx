'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdopterProfileByUserId } from '@/lib/actions/profile.actions';

const PROMPTED_OPTIONS = ['Friends', 'Social Media', 'Website', 'Others'] as const;
const LIVE_WITH_OPTIONS = [
  'Living alone', 'Spouse', 'Parents', 'Children over 18',
  'Children below 18', 'Relatives', 'Roommate(s)',
] as const;

interface AdopterEditFormProps {
  profile: any;
  onCancel: () => void;
  onSaved: () => void;
}

export function AdopterEditForm({ profile, onCancel, onSaved }: AdopterEditFormProps) {
  const router = useRouter();
  const p = profile.profile || {};
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Personal
  const [firstName, setFirstName] = useState(p.first_name || '');
  const [lastName, setLastName] = useState(p.last_name || '');
  const [mi, setMi] = useState(p.mi || '');
  const [birthDate, setBirthDate] = useState(p.date_of_birth || '');
  const [gender, setGender] = useState(p.gender || '');
  const [contactNumber, setContactNumber] = useState(p.contact_number || '');
  const [address, setAddress] = useState(profile.address || '');
  const [email] = useState(p.email || '');
  const [occupation, setOccupation] = useState(p.occupation || '');
  const [businessName, setBusinessName] = useState(p.business_name || '');
  const [socialMediaLink, setSocialMediaLink] = useState(p.social_media_link || '');
  const [civilStatus, setCivilStatus] = useState(p.civil_status || '');
  const [promptedBy, setPromptedBy] = useState<string[]>(p.prompted_by || []);
  const [firstTimeAdopter, setFirstTimeAdopter] = useState(p.first_time_adopter === true ? 'yes' : p.first_time_adopter === false ? 'no' : '');

  // Alternative Contact
  const [altFirstName, setAltFirstName] = useState(p.alt_first_name || '');
  const [altLastName, setAltLastName] = useState(p.alt_last_name || '');
  const [altMI, setAltMI] = useState(p.alt_mi || '');
  const [altBirthDate, setAltBirthDate] = useState(p.alt_birth_date || '');
  const [altRelationship, setAltRelationship] = useState(p.alt_relationship || '');
  const [altContactNumber, setAltContactNumber] = useState(p.alt_contact_number || '');

  // Questionnaire
  const [lookingToAdopt, setLookingToAdopt] = useState(p.looking_to_adopt || '');
  const [specificShelterAnimal, setSpecificShelterAnimal] = useState(p.specific_shelter_animal === true ? 'yes' : p.specific_shelter_animal === false ? 'no' : '');
  const [idealPetDescription, setIdealPetDescription] = useState(p.ideal_pet_description || '');
  const [buildingType, setBuildingType] = useState(p.building_type || '');
  const [doYouRent, setDoYouRent] = useState(p.do_you_rent === true ? 'yes' : p.do_you_rent === false ? 'no' : '');
  const [petWhenMoving, setPetWhenMoving] = useState(p.pet_when_moving || '');
  const [liveWith, setLiveWith] = useState<string[]>(p.live_with || []);
  const [householdAllergic, setHouseholdAllergic] = useState(p.household_allergic === true ? 'yes' : p.household_allergic === false ? 'no' : '');
  const [petCaretaker, setPetCaretaker] = useState(p.pet_caretaker || '');
  const [financialResponsible, setFinancialResponsible] = useState(p.financial_responsible || '');
  const [vacationCare, setVacationCare] = useState(p.vacation_care || '');
  const [hoursAlone, setHoursAlone] = useState(p.hours_alone || '');
  const [introduceSteps, setIntroduceSteps] = useState(p.introduce_steps || '');
  const [familySupport, setFamilySupport] = useState(p.family_support === true ? 'yes' : p.family_support === false ? 'no' : '');
  const [hadPetsBefore, setHadPetsBefore] = useState(p.had_pets_before === true ? 'yes' : p.had_pets_before === false ? 'no' : '');

  // Files
  const [homePhotoFiles, setHomePhotoFiles] = useState<File[]>([]);
  const [homePhotoPreviews, setHomePhotoPreviews] = useState<string[]>(p.home_photos || []);
  const [validIdFiles, setValidIdFiles] = useState<File[]>([]);
  const [validIdPreviews, setValidIdPreviews] = useState<string[]>(p.valid_id_urls || []);
  const [existingHomePhotos] = useState<string[]>(p.home_photos || []);
  const [existingValidIds] = useState<string[]>(p.valid_id_urls || []);
  const homePhotoRef = useRef<HTMLInputElement>(null);
  const validIdRef = useRef<HTMLInputElement>(null);

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
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('verification-documents').upload(path, file);
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: urlData } = supabase.storage.from('verification-documents').getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      // Upload new files
      const newHomePhotoUrls = await uploadFiles(homePhotoFiles, `adopters/${profile.id}/home-photos`);
      const newValidIdUrls = await uploadFiles(validIdFiles, `adopters/${profile.id}/valid-ids`);

      // Combine existing (remaining) + new uploads
      const finalHomePhotos = homePhotoPreviews
        .filter(url => existingHomePhotos.includes(url))
        .concat(newHomePhotoUrls);
      const finalValidIds = validIdPreviews
        .filter(url => existingValidIds.includes(url))
        .concat(newValidIdUrls);

      const data = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mi: mi.trim() || null,
        date_of_birth: birthDate || null,
        gender: gender || null,
        contact_number: contactNumber.trim(),
        address: address.trim(),
        occupation: occupation.trim() || null,
        business_name: businessName.trim() || null,
        social_media_link: socialMediaLink.trim() || null,
        civil_status: civilStatus || null,
        prompted_by: promptedBy,
        first_time_adopter: firstTimeAdopter === 'yes' ? true : firstTimeAdopter === 'no' ? false : null,
        alt_first_name: altFirstName.trim() || null,
        alt_last_name: altLastName.trim() || null,
        alt_mi: altMI.trim() || null,
        alt_birth_date: altBirthDate || null,
        alt_relationship: altRelationship.trim() || null,
        alt_contact_number: altContactNumber.trim() || null,
        looking_to_adopt: lookingToAdopt || null,
        specific_shelter_animal: specificShelterAnimal === 'yes' ? true : specificShelterAnimal === 'no' ? false : null,
        ideal_pet_description: idealPetDescription.trim() || null,
        building_type: buildingType || null,
        do_you_rent: doYouRent === 'yes' ? true : doYouRent === 'no' ? false : null,
        pet_when_moving: petWhenMoving.trim() || null,
        live_with: liveWith,
        household_allergic: householdAllergic === 'yes' ? true : householdAllergic === 'no' ? false : null,
        pet_caretaker: petCaretaker.trim() || null,
        financial_responsible: financialResponsible.trim() || null,
        vacation_care: vacationCare.trim() || null,
        hours_alone: hoursAlone.trim() || null,
        introduce_steps: introduceSteps.trim() || null,
        family_support: familySupport === 'yes' ? true : familySupport === 'no' ? false : null,
        had_pets_before: hadPetsBefore === 'yes' ? true : hadPetsBefore === 'no' ? false : null,
        home_photos: finalHomePhotos,
        valid_id_urls: finalValidIds,
      };

      const result = await updateAdopterProfileByUserId(profile.id, data);
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

      {/* === PERSONAL INFORMATION === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Personal Information</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>First Name</label>
              <input className={inputClass} value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Last Name</label>
              <input className={inputClass} value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>M.I.</label>
              <input className={inputClass} value={mi} onChange={e => setMi(e.target.value)} maxLength={2} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Birth Date</label>
              <input type="date" className={inputClass} value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <div className="flex flex-wrap gap-2 mt-0.5">
                <RadioOption name="gender" value="male" label="Male" checked={gender === 'male'} onChange={() => setGender('male')} />
                <RadioOption name="gender" value="female" label="Female" checked={gender === 'female'} onChange={() => setGender('female')} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Contact Number</label>
              <input type="tel" className={inputClass} value={contactNumber} onChange={e => setContactNumber(e.target.value)} maxLength={11} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={`${inputClass} bg-gray-50`} value={email} readOnly title="Email cannot be changed here. Contact support to change your email." />
            </div>
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Occupation</label>
              <input className={inputClass} value={occupation} onChange={e => setOccupation(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Business Name</label>
              <input className={inputClass} value={businessName} onChange={e => setBusinessName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Social Media Link</label>
            <input className={inputClass} value={socialMediaLink} onChange={e => setSocialMediaLink(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <div className="flex flex-wrap gap-2">
              {['single', 'married', 'others'].map(s => (
                <RadioOption key={s} name="civilStatus" value={s} label={s.charAt(0).toUpperCase() + s.slice(1)} checked={civilStatus === s} onChange={() => setCivilStatus(s)} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>What prompted you to adopt?</label>
            <div className="flex flex-wrap gap-2">
              {PROMPTED_OPTIONS.map(opt => (
                <CheckboxOption key={opt} label={opt} checked={promptedBy.includes(opt)} onChange={() => toggleArray(promptedBy, setPromptedBy, opt)} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>First time adopting?</label>
            <div className="flex gap-2">
              <RadioOption name="firstTimeAdopter" value="yes" label="Yes" checked={firstTimeAdopter === 'yes'} onChange={() => setFirstTimeAdopter('yes')} />
              <RadioOption name="firstTimeAdopter" value="no" label="No" checked={firstTimeAdopter === 'no'} onChange={() => setFirstTimeAdopter('no')} />
            </div>
          </div>
        </div>
      </div>

      {/* === ALTERNATIVE CONTACT === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Alternative Contact</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>First Name</label>
              <input className={inputClass} value={altFirstName} onChange={e => setAltFirstName(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Last Name</label>
              <input className={inputClass} value={altLastName} onChange={e => setAltLastName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>M.I.</label>
              <input className={inputClass} value={altMI} onChange={e => setAltMI(e.target.value)} maxLength={2} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Birth Date</label>
              <input type="date" className={inputClass} value={altBirthDate} onChange={e => setAltBirthDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Relationship</label>
              <input className={inputClass} value={altRelationship} onChange={e => setAltRelationship(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Contact Number</label>
              <input type="tel" className={inputClass} value={altContactNumber} onChange={e => setAltContactNumber(e.target.value)} maxLength={11} />
            </div>
          </div>
        </div>
      </div>

      {/* === QUESTIONNAIRE === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Adoption Questionnaire</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>What are you looking to adopt?</label>
            <div className="flex flex-wrap gap-2">
              {['dog', 'cat', 'both', 'not_decided'].map(o => (
                <RadioOption key={o} name="lookingToAdopt" value={o} label={o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' ')} checked={lookingToAdopt === o} onChange={() => setLookingToAdopt(o)} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Applying for a specific shelter animal?</label>
            <div className="flex gap-2">
              <RadioOption name="specificAnimal" value="yes" label="Yes" checked={specificShelterAnimal === 'yes'} onChange={() => setSpecificShelterAnimal('yes')} />
              <RadioOption name="specificAnimal" value="no" label="No" checked={specificShelterAnimal === 'no'} onChange={() => setSpecificShelterAnimal('no')} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Describe your ideal pet</label>
            <textarea className={inputClass} rows={2} value={idealPetDescription} onChange={e => setIdealPetDescription(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Building type</label>
            <div className="flex flex-wrap gap-2">
              {['house', 'apartment', 'condo', 'other'].map(o => (
                <RadioOption key={o} name="buildingType" value={o} label={o.charAt(0).toUpperCase() + o.slice(1)} checked={buildingType === o} onChange={() => setBuildingType(o)} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Do you rent?</label>
            <div className="flex gap-2">
              <RadioOption name="doYouRent" value="yes" label="Yes" checked={doYouRent === 'yes'} onChange={() => setDoYouRent('yes')} />
              <RadioOption name="doYouRent" value="no" label="No" checked={doYouRent === 'no'} onChange={() => setDoYouRent('no')} />
            </div>
          </div>

          <div>
            <label className={labelClass}>What happens to your pet if you move?</label>
            <textarea className={inputClass} rows={2} value={petWhenMoving} onChange={e => setPetWhenMoving(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Who do you live with?</label>
            <div className="flex flex-wrap gap-2">
              {LIVE_WITH_OPTIONS.map(opt => (
                <CheckboxOption key={opt} label={opt} checked={liveWith.includes(opt)} onChange={() => toggleArray(liveWith, setLiveWith, opt)} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Household allergic to animals?</label>
            <div className="flex gap-2">
              <RadioOption name="allergic" value="yes" label="Yes" checked={householdAllergic === 'yes'} onChange={() => setHouseholdAllergic('yes')} />
              <RadioOption name="allergic" value="no" label="No" checked={householdAllergic === 'no'} onChange={() => setHouseholdAllergic('no')} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Who will care for the pet?</label>
            <textarea className={inputClass} rows={2} value={petCaretaker} onChange={e => setPetCaretaker(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Who is financially responsible?</label>
            <textarea className={inputClass} rows={2} value={financialResponsible} onChange={e => setFinancialResponsible(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Vacation / emergency care plan</label>
            <textarea className={inputClass} rows={2} value={vacationCare} onChange={e => setVacationCare(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Hours pet will be alone</label>
            <textarea className={inputClass} rows={2} value={hoursAlone} onChange={e => setHoursAlone(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Steps to introduce new pet</label>
            <textarea className={inputClass} rows={2} value={introduceSteps} onChange={e => setIntroduceSteps(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Family supports adoption?</label>
            <div className="flex gap-2">
              <RadioOption name="familySupport" value="yes" label="Yes" checked={familySupport === 'yes'} onChange={() => setFamilySupport('yes')} />
              <RadioOption name="familySupport" value="no" label="No" checked={familySupport === 'no'} onChange={() => setFamilySupport('no')} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Had pets before?</label>
            <div className="flex gap-2">
              <RadioOption name="hadPets" value="yes" label="Yes" checked={hadPetsBefore === 'yes'} onChange={() => setHadPetsBefore('yes')} />
              <RadioOption name="hadPets" value="no" label="No" checked={hadPetsBefore === 'no'} onChange={() => setHadPetsBefore('no')} />
            </div>
          </div>
        </div>
      </div>

      {/* === HOME PHOTOS === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Home Photos</h3>
        <input ref={homePhotoRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleNewFiles(e, setHomePhotoFiles, setHomePhotoPreviews, 7)} />
        {homePhotoPreviews.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {homePhotoPreviews.map((preview, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt={`Home ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Photo</div>
                )}
                <button type="button" onClick={() => removePreview(i, setHomePhotoFiles, setHomePhotoPreviews, existingHomePhotos.length)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
              </div>
            ))}
          </div>
        )}
        {homePhotoPreviews.length < 7 && (
          <button type="button" onClick={() => homePhotoRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            + Upload Photos ({homePhotoPreviews.length}/7)
          </button>
        )}
      </div>

      {/* === VALID IDs === */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Valid IDs</h3>
        <input ref={validIdRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleNewFiles(e, setValidIdFiles, setValidIdPreviews, 7)} />
        {validIdPreviews.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {validIdPreviews.map((preview, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt={`ID ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">ID</div>
                )}
                <button type="button" onClick={() => removePreview(i, setValidIdFiles, setValidIdPreviews, existingValidIds.length)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
              </div>
            ))}
          </div>
        )}
        {validIdPreviews.length < 7 && (
          <button type="button" onClick={() => validIdRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            + Upload IDs ({validIdPreviews.length}/7)
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
