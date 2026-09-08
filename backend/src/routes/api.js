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
router.post('/admin/categories/:id/restore', adminController.restoreCategory);
router.post('/admin/categories/bulk-status', adminController.bulkCategoryStatus);
router.post('/admin/categories/reorder', adminController.reorderCategories);
router.get('/admin/categories/export', adminController.exportCategoriesCsv);
router.post('/admin/categories/import', adminController.importCategoriesCsv);

// ─── ADMIN PRODUCT CONTROL ───
router.get('/admin/products', adminController.getProducts);
router.post('/admin/products', adminController.addProduct);
router.put('/admin/products/:id', adminController.updateProduct);
router.delete('/admin/products/:id', adminController.deleteProduct);
router.post('/admin/products/:id/restore', adminController.restoreProduct);
router.post('/admin/products/:id/duplicate', adminController.duplicateProduct);
router.post('/admin/products/bulk-upload', adminController.bulkUploadProducts);
router.post('/admin/products/bulk-action', adminController.bulkProductAction);
router.get('/admin/products/export', adminController.exportProductsCsv);
router.post('/admin/products/import', adminController.importProductsCsv);
router.post('/admin/products/:id/notify-vendor', adminController.notifyVendor);

// ─── ADMIN ORDERS CONTROL ───
router.get('/admin/orders/export', adminController.exportOrdersCsv);
router.get('/admin/orders', adminController.getOrders);
router.get('/admin/orders/:id', adminController.getOrderDetails);
router.put('/admin/orders/:id', adminController.updateOrderDetails);
router.put('/admin/orders/:id/status', adminController.updateOrderStatus);
router.post('/admin/orders/:id/cancel', adminController.cancelOrder);
router.post('/admin/orders/:id/refund', adminController.refundOrder);
router.post('/admin/orders/:id/return', adminController.returnOrder);
router.post('/admin/orders/:id/exchange', adminController.exchangeOrder);
router.post('/admin/orders/:id/timeline', adminController.addOrderTimelineEvent);
router.post('/admin/orders/bulk-action', adminController.bulkOrderAction);

// ─── ADMIN CUSTOMERS CONTROL ───
router.get('/admin/customers/export', adminController.exportCustomers);
router.get('/admin/customers', adminController.getCustomers);
router.get('/admin/customers/:id', adminController.getCustomerDetails);
router.put('/admin/customers/:id', adminController.updateCustomer);
router.put('/admin/customers/:id/status', adminController.updateCustomerStatus);
router.put('/admin/customers/:id/wallet-points', adminController.updateCustomerWalletPoints);
router.delete('/admin/customers/:id', adminController.deleteCustomer);
router.post('/admin/customers/:id/restore', adminController.restoreCustomer);

// ─── ADMIN REVENUE & PAYMENTS CONTROL ───
router.get('/admin/payments', adminController.getPayments);
router.get('/admin/payments/gateways', adminController.getPaymentGatewaysConfig);
router.put('/admin/payments/gateways', adminController.updatePaymentGatewayConfig);
router.post('/admin/payments/:id/refund', adminController.issueRefund);
router.post('/admin/payments/:id/retry', adminController.retryFailedPayment);
router.post('/admin/payments/:id/mark-cod-collected', adminController.markCodCollected);
router.get('/admin/payments/refunds-log', adminController.getPaymentRefundsLog);
router.get('/admin/payments/settlements', adminController.getPaymentSettlements);
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
router.get('/admin/coupons/analytics', adminController.getCouponAnalytics);
router.get('/admin/coupons/usage-history', adminController.getCouponUsageHistory);
router.get('/admin/coupons/export', adminController.exportCouponsCsv);
router.post('/admin/coupons', adminController.createCoupon);
router.post('/admin/coupons/bulk-generate', adminController.bulkGenerateCoupons);
router.get('/admin/coupons/:id', adminController.getCouponDetails);
router.put('/admin/coupons/:id', adminController.updateCoupon);
router.post('/admin/coupons/:id/status', adminController.updateCouponStatus);
router.delete('/admin/coupons/:id', adminController.deleteCoupon);
router.post('/admin/coupons/:id/restore', adminController.restoreCoupon);

// ─── ADMIN SHIPROCKET SHIPPING CONTROL ───
router.get('/admin/shiprocket/config', adminController.getShiprocketConfig);
router.put('/admin/shiprocket/config', adminController.updateShiprocketConfig);

router.get('/admin/shiprocket/pickup-locations', adminController.getShiprocketPickupLocations);
router.post('/admin/shiprocket/pickup-locations', adminController.addShiprocketPickupLocation);
router.put('/admin/shiprocket/pickup-locations/:id', adminController.updateShiprocketPickupLocation);
router.delete('/admin/shiprocket/pickup-locations/:id', adminController.deleteShiprocketPickupLocation);

router.post('/admin/shiprocket/calculate-rates', adminController.calculateShippingRates);

router.get('/admin/shiprocket/shipments', adminController.getShiprocketShipments);
router.post('/admin/shiprocket/generate-awb', adminController.generateShiprocketAwb);
router.post('/admin/shiprocket/shipments/:id/schedule-pickup', adminController.scheduleShiprocketPickup);
router.get('/admin/shiprocket/shipments/:id/label', adminController.generateShiprocketLabel);
router.post('/admin/shiprocket/shipments/:id/cancel', adminController.cancelShiprocketShipment);
router.get('/admin/shiprocket/shipments/:id/track', adminController.trackShiprocketShipment);

router.get('/admin/shiprocket/ndr', adminController.getShiprocketNdr);
router.post('/admin/shiprocket/ndr/:id/resolve', adminController.resolveShiprocketNdr);

router.get('/admin/shiprocket/manifests', adminController.getShiprocketManifests);
router.post('/admin/shiprocket/generate-manifest', adminController.generateShiprocketManifest);

module.exports = router;

