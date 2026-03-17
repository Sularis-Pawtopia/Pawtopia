import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500">
      <div className="absolute inset-0 bg-[url('/patterns/paw-pattern.svg')] opacity-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-white space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Every Pet
              <br />
              Deserves a
              <br />
              <span className="text-secondary-300">Loving Home</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-100">
              Join Pawtopia in our mission to reduce euthanasia and give every dog a second chance at happiness.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/pets"
                className="bg-white text-primary-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 text-center"
              >
                🐾 Find Your Perfect Match
              </Link>
              <Link
                href="/auth/signup"
                className="bg-secondary-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-secondary-600 transition-all hover:scale-105 text-center border-2 border-white/20"
              >
                I&apos;m a Shelter
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-4xl font-bold">5,000+</div>
                <div className="text-primary-200 text-sm">Pets Adopted</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">200+</div>
                <div className="text-primary-200 text-sm">Shelters</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">98%</div>
                <div className="text-primary-200 text-sm">Happy Families</div>
              </div>
            </div>
          </div>

          {/* Right Column - Image/Illustration */}
          <div className="relative">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              {/* Placeholder for hero image */}
              <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                <div className="text-9xl">🐕</div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
              <span className="text-4xl">❤️</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-secondary-400 rounded-full p-4 shadow-lg">
              <span className="text-4xl">🏠</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
