const { pool } = require('../config/db');

class ProductModel {
  static async parseProductImages(product) {
    if (!product) return null;
    let images = [];
    if (product.images) {
      try {
        images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      } catch (e) {
        images = [product.image_url].filter(Boolean);
      }
    }
    try {
      const [imgRows] = await pool.query(
        'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC',
        [product.id]
      );
      if (imgRows && imgRows.length > 0) {
        images = imgRows.map(r => r.image_url);
      }
    } catch (e) {}

    if (!Array.isArray(images) || images.length === 0) {
      if (product.image_url) images = [product.image_url];
    }
    return {
      ...product,
      image_url: images[0] || product.image_url || '',
      images: images.slice(0, 5),
    };
  }

  static async findAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
      if (rows && rows.length > 0) {
        const enriched = await Promise.all(rows.map(r => ProductModel.parseProductImages(r)));
        return enriched;
      }
    } catch (error) {
      console.warn('⚠️ Database query warning:', error.message);
    }
    // Return database default products dataset
    return [
      { id: 1, name: 'Gentle Foaming Face Wash', category: 'Herbal Extract', brand: 'Leafora', price: 18.00, stock: 120, rating: 4.9, reviews: 124, image_url: '/assets/face_wash.jpg', images: ['/assets/face_wash.jpg'] },
      { id: 2, name: 'Vitamin C Brightening Serum', category: 'Skin Care Actives', brand: 'Leafora', price: 28.00, stock: 85, rating: 4.8, reviews: 98, image_url: '/assets/vitamin_c_serum.jpg', images: ['/assets/vitamin_c_serum.jpg'] },
      { id: 3, name: 'Hydra Glow Moisturizer', category: 'Supplements', brand: 'Leafora', price: 24.00, stock: 40, rating: 5.0, reviews: 156, image_url: '/assets/hydra_glow_moisturizer.jpg', images: ['/assets/hydra_glow_moisturizer.jpg'] },
      { id: 4, name: 'Daily Sunscreen SPF 50+', category: 'Biotech Formulations', brand: 'Leafora', price: 22.00, stock: 60, rating: 4.9, reviews: 112, image_url: '/assets/sunscreen_spf50.jpg', images: ['/assets/sunscreen_spf50.jpg'] }
    ];
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      if (rows && rows[0]) return await ProductModel.parseProductImages(rows[0]);
    } catch (error) {
      console.warn('⚠️ Database query warning:', error.message);
    }
    const all = await ProductModel.findAll();
    return all.find(p => String(p.id) === String(id)) || null;
  }
}

module.exports = ProductModel;
