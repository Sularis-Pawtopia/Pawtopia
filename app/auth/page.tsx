import { redirect } from 'next/navigation';

export default function AuthPage() {
  // Redirect to login by default
  redirect('/auth/login');
}
