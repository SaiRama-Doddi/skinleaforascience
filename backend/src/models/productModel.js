const { pool } = require('../config/db');

// In-memory cache for fast product responses (< 5ms)
let cachedEnrichedProducts = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds TTL

class ProductModel {
  static clearCache() {
    cachedEnrichedProducts = null;
    lastCacheTime = 0;
  }

  static parseProductImages(product) {
    if (!product) return null;
    let images = [];
    if (product.images) {
      try {
        images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      } catch (e) {
        images = [product.image_url].filter(Boolean);
      }
    }

    if (!Array.isArray(images) || images.length === 0) {
      if (product.image_url) images = [product.image_url];
    }

    const uniqueImages = Array.from(new Set(images.filter(Boolean)));
    const primaryImg = uniqueImages[0] || product.image_url || '';

    return {
      ...product,
      image_url: primaryImg,
      images: uniqueImages,
    };
  }

  static async findAll() {
    // Return cached products if valid
    const now = Date.now();
    if (cachedEnrichedProducts && (now - lastCacheTime < CACHE_TTL_MS)) {
      return cachedEnrichedProducts;
    }

    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE (is_active = 1 OR is_active IS NULL) AND (deleted_at IS NULL) ORDER BY id ASC');
      if (rows && rows.length > 0) {
        // Real rating + review count from approved reviews
        let ratings = [];
        try {
          [ratings] = await pool.query(
            `SELECT product_id, ROUND(AVG(rating), 1) AS rating, COUNT(*) AS reviews_count
             FROM reviews WHERE status = 'Approved' AND deleted_at IS NULL GROUP BY product_id`
          );
        } catch (e) {
          console.warn('Review summary unavailable:', e.message);
        }
        const byProduct = new Map(ratings.map((r) => [r.product_id, r]));
        const enriched = rows.map(r => ({
          ...ProductModel.parseProductImages(r),
          rating: Number(byProduct.get(r.id)?.rating || 0),
          reviews_count: Number(byProduct.get(r.id)?.reviews_count || 0),
        }));
        cachedEnrichedProducts = enriched;
        lastCacheTime = now;
        return enriched;
      }
      return [];
    } catch (error) {
      console.error('Database product query error:', error.message);
      throw error; // surface as HTTP 500 instead of pretending the catalogue is empty
    }
  }

  static async findById(id) {
    try {
      // Storefront: hidden (inactive) and trashed products are not viewable
      const [rows] = await pool.query(
        'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL AND (is_active = 1 OR is_active IS NULL)',
        [id]
      );
      if (rows && rows[0]) {
        const prod = ProductModel.parseProductImages(rows[0]);
        try {
          const [imgRows] = await pool.query(
            'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC',
            [id]
          );
          if (imgRows && imgRows.length > 0) {
            prod.images = Array.from(new Set([...prod.images, ...imgRows.map(r => r.image_url)]));
          }
        } catch (e) {}
        return prod;
      }
      return null;
    } catch (error) {
      console.error('Database product query error:', error.message);
      throw error;
    }
  }
}

module.exports = ProductModel;
