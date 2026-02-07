'use client';

export function ProductGrid({ products }: { products: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
        >
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-100 overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🎁
              </div>
            )}
            {product.discount_percentage > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                -{product.discount_percentage}%
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-1">
              {product.category?.name || 'Uncategorized'}
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </div>
                {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                  <div className="text-xs text-primary-600">
                    Only {product.stock_quantity} left!
                  </div>
                )}
                {product.stock_quantity === 0 && (
                  <div className="text-xs text-red-600 font-semibold">Out of Stock</div>
                )}
              </div>

              <button
                disabled={product.stock_quantity === 0}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🛒 Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
