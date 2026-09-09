import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('leafora_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Request Error:', error?.response?.data || error.message);
    return Promise.reject(error?.response?.data || { message: error.message });
  }
);

// Public API
export const checkHealth = () => api.get('/health');
export const getProducts = () => api.get('/products');
export const getProductById = (id) => api.get(`/products/${id}`);
export const getCategories = (params) => api.get('/categories', { params });

// Admin Auth API
export const adminSendOtp = (email) => api.post('/admin/send-otp', { email });
export const adminVerifyOtp = (email, otp) => api.post('/admin/verify-otp', { email, otp });

// Admin Analytics & Controls API
export const adminGetAnalytics = () => api.get('/admin/analytics');
export const adminUploadImage = (imageData) => api.post('/admin/upload', { image_data: imageData });

// Category Controls
export const adminGetCategories = (params) => api.get('/admin/categories', { params });
export const adminAddCategory = (data) => api.post('/admin/categories', data);
export const adminUpdateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const adminDeleteCategory = (id, force = false) => api.delete(`/admin/categories/${id}${force ? '?force=true' : ''}`);
export const adminRestoreCategory = (id) => api.post(`/admin/categories/${id}/restore`);
export const adminBulkCategoryStatus = (ids, action) => api.post('/admin/categories/bulk-status', { ids, action });
export const adminReorderCategories = (orders) => api.post('/admin/categories/reorder', { orders });
export const adminExportCategoriesUrl = '/api/admin/categories/export';
export const adminImportCategoriesCsv = (data) => api.post('/admin/categories/import', data);

// Product Controls
export const adminGetProducts = (params) => api.get('/admin/products', { params });
export const adminAddProduct = (data) => api.post('/admin/products', data);
export const adminUpdateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id, force = false) => api.delete(`/admin/products/${id}${force ? '?force=true' : ''}`);
export const adminRestoreProduct = (id) => api.post(`/admin/products/${id}/restore`);
export const adminDuplicateProduct = (id) => api.post(`/admin/products/${id}/duplicate`);
export const adminBulkUploadProducts = (items) => api.post('/admin/products/bulk-upload', { items });
export const adminBulkProductAction = (ids, action, extra = {}) => api.post('/admin/products/bulk-action', { ids, action, ...extra });
export const adminExportProductsUrl = '/api/admin/products/export';
export const adminImportProductsCsv = (data) => api.post('/admin/products/import', data);
export const adminNotifyVendor = (id) => api.post(`/admin/products/${id}/notify-vendor`);

// Order Controls
export const adminGetOrders = (params) => api.get('/admin/orders', { params });
export const adminGetOrderDetails = (id) => api.get(`/admin/orders/${id}`);
export const adminUpdateOrderDetails = (id, data) => api.put(`/admin/orders/${id}`, data);
export const adminUpdateOrderStatus = (id, status, shipping_partner) => api.put(`/admin/orders/${id}/status`, { status, shipping_partner });
export const adminCancelOrder = (id, reason) => api.post(`/admin/orders/${id}/cancel`, { reason });
export const adminRefundOrder = (id, amount, reason) => api.post(`/admin/orders/${id}/refund`, { amount, reason });
export const adminReturnOrder = (id, reason) => api.post(`/admin/orders/${id}/return`, { reason });
export const adminExchangeOrder = (id, exchange_notes) => api.post(`/admin/orders/${id}/exchange`, { exchange_notes });
export const adminAddOrderTimeline = (id, data) => api.post(`/admin/orders/${id}/timeline`, data);
export const adminBulkOrdersAction = (ids, action, extra = {}) => api.post('/admin/orders/bulk-action', { ids, action, ...extra });
export const adminExportOrdersUrl = '/api/admin/orders/export';

// Customer Controls
export const adminGetCustomers = (params) => api.get('/admin/customers', { params });
export const adminGetCustomerDetails = (id) => api.get(`/admin/customers/${id}`);
export const adminUpdateCustomer = (id, data) => api.put(`/admin/customers/${id}`, data);
export const adminUpdateCustomerStatus = (id, status) => api.put(`/admin/customers/${id}/status`, { status });
export const adminUpdateCustomerWalletPoints = (id, data) => api.put(`/admin/customers/${id}/wallet-points`, data);
export const adminDeleteCustomer = (id, force = false) => api.delete(`/admin/customers/${id}${force ? '?force=true' : ''}`);
export const adminRestoreCustomer = (id) => api.post(`/admin/customers/${id}/restore`);
export const adminExportCustomersUrl = '/api/admin/customers/export';

