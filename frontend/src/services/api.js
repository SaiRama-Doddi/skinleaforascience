import axios from 'axios';

// Create configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

// Admin Auth API
export const adminSendOtp = (email) => api.post('/admin/send-otp', { email });
export const adminVerifyOtp = (email, otp) => api.post('/admin/verify-otp', { email, otp });

// Admin Analytics & Controls API
export const adminGetAnalytics = () => api.get('/admin/analytics');
export const adminUploadImage = (imageData) => api.post('/admin/upload', { image_data: imageData });

// Category Controls
export const adminGetCategories = () => api.get('/admin/categories');
export const adminAddCategory = (data) => api.post('/admin/categories', data);
export const adminUpdateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const adminDeleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// Product Controls
export const adminGetProducts = () => api.get('/admin/products');
export const adminAddProduct = (data) => api.post('/admin/products', data);
export const adminUpdateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const adminDuplicateProduct = (id) => api.post(`/admin/products/${id}/duplicate`);
export const adminBulkUploadProducts = (items) => api.post('/admin/products/bulk-upload', { items });
export const adminNotifyVendor = (id) => api.post(`/admin/products/${id}/notify-vendor`);

// Order Controls
export const adminGetOrders = () => api.get('/admin/orders');
export const adminUpdateOrderStatus = (id, status, shipping_partner) =>
  api.put(`/admin/orders/${id}/status`, { status, shipping_partner });

// Customer Controls
export const adminGetCustomers = () => api.get('/admin/customers');
export const adminUpdateCustomer = (id, data) => api.put(`/admin/customers/${id}`, data);
export const adminExportCustomersUrl = '/api/admin/customers/export';

// Revenue & Payments Controls
export const adminGetPayments = () => api.get('/admin/payments');
export const adminIssueRefund = (id) => api.post(`/admin/payments/${id}/refund`);
export const adminExportRevenueUrl = '/api/admin/revenue/export';

// Reviews Controls
export const adminGetReviews = () => api.get('/admin/reviews');
export const adminUpdateReviewStatus = (id, data) => api.put(`/admin/reviews/${id}`, data);
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`);

// Referrals Controls
export const adminGetReferrals = () => api.get('/admin/referrals');
export const adminUpdateReferralStatus = (id, status) => api.put(`/admin/referrals/${id}`, { status });

// Coupons Controls
export const adminGetCoupons = () => api.get('/admin/coupons');
export const adminAddCoupon = (data) => api.post('/admin/coupons', data);
export const adminUpdateCouponStatus = (id, status) => api.put(`/admin/coupons/${id}`, { status });

export default api;
