import { notFound } from 'next/navigation';
import { getUserProfile } from '@/lib/actions/profile.actions';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = params;
  
  const profileResult = await getUserProfile(userId);
  
  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  const profile = profileResult.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader profile={profile} />
      <ProfileTabs profile={profile} />
    </div>
  );
}