// Revenue & Payments Controls
export const adminGetPayments = (params) => api.get('/admin/payments', { params });
export const adminGetPaymentGatewaysConfig = () => api.get('/admin/payments/gateways');
export const adminUpdatePaymentGatewayConfig = (data) => api.put('/admin/payments/gateways', data);
export const adminIssueRefund = (id, data = {}) => api.post(`/admin/payments/${id}/refund`, data);
export const adminRetryFailedPayment = (id) => api.post(`/admin/payments/${id}/retry`);
export const adminMarkCodCollected = (id) => api.post(`/admin/payments/${id}/mark-cod-collected`);
export const adminGetPaymentRefundsLog = () => api.get('/admin/payments/refunds-log');
export const adminGetPaymentSettlements = () => api.get('/admin/payments/settlements');
export const adminExportRevenueUrl = '/api/admin/revenue/export';

// Reviews Controls
export const adminGetReviews = (params) => api.get('/admin/reviews', { params });
export const adminGetReviewDetails = (id) => api.get(`/admin/reviews/${id}`);
export const adminUpdateReviewStatus = (id, data) => api.put(`/admin/reviews/${id}`, data);
export const adminReplyToReview = (id, data) => api.post(`/admin/reviews/${id}/reply`, data);
export const adminReportAbuseReview = (id, data) => api.post(`/admin/reviews/${id}/report-abuse`, data);
export const adminRestoreReview = (id) => api.post(`/admin/reviews/${id}/restore`);
export const adminDeleteReview = (id, force = false) => api.delete(`/admin/reviews/${id}`, { params: { force } });
export const adminGetReviewAnalytics = () => api.get('/admin/reviews/analytics');
export const adminExportReviewsUrl = `${API_BASE_URL}/admin/reviews/export`;

// Homepage CMS Controls
export const adminGetHomepageBanners = (params) => api.get('/admin/homepage/banners', { params });
export const adminCreateHomepageBanner = (data) => api.post('/admin/homepage/banners', data);
export const adminUpdateHomepageBanner = (id, data) => api.put(`/admin/homepage/banners/${id}`, data);
export const adminDeleteHomepageBanner = (id) => api.delete(`/admin/homepage/banners/${id}`);
export const adminReorderHomepageBanners = (orders) => api.post('/admin/homepage/banners/reorder', { orders });

export const adminGetHomepageSections = () => api.get('/admin/homepage/sections');
export const adminUpdateHomepageSection = (id, data) => api.put(`/admin/homepage/sections/${id}`, data);
export const adminReorderHomepageSections = (orders) => api.post('/admin/homepage/sections/reorder', { orders });

export const adminGetCuratedProducts = () => api.get('/admin/homepage/curated-products');
export const adminCurateProducts = (data) => api.post('/admin/homepage/curate-products', data);

// System Settings Controls
export const adminGetSystemSettings = () => api.get('/admin/system/settings');
export const adminUpdateSystemSettingsGroup = (data) => api.put('/admin/system/settings', { settings: data });

export const adminGetSystemUsers = () => api.get('/admin/system/users');
export const adminCreateSystemUser = (data) => api.post('/admin/system/users', data);
export const adminUpdateSystemUser = (id, data) => api.put(`/admin/system/users/${id}`, data);
export const adminDeleteSystemUser = (id) => api.delete(`/admin/system/users/${id}`);

export const adminGetSystemRoles = () => api.get('/admin/system/roles');
export const adminUpdateSystemRole = (id, data) => api.put(`/admin/system/roles/${id}`, data);

export const adminGetActivityLogs = () => api.get('/admin/system/activity-logs');
export const adminGetLoginHistory = () => api.get('/admin/system/login-history');
export const adminExportBackupUrl = `${API_BASE_URL}/admin/system/backup`;

// Referrals & Wallet Controls
export const adminGetReferrals = (params) => api.get('/admin/referrals', { params });
export const adminUpdateReferralStatus = (id, data) => api.post(`/admin/referrals/${id}/status`, data);
export const adminGetReferralSettings = () => api.get('/admin/referrals/settings');
export const adminUpdateReferralSettings = (data) => api.put('/admin/referrals/settings', data);
export const adminGetReferralAnalytics = () => api.get('/admin/referrals/analytics');
export const adminExportReferralsUrl = `${API_BASE_URL}/admin/referrals/export`;

