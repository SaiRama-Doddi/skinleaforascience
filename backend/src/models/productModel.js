const { pool } = require('../config/db');

// In-memory cache for fast product responses (< 5ms)
let cachedEnrichedProducts = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds TTL

const fallbackProducts = [
  {
    id: 1,
    name: 'Pharma Grade LeafExtract Pure Actives',
    brand: 'Leafora',
    sku: 'LFA-EXT-01',
    category: 'Herbal Extracts',
    price: 49.99,
    stock: 120,
    description: 'Pharma-grade pure organic botanical extract serum formulated for deep cellular rejuvenation.',
    image_url: '/assets/skincare_story_showcase.jpg',
    images: ['/assets/skincare_story_showcase.jpg', '/assets/leafora_golden_promo.jpg'],
    is_active: 1,
    is_featured: 1,
    is_trending: 1,
    is_new_arrival: 1,
  },
  {
    id: 2,
    name: 'BioVital Botanical Moisturizer',
    brand: 'Leafora',
    sku: 'LFA-MOIST-02',
    category: 'Skin Care Actives',
    price: 34.50,
    stock: 85,
    description: 'Deep hydration botanical face cream with natural hyaluronic acid and herbal extracts.',
    image_url: '/assets/leafora_hero_model.jpg',
    images: ['/assets/leafora_hero_model.jpg', '/assets/skincare_story_showcase.jpg'],
    is_active: 1,
    is_featured: 1,
    is_trending: 1,
    is_new_arrival: 1,
  },
  {
    id: 3,
    name: 'EcoScience Vitamin C Radiance Serum',
    brand: 'Leafora',
    sku: 'LFA-SERUM-03',
    category: 'Facial Serums',
    price: 59.00,
    stock: 40,
    description: 'Concentrated 20% Vitamin C serum with ferulic acid for bright, luminous complexion.',
    image_url: '/assets/login_botanical_products-_FX_J9Y-.jpg',
    images: ['/assets/login_botanical_products-_FX_J9Y-.jpg', '/assets/leafora_golden_promo.jpg'],
    is_active: 1,
    is_featured: 1,
    is_trending: 1,
    is_new_arrival: 0,
  },
  {
    id: 4,
    name: 'Pure Organic Aloe Vera Actives Gel Base',
    brand: 'Leafora',
    sku: 'LFA-ALOE-04',
    category: 'Skin Care Actives',
    price: 19.99,
    stock: 60,
    description: '100% pure cold-pressed organic aloe vera soothing gel for skin repair and calm.',
    image_url: '/assets/skincare_story_showcase-COWI9qg9.jpg',
    images: ['/assets/skincare_story_showcase-COWI9qg9.jpg'],
    is_active: 1,
    is_featured: 1,
    is_trending: 0,
    is_new_arrival: 1,
  },
  {
    id: 5,
    name: 'Curcumin 95% Active Potency Extract',
    brand: 'Leafora',
    sku: 'LFA-CURC-05',
    category: 'Herbal Extracts',
    price: 65.00,
    stock: 50,
    description: 'High potency 95% standardized curcuminoids extract for anti-inflammatory antioxidant care.',
    image_url: '/assets/leafora_golden_promo.jpg',
    images: ['/assets/leafora_golden_promo.jpg', '/assets/heroimage-BXHASFy3.jpeg'],
    is_active: 1,
    is_featured: 1,
    is_trending: 1,
    is_new_arrival: 0,
  },
  {
    id: 6,
    name: 'Gentle Botanical Cleansing Facial Wash',
    brand: 'Leafora',
    sku: 'LFA-WASH-06',
    category: 'Facial Serums',
    price: 24.99,
    stock: 95,
    description: 'Sulfate-free botanical gel cleanser enriched with chamomile and green tea extract.',
    image_url: '/assets/heroimage-BXHASFy3.jpeg',
    images: ['/assets/heroimage-BXHASFy3.jpeg', '/assets/leafora_hero_model.jpg'],
    is_active: 1,
    is_featured: 0,
    is_trending: 1,
    is_new_arrival: 1,
  }
];

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
      images: uniqueImages.slice(0, 2),
    };
  }

  static async findAll() {
    // Return cached products if valid
    const now = Date.now();
    if (cachedEnrichedProducts && (now - lastCacheTime < CACHE_TTL_MS)) {
      return cachedEnrichedProducts;
    }

    try {
      let rows;
      try {
        const queryPromise = pool.query('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY id ASC');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DB Query Timeout')), 3000)
        );
        const [r] = await Promise.race([queryPromise, timeoutPromise]);
        rows = r;
      } catch (colErr) {
        const queryPromise = pool.query('SELECT * FROM products ORDER BY id ASC');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DB Query Timeout')), 3000)
        );
        const [r] = await Promise.race([queryPromise, timeoutPromise]);
        rows = r;
      }

      if (rows && rows.length > 0) {
        const enriched = rows.map(r => ProductModel.parseProductImages(r));
        cachedEnrichedProducts = enriched;
        lastCacheTime = now;
        return enriched;
      }
    } catch (error) {
      console.warn('⚠️ Database product query notice (using fallback):', error.message);
    }

    cachedEnrichedProducts = fallbackProducts;
    lastCacheTime = now;
    return fallbackProducts;
  }

  static async findById(id) {
    try {
      const queryPromise = pool.query('SELECT * FROM products WHERE id = ?', [id]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB Query Timeout')), 1200)
      );

      const [rows] = await Promise.race([queryPromise, timeoutPromise]);
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
    return all.find(p => String(p.id) === String(id)) || fallbackProducts[0];
  }
}

module.exports = ProductModel;
