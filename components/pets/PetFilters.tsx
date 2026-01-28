'use client';

export function PetFilters() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Species
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
          </select>
        </div>
      </div>
    </div>
  );
}