export const adminGetWalletTransactions = (params) => api.get('/admin/wallet/transactions', { params });
export const adminManualWalletAdjustment = (data) => api.post('/admin/wallet/adjustment', data);
export const adminExportWalletTransactionsUrl = `${API_BASE_URL}/admin/wallet/export`;

// Coupons Controls
export const adminGetCoupons = (params) => api.get('/admin/coupons', { params });
export const adminGetCouponDetails = (id) => api.get(`/admin/coupons/${id}`);
export const adminCreateCoupon = (data) => api.post('/admin/coupons', data);
export const adminAddCoupon = (data) => api.post('/admin/coupons', data);
export const adminUpdateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
export const adminUpdateCouponStatus = (id, is_active) => api.post(`/admin/coupons/${id}/status`, { is_active });
export const adminDeleteCoupon = (id, force = false) => api.delete(`/admin/coupons/${id}?force=${force}`);
export const adminRestoreCoupon = (id) => api.post(`/admin/coupons/${id}/restore`);
export const adminBulkGenerateCoupons = (data) => api.post('/admin/coupons/bulk-generate', data);
export const adminGetCouponAnalytics = () => api.get('/admin/coupons/analytics');
export const adminGetCouponUsageHistory = (params) => api.get('/admin/coupons/usage-history', { params });
export const adminExportCouponsUrl = `${API_BASE_URL}/admin/coupons/export`;

// Shiprocket Shipping Management Controls
export const adminGetShiprocketConfig = () => api.get('/admin/shiprocket/config');
export const adminUpdateShiprocketConfig = (data) => api.put('/admin/shiprocket/config', data);

export const adminGetShiprocketPickupLocations = () => api.get('/admin/shiprocket/pickup-locations');
export const adminAddShiprocketPickupLocation = (data) => api.post('/admin/shiprocket/pickup-locations', data);
export const adminUpdateShiprocketPickupLocation = (id, data) => api.put(`/admin/shiprocket/pickup-locations/${id}`, data);
export const adminDeleteShiprocketPickupLocation = (id) => api.delete(`/admin/shiprocket/pickup-locations/${id}`);

export const adminCalculateShippingRates = (data) => api.post('/admin/shiprocket/calculate-rates', data);

export const adminGetShiprocketShipments = (params) => api.get('/admin/shiprocket/shipments', { params });
export const adminGenerateShiprocketAwb = (data) => api.post('/admin/shiprocket/generate-awb', data);
export const adminScheduleShiprocketPickup = (id, data) => api.post(`/admin/shiprocket/shipments/${id}/schedule-pickup`, data);
export const adminGenerateShiprocketLabel = (id) => api.get(`/admin/shiprocket/shipments/${id}/label`);
export const adminCancelShiprocketShipment = (id) => api.post(`/admin/shiprocket/shipments/${id}/cancel`);
export const adminTrackShiprocketShipment = (id) => api.get(`/admin/shiprocket/shipments/${id}/track`);

export const adminGetShiprocketNdr = () => api.get('/admin/shiprocket/ndr');
export const adminResolveShiprocketNdr = (id, data) => api.post(`/admin/shiprocket/ndr/${id}/resolve`, data);

export const adminGetShiprocketManifests = () => api.get('/admin/shiprocket/manifests');
export const adminGenerateShiprocketManifest = (data) => api.post('/admin/shiprocket/generate-manifest', data);

// ─── USER AUTHENTICATION APIS ───
export const userRegister = (data) => api.post('/auth/register', data);
export const userLogin = (data) => api.post('/auth/login', data);
export const userForgotPassword = (data) => api.post('/auth/forgot-password', data);
export const userResetPassword = (data) => api.post('/auth/reset-password', data);
export const userGetCurrentUser = () => api.get('/auth/me');

// ─── USER DASHBOARD & CHECKOUT APIS ───
export const userGetProfile = (email) => api.get('/user/profile', { params: { email } });
export const userUpdateProfile = (data) => api.put('/user/profile', data);
export const userGetAddresses = (email) => api.get('/user/addresses', { params: { email } });
export const userAddAddress = (data) => api.post('/user/addresses', data);
export const userDeleteAddress = (id) => api.delete(`/user/addresses/${id}`);
export const userGetOrders = (email) => api.get('/user/orders', { params: { email } });
export const userGetWishlist = (email) => api.get('/user/wishlist', { params: { email } });
export const placeOrder = (orderData) => api.post('/orders/place', orderData);

export default api;

