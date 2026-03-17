import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 to-secondary-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          Ready to Make a Difference?
        </h2>
        
        <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto">
          Whether you&apos;re looking to adopt or you&apos;re a shelter wanting to help more pets find homes, 
          join Pawtopia today.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Adopter CTA */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-6xl mb-4">🐕</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              I Want to Adopt
            </h3>
            <p className="text-gray-600 mb-6">
              Find your perfect furry companion and give them the loving home they deserve.
            </p>
            <Link
              href="/pets"
              className="block w-full bg-primary-600 text-white px-6 py-4 rounded-full font-bold hover:bg-primary-700 transition-colors"
            >
              Browse Pets
            </Link>
          </div>

          {/* Shelter CTA */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              I&apos;m a Shelter
            </h3>
            <p className="text-gray-600 mb-6">
              Help more pets find homes with our easy-to-use platform and dedicated support.
            </p>
            <Link
              href="/auth/signup"
              className="block w-full bg-secondary-600 text-white px-6 py-4 rounded-full font-bold hover:bg-secondary-700 transition-colors"
            >
              Join as Shelter
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
          <div>
            <div className="text-4xl mb-2">🆓</div>
            <div className="font-semibold">100% Free</div>
            <div className="text-primary-200 text-sm">For all users and shelters</div>
          </div>
          <div>
            <div className="text-4xl mb-2">✅</div>
            <div className="font-semibold">Verified Shelters</div>
            <div className="text-primary-200 text-sm">All partners are verified</div>
          </div>
          <div>
            <div className="text-4xl mb-2">💬</div>
            <div className="font-semibold">24/7 Support</div>
            <div className="text-primary-200 text-sm">We&apos;re here to help</div>
          </div>
        </div>
      </div>
    </section>
  );
}
