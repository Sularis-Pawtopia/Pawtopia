'use client';

export function StoreHeader() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">🛍️ Pet Care Store</h1>
        <p className="text-lg text-purple-100 max-w-2xl mb-6">
          Everything your furry friend needs - from nutritious food to fun toys!
          All proceeds support shelter operations.
        </p>

        <div className="flex gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
            <div className="text-2xl font-bold">Free Shipping</div>
            <div className="text-sm text-purple-100">On orders over $50</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
            <div className="text-2xl font-bold">30-Day Returns</div>
            <div className="text-sm text-purple-100">Money-back guarantee</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
            <div className="text-2xl font-bold">Support Shelters</div>
            <div className="text-sm text-purple-100">100% of profits donated</div>
          </div>
        </div>
      </div>
    </div>
  );
}
