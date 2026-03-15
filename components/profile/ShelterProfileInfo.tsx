'use client';

import { toVerificationDocumentUrl } from '@/lib/storage/verification-documents';

interface ShelterProfileInfoProps {
  profile: any;
}

export function ShelterProfileInfo({ profile }: ShelterProfileInfoProps) {
  const p = profile.profile;
  const isOwner = profile.isOwner;

  if (!p) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        <p>This shelter hasn&apos;t completed their profile yet.</p>
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

  const PolicyBadge = ({ value }: { value: string }) => {
    const colors: Record<string, string> = {
      yes: 'bg-green-100 text-green-700',
      no: 'bg-red-100 text-red-700',
      sometimes: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-600'}`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Shelter Information */}
      <SectionCard title="Shelter Information">
        <InfoRow label="Shelter Name" value={p.shelter_name} />
        <InfoRow label="Year Established" value={p.year_established} />
        <InfoRow label="Registration Number" value={isOwner ? p.registration_number : p.registration_number ? '••••' + p.registration_number.slice(-4) : null} />
        <InfoRow label="Type of Animals" value={p.type_of_animals ? p.type_of_animals.charAt(0).toUpperCase() + p.type_of_animals.slice(1).replace('-', ' & ') : null} />
        <InfoRow label="Areas Covered" value={p.areas_covered} />
        {p.capacity && <InfoRow label="Capacity" value={`${p.capacity} animals`} />}
      </SectionCard>

      {/* Contact Person */}
      <SectionCard title="Contact Person">
        <InfoRow label="Name" value={`${p.contact_first_name || ''} ${p.contact_mi ? p.contact_mi + '.' : ''} ${p.contact_last_name || ''}`.trim() || null} />
        <InfoRow label="Contact Number" value={isOwner ? profile.phone : profile.phone ? '•••••••' + profile.phone.slice(-4) : null} />
        <InfoRow label="Email" value={isOwner ? (p.email || profile.email) : null} />
        <InfoRow label="Address" value={profile.address} />
        {p.website && (
          <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">Website / Social Media</span>
            <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:underline truncate max-w-[60%]">
              {p.website.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
            </a>
          </div>
        )}
      </SectionCard>

      {/* Operating Hours */}
      {(p.operating_hours?.opening || p.operating_hours?.closing) && (
        <SectionCard title="Operating Hours">
          <InfoRow label="Opening" value={p.operating_hours?.opening} />
          <InfoRow label="Closing" value={p.operating_hours?.closing} />
        </SectionCard>
      )}

      {/* Policies */}
      <SectionCard title="Policies & Programs">
        {p.spaying_policy && (
          <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500">Spaying/Neutering Policy</span>
            <PolicyBadge value={p.spaying_policy} />
          </div>
        )}
        {p.vaccination_policy && (
          <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500">Vaccination Policy</span>
            <PolicyBadge value={p.vaccination_policy} />
          </div>
        )}
        {p.fostering_programs && (
          <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-500">Fostering Programs</span>
            <PolicyBadge value={p.fostering_programs} />
          </div>
        )}
      </SectionCard>

      {/* Prompted By */}
      {p.prompted_by && p.prompted_by.length > 0 && (
        <SectionCard title="How They Found Pawtopia">
          <div className="flex flex-wrap gap-1.5 py-3">
            {p.prompted_by.map((item: string, i: number) => (
              <span key={i} className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">{item}</span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Private — Documents (owner only) */}
      {isOwner && (
        <>
          {p.verification_documents && (Array.isArray(p.verification_documents) ? p.verification_documents : []).length > 0 && (
            <SectionCard title="Welfare Certificates (Private)">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-3">
                {(Array.isArray(p.verification_documents) ? p.verification_documents : []).map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={toVerificationDocumentUrl(url)} alt={`Document ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {p.business_permit_urls && (Array.isArray(p.business_permit_urls) ? p.business_permit_urls : []).length > 0 && (
            <SectionCard title="Business Permits (Private)">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-3">
                {(Array.isArray(p.business_permit_urls) ? p.business_permit_urls : []).map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={toVerificationDocumentUrl(url)} alt={`Permit ${i + 1}`} className="w-full h-full object-cover" />
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
