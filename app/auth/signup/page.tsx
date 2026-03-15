import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { SignUpForm } from '@/components/forms/SignUpForm';

export default async function SignupPage() {
  const user = await getCurrentUser();
  
  if (user) {
    if (!user.is_verified) {
      redirect(`/onboarding/${user.role}`);
    }
    redirect(user.role === 'shelter' ? '/shelter' : user.role === 'dvmf' ? '/dvmf' : '/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join Pawtopia
          </h1>
          <p className="text-gray-600">
            Create an account to get started
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignUpForm />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
