const ProductModel = require('../models/productModel');

const getAllProducts = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=60');
    const products = await ProductModel.findAll();
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/products/:id/image?i=0
// Product photos are stored as base64 data URLs in the database. This serves one as a real,
// cacheable image so pages (orders, invoices, e-mails) can reference a short URL instead.
const { pool } = require('../config/db');

const getProductImage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const index = Math.max(0, Math.min(4, Number(req.query.i) || 0));
    if (!Number.isInteger(id) || id <= 0) return res.status(400).end();

    const [[product]] = await pool.query('SELECT image_url, images FROM products WHERE id = ?', [id]);
    if (!product) return res.status(404).end();

    const [imgRows] = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC', [id]
    );
    let list = imgRows.map((r) => r.image_url).filter(Boolean);
    if (list.length === 0) {
      try { list = (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) || []; } catch (e) { list = []; }
    }
    if (list.length === 0 && product.image_url) list = [product.image_url];
    const src = list[index] || list[0];
    if (!src) return res.status(404).end();

    // Public product photos are embedded in e-mails and invoices opened elsewhere;
    // helmet's default (same-origin) would make browsers/webmail refuse to show them.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const match = /^data:(image\/(?:jpeg|jpg|png|webp|gif|avif));base64,(.+)$/s.exec(src);
    if (match) {
      res.setHeader('Content-Type', match[1] === 'image/jpg' ? 'image/jpeg' : match[1]);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.send(Buffer.from(match[2], 'base64'));
    }
    // Regular URL (uploads/ or external): send the browser there
    if (/^(https?:\/\/|\/)/.test(src)) return res.redirect(302, src);
    return res.status(404).end();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProductImage,
  getAllProducts,
  getProductById,
};
