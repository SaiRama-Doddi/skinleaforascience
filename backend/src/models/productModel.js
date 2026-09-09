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

    // Filter out duplicates and nulls
    const uniqueImages = Array.from(new Set(images.filter(Boolean)));
    const primaryImg = uniqueImages[0] || product.image_url || '';

    return {
      ...product,
      image_url: primaryImg,
      images: uniqueImages.slice(0, 2), // Keep max 2 images for fast catalog listing
    };
  }

  static async findAll() {
    if (cachedEnrichedProducts && (Date.now() - lastCacheTime < CACHE_TTL_MS)) {
      return cachedEnrichedProducts;
    }

    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY id DESC');
      if (rows && rows.length > 0) {
        const enriched = rows.map(r => ProductModel.parseProductImages(r));
        cachedEnrichedProducts = enriched;
        lastCacheTime = Date.now();
        return enriched;
      }
    } catch (error) {
      console.warn('⚠️ Database query warning:', error.message);
    }
    return [];
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
    } catch (error) {
      console.warn('⚠️ Database query warning:', error.message);
    }
    const all = await ProductModel.findAll();
    return all.find(p => String(p.id) === String(id)) || null;
  }
}

module.exports = ProductModel;
