'use server';

import { createClient } from '@/lib/supabase/server';

export async function getStoreProducts(categoryId?: string) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('store_products')
      .select(`
        *,
        category:category_id (
          id,
          name,
          icon
        )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: products || [] };
  } catch (error) {
    console.error('Get store products error:', error);
    return { success: false, error: 'Failed to fetch products' };
  }
}

export async function getProductCategories() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('store_categories')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    // Get product count for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category: any) => {
        const { count } = await supabase
          .from('store_products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_available', true);

        return {
          ...category,
          productCount: count || 0,
        };
      })
    );

    return { success: true, data: categoriesWithCounts };
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function addToCart(productId: string, quantity: number = 1) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if product already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Add new item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to add to cart' };
  }
}

export async function getCartItems() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:product_id (
          id,
          name,
          price,
          image_url,
          is_available
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: cartItems || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch cart' };
  }
}

export async function removeFromCart(cartItemId: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to remove from cart' };
  }
}
