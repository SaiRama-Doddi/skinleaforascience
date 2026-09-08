const express = require('express');
const { getHealthStatus } = require('../controllers/healthController');
const { getAllProducts, getProductById } = require('../controllers/productController');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Health Check Endpoint
router.get('/health', getHealthStatus);

// Public Product Endpoints
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);

// ─── ADMIN AUTHENTICATION ───
router.post('/admin/send-otp', adminController.sendOtp);
router.post('/admin/verify-otp', adminController.verifyOtp);

// ─── ADMIN DASHBOARD ANALYTICS & UPLOADS ───
router.get('/admin/analytics', adminController.getAnalytics);
router.post('/admin/upload', adminController.uploadImage);

// ─── ADMIN CATEGORY CONTROL ───
router.get('/admin/categories', adminController.getCategories);
router.post('/admin/categories', adminController.addCategory);
router.put('/admin/categories/:id', adminController.updateCategory);
router.delete('/admin/categories/:id', adminController.deleteCategory);

// ─── ADMIN PRODUCT CONTROL ───
router.get('/admin/products', adminController.getProducts);
router.post('/admin/products', adminController.addProduct);
router.put('/admin/products/:id', adminController.updateProduct);
router.delete('/admin/products/:id', adminController.deleteProduct);
router.post('/admin/products/:id/duplicate', adminController.duplicateProduct);
router.post('/admin/products/bulk-upload', adminController.bulkUploadProducts);
router.post('/admin/products/:id/notify-vendor', adminController.notifyVendor);

// ─── ADMIN ORDERS CONTROL ───
router.get('/admin/orders', adminController.getOrders);
router.put('/admin/orders/:id/status', adminController.updateOrderStatus);

// ─── ADMIN CUSTOMERS CONTROL ───
router.get('/admin/customers', adminController.getCustomers);
router.put('/admin/customers/:id', adminController.updateCustomer);
router.get('/admin/customers/export', adminController.exportCustomers);

// ─── ADMIN REVENUE CONTROL ───
router.get('/admin/payments', adminController.getPayments);
router.post('/admin/payments/:id/refund', adminController.issueRefund);
router.get('/admin/revenue/export', adminController.exportRevenueReport);

// ─── ADMIN REVIEWS CONTROL ───
router.get('/admin/reviews', adminController.getReviews);
router.put('/admin/reviews/:id', adminController.updateReviewStatus);
router.delete('/admin/reviews/:id', adminController.deleteReview);

// ─── ADMIN REFERRALS CONTROL ───
router.get('/admin/referrals', adminController.getReferrals);
router.put('/admin/referrals/:id', adminController.updateReferralStatus);

// ─── ADMIN COUPONS CONTROL ───
router.get('/admin/coupons', adminController.getCoupons);
router.post('/admin/coupons', adminController.addCoupon);
router.put('/admin/coupons/:id', adminController.updateCouponStatus);

module.exports = router;
