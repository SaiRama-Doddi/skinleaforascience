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
      const [rows] = await pool.query('SELECT * FROM products ORDER BY id ASC');
      if (rows && rows.length > 0) {
        const enriched = rows.map(r => ProductModel.parseProductImages(r));
        cachedEnrichedProducts = enriched;
        lastCacheTime = now;
        return enriched;
      }
      return [];
    } catch (error) {
      console.error('Database product query error:', error.message);
      return [];
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
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
      return null;
    }
  }
}

module.exports = ProductModel;
