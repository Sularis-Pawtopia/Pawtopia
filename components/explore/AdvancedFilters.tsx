'use client';

export function AdvancedFilters() {
  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4 space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-3">Species</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" name="species" className="mr-2" defaultChecked />
            <span className="text-sm">All Pets</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="species" className="mr-2" />
            <span className="text-sm">🐕 Dogs</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="species" className="mr-2" />
            <span className="text-sm">🐈 Cats</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="species" className="mr-2" />
            <span className="text-sm">🐦 Birds</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="species" className="mr-2" />
            <span className="text-sm">🐇 Others</span>
          </label>
        </div>
      </div>

      <hr />

      <div>
        <h3 className="font-bold text-lg mb-3">Age</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Puppy/Kitten (0-1y)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Young (1-3y)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Adult (3-7y)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Senior (7+y)</span>
          </label>
        </div>
      </div>

      <hr />

      <div>
        <h3 className="font-bold text-lg mb-3">Size</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Small (0-25 lbs)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Medium (25-50 lbs)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Large (50-100 lbs)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Extra Large (100+ lbs)</span>
          </label>
        </div>
      </div>

      <hr />

      <div>
        <h3 className="font-bold text-lg mb-3">Characteristics</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Good with kids</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Good with pets</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">House trained</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Special needs</span>
          </label>
        </div>
      </div>

      <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
        Apply Filters
      </button>
    </div>
  );
}
