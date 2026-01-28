'use client';

export function ShelterStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-600">Total Pets</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-600">Pending Requests</h3>
        <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-600">Successful Adoptions</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">0</p>
      </div>
    </div>
  );
}
