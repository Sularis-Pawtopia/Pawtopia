import { redirect } from 'next/navigation';

export default async function LegacyPetPostPage({
  params,
}: {
  params: { petId: string };
}) {
  redirect(`/companions/${params.petId}/post`);
}
