import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Navbar } from './Navbar';

export async function GlobalNav() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <Navbar user={user} />;
}
