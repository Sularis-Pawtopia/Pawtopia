import { getStoreProducts } from '@/lib/actions/store.actions';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Navbar } from '@/components/layout/Navbar';
import { StoreHeader } from '@/components/store/StoreHeader';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CategoryFilters } from '@/components/store/CategoryFilters';

export default async function StorePage() {
  const user = await getCurrentUser();
  const productsResult = await getStoreProducts();
  const products = productsResult.success ? productsResult.data : [];

  return (
    <>
      <Navbar user={user} />
      <div className="min-h-screen bg-gray-50">
        <StoreHeader />

        <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0">
            <CategoryFilters />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                All Products ({products?.length || 0})
              </h2>
              <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
                <option>Most Popular</option>
              </select>
            </div>

            {products && products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-gray-600">No products available at the moment</p>
              </div>
            )}
          </main>
        </div>
        </div>
      </div>
    </>
  );
}