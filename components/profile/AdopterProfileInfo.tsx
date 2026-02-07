'use client';

interface AdopterProfileInfoProps {
  profile: any;
}

export function AdopterProfileInfo({ profile }: AdopterProfileInfoProps) {
  const p = profile.profile;
  const isOwner = profile.isOwner;

  if (!p) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        <p>This adopter hasn&apos;t completed their profile yet.</p>
      </div>
    );
  }

  const InfoRow = ({ label, value }: { label: string; value: any }) => {
    if (!value && value !== false && value !== 0) return null;
    const displayVal = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    return (
      <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{displayVal}</span>
      </div>
    );
  };

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );

  const TagList = ({ items }: { items: string[] }) => (
    <div className="flex flex-wrap gap-1.5 py-2">
      {items.map((item, i) => (
        <span key={i} className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">{item}</span>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <SectionCard title="Personal Information">
        <InfoRow label="Full Name" value={`${p.first_name || ''} ${p.mi ? p.mi + '.' : ''} ${p.last_name || ''}`.trim()} />
        <InfoRow label="Gender" value={p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).replace('_', ' ') : null} />
        <InfoRow label="Birth Date" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
        <InfoRow label="Civil Status" value={p.civil_status ? p.civil_status.charAt(0).toUpperCase() + p.civil_status.slice(1) : null} />
        <InfoRow label="Contact Number" value={isOwner ? p.contact_number : p.contact_number ? '•••••••' + p.contact_number.slice(-4) : null} />
        <InfoRow label="Email" value={isOwner ? p.email : p.email ? p.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null} />
        <InfoRow label="Address" value={isOwner ? profile.address : profile.city || 'Not specified'} />
        <InfoRow label="Occupation" value={p.occupation} />
        <InfoRow label="Business Name" value={p.business_name} />
        {p.social_media_link && (
          <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">Social Media</span>
            <a href={p.social_media_link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:underline truncate max-w-[60%]">
              {p.social_media_link.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
            </a>
          </div>
        )}
      </SectionCard>

      {/* Adoption Preferences */}
      <SectionCard title="Adoption Preferences">
        <InfoRow label="Looking to Adopt" value={p.looking_to_adopt ? p.looking_to_adopt.charAt(0).toUpperCase() + p.looking_to_adopt.slice(1).replace('_', ' ') : null} />
        <InfoRow label="Specific Shelter Animal" value={p.specific_shelter_animal} />
        <InfoRow label="First Time Adopter" value={p.first_time_adopter} />
        {p.ideal_pet_description && (
          <div className="py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500 block mb-1">Ideal Pet Description</span>
            <p className="text-sm text-gray-900">{p.ideal_pet_description}</p>
          </div>
        )}
      </SectionCard>

      {/* What prompted you */}
      {p.prompted_by && p.prompted_by.length > 0 && (
        <SectionCard title="What Prompted Adoption">
          <TagList items={p.prompted_by} />
        </SectionCard>
      )}

      {/* Living Situation */}
      <SectionCard title="Living Situation">
        <InfoRow label="Building Type" value={p.building_type ? p.building_type.charAt(0).toUpperCase() + p.building_type.slice(1) : null} />
        <InfoRow label="Renting" value={p.do_you_rent} />
        {p.live_with && p.live_with.length > 0 && (
          <div className="py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500 block mb-1">Lives With</span>
            <TagList items={p.live_with} />
          </div>
        )}
        <InfoRow label="Household Allergic to Animals" value={p.household_allergic} />
      </SectionCard>

      {/* Pet Care Readiness */}
      <SectionCard title="Pet Care Readiness">
        {p.pet_caretaker && (
          <div className="py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500 block mb-1">Who will care for the pet?</span>
            <p className="text-sm text-gray-900">{p.pet_caretaker}</p>
          </div>
        )}
        {p.financial_responsible && (
          <div className="py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500 block mb-1">Who is financially responsible?</span>
            <p className="text-sm text-gray-900">{p.financial_responsible}</p>
          </div>
        )}
        {p.vacation_care && (
          <div className="py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500 block mb-1">Vacation / Emergency care plan</span>
            <p className="text-sm text-gray-900">{p.vacation_care}</p>
          </div>
        )}
        {p.hours_alone && (
          <div className="py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500 block mb-1">Hours pet will be alone</span>
            <p className="text-sm text-gray-900">{p.hours_alone}</p>
          </div>
        )}
        {p.pet_when_moving && (
          <div className="py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500 block mb-1">What happens to pet when moving?</span>
            <p className="text-sm text-gray-900">{p.pet_when_moving}</p>
          </div>
        )}
        {p.introduce_steps && (
          <div className="py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500 block mb-1">How will you introduce the pet?</span>
            <p className="text-sm text-gray-900">{p.introduce_steps}</p>
          </div>
        )}
        <InfoRow label="Family Supports Adoption" value={p.family_support} />
        <InfoRow label="Had Pets Before" value={p.had_pets_before} />
      </SectionCard>

      {/* Private section — only visible to owner */}
      {isOwner && (
        <>
          {/* Alternative Contact */}
          {p.alt_first_name && (
            <SectionCard title="Alternative Contact (Private)">
              <InfoRow label="Name" value={`${p.alt_first_name || ''} ${p.alt_mi ? p.alt_mi + '.' : ''} ${p.alt_last_name || ''}`.trim()} />
              <InfoRow label="Birth Date" value={p.alt_birth_date ? new Date(p.alt_birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
              <InfoRow label="Relationship" value={p.alt_relationship} />
              <InfoRow label="Contact Number" value={p.alt_contact_number} />
            </SectionCard>
          )}

          {/* Home Photos */}
          {p.home_photos && p.home_photos.length > 0 && (
            <SectionCard title="Home Photos (Private)">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-3">
                {p.home_photos.map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Home photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Valid IDs */}
          {p.valid_id_urls && p.valid_id_urls.length > 0 && (
            <SectionCard title="Valid IDs (Private)">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-3">
                {p.valid_id_urls.map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Valid ID ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
