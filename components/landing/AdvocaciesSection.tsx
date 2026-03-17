export function AdvocaciesSection() {
  const advocacies = [
    {
      icon: '🏡',
      title: 'Adopt, Don&apos;t Shop',
      description: 'Promote pet adoption to give stray and homeless animals a second chance at life.',
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: '⚕️',
      title: 'Spay and Neuter',
      description: 'Help control the pet population by encouraging responsible pet sterilization.',
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      icon: '📢',
      title: 'Foster Awareness',
      description: 'Spread the word about pet adoption and responsible pet ownership.',
      color: 'from-primary-400 to-secondary-500'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Advocacies
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We&apos;re committed to creating a better world for every pet
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {advocacies.map((advocacy, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-200"
            >
              {/* Icon */}
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${advocacy.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <span className="text-4xl">{advocacy.icon}</span>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {advocacy.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {advocacy.description}
              </p>

              {/* Decorative element */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${advocacy.color} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity`}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
