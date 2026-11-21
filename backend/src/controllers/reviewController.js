const { pool } = require('../config/db');

// Public product reviews. Only admin-approved reviews are shown; customers can review
// a product only after a paid order containing it (verified buyer), once per product.

const summaryFor = async (productId) => {
  const [rows] = await pool.query(
    `SELECT rating, COUNT(*) AS cnt FROM reviews
     WHERE product_id = ? AND status = 'Approved' AND deleted_at IS NULL GROUP BY rating`,
    [productId]
  );
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let total = 0;
  let sum = 0;
  for (const r of rows) {
    const star = Math.min(5, Math.max(1, Number(r.rating)));
    breakdown[star] += Number(r.cnt);
    total += Number(r.cnt);
    sum += star * Number(r.cnt);
  }
  return { average: total ? Math.round((sum / total) * 10) / 10 : 0, count: total, breakdown };
};

// GET /api/products/:id/reviews
const getProductReviews = async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) return res.status(400).json({ success: false, message: 'Invalid product.' });
  try {
    const summary = await summaryFor(productId);
    const [reviews] = await pool.query(
      `SELECT id, customer_name, rating, title, comment, is_verified_buyer, admin_reply, admin_replied_at, created_at
       FROM reviews WHERE product_id = ? AND status = 'Approved' AND deleted_at IS NULL
       ORDER BY is_featured DESC, created_at DESC LIMIT 50`,
      [productId]
    );
    // Show first name + initial only (privacy)
    const publicReviews = reviews.map((r) => {
      const parts = String(r.customer_name || 'Customer').trim().split(/\s+/);
      return { ...r, customer_name: parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0] };
    });
    return res.status(200).json({ success: true, summary, reviews: publicReviews });
  } catch (error) {
    console.error('Load reviews failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
};

// GET /api/products/:id/reviews/eligibility (signed-in)
const getReviewEligibility = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const [[bought]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE LOWER(o.customer_email) = LOWER(?) AND oi.product_id = ? AND o.payment_status IN ('Paid', 'Partially Refunded')
         AND o.status NOT IN ('Cancelled') AND o.deleted_at IS NULL`,
      [req.user.email, productId]
    );
    const [[existing]] = await pool.query(
      'SELECT id, status FROM reviews WHERE product_id = ? AND customer_id = ? AND deleted_at IS NULL LIMIT 1',
      [productId, req.user.id]
    );
    return res.status(200).json({
      success: true,
      can_review: bought.cnt > 0 && !existing,
      has_purchased: bought.cnt > 0,
      existing_review_status: existing ? existing.status : null,
    });
  } catch (error) {
    console.error('Review eligibility failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not check review eligibility.' });
  }
};

// POST /api/products/:id/reviews (signed-in, verified buyer)
const submitReview = async (req, res) => {
  const productId = Number(req.params.id);
  const rating = Number(req.body.rating);
  const title = String(req.body.title || '').trim().slice(0, 120);
  const comment = String(req.body.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Please choose a rating from 1 to 5 stars.' });
  }
  if (comment.length < 10 || comment.length > 2000) {
    return res.status(400).json({ success: false, message: 'Please write a review between 10 and 2000 characters.' });
  }

  try {
    const [[product]] = await pool.query('SELECT id, name, image_url FROM products WHERE id = ? AND deleted_at IS NULL', [productId]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const [[bought]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE LOWER(o.customer_email) = LOWER(?) AND oi.product_id = ? AND o.payment_status IN ('Paid', 'Partially Refunded')
         AND o.status NOT IN ('Cancelled') AND o.deleted_at IS NULL`,
      [req.user.email, productId]
    );
    if (!bought.cnt) {
      return res.status(403).json({ success: false, message: 'Only customers who bought this product can review it.' });
    }

    const [[existing]] = await pool.query(
      'SELECT id FROM reviews WHERE product_id = ? AND customer_id = ? AND deleted_at IS NULL LIMIT 1',
      [productId, req.user.id]
    );
    if (existing) return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });

    await pool.query(
      `INSERT INTO reviews (product_id, product_name, product_image, customer_id, customer_name, customer_email,
         rating, title, comment, status, is_verified_buyer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 1)`,
      [product.id, product.name, product.image_url || null, req.user.id, req.user.name || 'Customer', req.user.email, rating, title || null, comment]
    );
    return res.status(201).json({ success: true, message: 'Thank you! Your review will appear once it has been approved.' });
  } catch (error) {
    console.error('Submit review failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not submit your review. Please try again.' });
  }
};

module.exports = { getProductReviews, getReviewEligibility, submitReview, summaryFor };
