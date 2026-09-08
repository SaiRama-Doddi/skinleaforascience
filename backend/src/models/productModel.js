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
      const enriched = await Promise.all(rows.map(r => ProductModel.parseProductImages(r)));
      return enriched;
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.warn('⚠️ Table "products" does not exist yet. Returning sample data.');
        return [
          { id: 1, name: 'LeafExtract Pharma Grade', category: 'Herbal Extract', price: 49.99, stock: 120, image_url: '/assets/vitamin_c_serum.jpg', images: ['/assets/vitamin_c_serum.jpg', '/assets/hydra_glow_moisturizer.jpg'] },
          { id: 2, name: 'BioVital Nutraceutical', category: 'Supplements', price: 29.50, stock: 85, image_url: '/assets/hydra_glow_moisturizer.jpg', images: ['/assets/hydra_glow_moisturizer.jpg'] },
          { id: 3, name: 'EcoScience Active Solution', category: 'Biotech Formulation', price: 89.00, stock: 40, image_url: '/assets/face_wash.jpg', images: ['/assets/face_wash.jpg'] },
        ];
      }
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      if (!rows[0]) return null;
      return await ProductModel.parseProductImages(rows[0]);
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return { id, name: 'Sample Product', category: 'Life Science', price: 50.00, stock: 10, image_url: '/assets/vitamin_c_serum.jpg', images: ['/assets/vitamin_c_serum.jpg'] };
      }
      throw error;
    }
  }
}

module.exports = ProductModel;
