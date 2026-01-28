'use client';

const categories = [
  { id: 'food', name: 'Pet Food', icon: '🍖', count: 0 },
  { id: 'toys', name: 'Toys', icon: '🎾', count: 0 },
  { id: 'clothes', name: 'Clothes & Accessories', icon: '👕', count: 0 },
  { id: 'health', name: 'Health & Wellness', icon: '💊', count: 0 },
  { id: 'grooming', name: 'Grooming', icon: '✂️', count: 0 },
  { id: 'beds', name: 'Beds & Furniture', icon: '🛏️', count: 0 },
];

export function CategoryFilters() {
  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h3 className="font-bold text-lg mb-4">Categories</h3>
      <div className="space-y-2">
        <button className="w-full text-left px-4 py-2 rounded-lg bg-primary-50 text-primary-700 font-semibold">
          <span className="mr-2">🔥</span>
          All Products
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      <hr className="my-6" />

      <h3 className="font-bold text-lg mb-4">Price Range</h3>
      <div className="space-y-2">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">Under $20</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">$20 - $50</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">$50 - $100</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">Over $100</span>
        </label>
      </div>

      <hr className="my-6" />

      <h3 className="font-bold text-lg mb-4">Pet Type</h3>
      <div className="space-y-2">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">🐕 Dogs</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">🐈 Cats</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">🐦 Birds</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">🐇 Small Pets</span>
        </label>
      </div>
    </div>
  );
}
