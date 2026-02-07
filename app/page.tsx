import Link from 'next/link';
import { HeroSection } from '@/components/landing/HeroSection';
import { AdvocaciesSection } from '@/components/landing/AdvocaciesSection';
import { MissionSection } from '@/components/landing/MissionSection';
import { CTASection } from '@/components/landing/CTASection';

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary-600">🐾 Pawtopia</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-primary-600 text-white px-6 py-2 rounded-full hover:bg-primary-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />
        <AdvocaciesSection />
        <MissionSection />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">🐾 Pawtopia</h3>
              <p className="text-gray-400">
                Connecting loving homes with pets in need. Together, we save lives.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/pets" className="hover:text-white">Browse Pets</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">Become a Shelter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">support@pawtopia.com</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Pawtopia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
