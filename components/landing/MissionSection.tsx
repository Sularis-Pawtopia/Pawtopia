export function MissionSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Mission Statement */}
          <div className="space-y-6">
            <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full font-semibold text-sm">
              Our Mission
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Saving Lives,
              <br />
              One Paw at a Time
            </h2>

            <p className="text-xl text-gray-600 leading-relaxed">
              Pawtopia connects compassionate families with shelter pets in need. 
              We're on a mission to end euthanasia in dog pounds by making adoption 
              easy, transparent, and rewarding.
            </p>

            <div className="space-y-4">
              <FeatureItem 
                icon="✓"
                text="Verified shelters and adoption centers"
              />
              <FeatureItem 
                icon="✓"
                text="Transparent adoption process"
              />
              <FeatureItem 
                icon="✓"
                text="Post-adoption support and community"
              />
              <FeatureItem 
                icon="✓"
                text="Real-time adoption status updates"
              />
            </div>
          </div>

          {/* Right - Stats & Impact */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Our Impact in 2024
            </h3>

            <div className="space-y-6">
              <ImpactStat
                number="5,247"
                label="Pets Found Homes"
                icon="🏡"
                color="text-primary-600"
              />
              <ImpactStat
                number="89%"
                label="Reduction in Shelter Stay Time"
                icon="⏰"
                color="text-secondary-600"
              />
              <ImpactStat
                number="234"
                label="Partner Shelters"
                icon="🤝"
                color="text-primary-600"
              />
              <ImpactStat
                number="95%"
                label="Successful Adoption Rate"
                icon="❤️"
                color="text-secondary-600"
              />
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl">
              <p className="text-gray-700 italic">
                "Pawtopia made it so easy to find our perfect companion. The entire 
                process was transparent and the shelter was incredibly supportive!"
              </p>
              <p className="mt-4 font-semibold text-gray-900">- Sarah M., Happy Adopter</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
        {icon}
      </div>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

function ImpactStat({ number, label, icon, color }: { number: string; label: string; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-4xl">{icon}</div>
      <div>
        <div className={`text-3xl font-bold ${color}`}>{number}</div>
        <div className="text-gray-600 text-sm">{label}</div>
      </div>
    </div>
  );
}
