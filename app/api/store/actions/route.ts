import {
  addToCart,
  getCartItems,
  getProductCategories,
  getStoreProducts,
  removeFromCart,
} from '@/lib/actions/store.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getStoreProducts,
  getProductCategories,
  addToCart,
  getCartItems,
  removeFromCart,
});