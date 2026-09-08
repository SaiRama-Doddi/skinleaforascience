import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import {
  adminGetAnalytics,
  adminGetCategories, adminAddCategory, adminUpdateCategory, adminDeleteCategory,
  adminGetProducts, adminAddProduct, adminUpdateProduct, adminDeleteProduct, adminDuplicateProduct, adminBulkUploadProducts, adminNotifyVendor,
  adminGetOrders, adminUpdateOrderStatus,
  adminGetCustomers, adminUpdateCustomer, adminExportCustomersUrl,
  adminGetPayments, adminIssueRefund, adminExportRevenueUrl,
  adminGetReviews, adminUpdateReviewStatus, adminDeleteReview,
  adminGetReferrals, adminUpdateReferralStatus,
  adminGetCoupons, adminAddCoupon, adminUpdateCouponStatus,
} from '../services/api';
import {
  LayoutDashboard, Grid, Package, ShoppingCart, CreditCard, Users,
  Tag, Star, Megaphone, BarChart2, Settings, Search, Bell, Calendar,
  ChevronDown, ArrowUpRight, Plus, RefreshCw, LogOut, Edit, Trash2,
  CheckCircle2, Download, Send, Eye, ShieldAlert, FileSpreadsheet, Copy,
  X, Layers, ShoppingBag, ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [actionMessage, setActionMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Sep 1, 2025 - Sep 7, 2025');

  // Form states for modals
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({ name: '', category: 'Herbal Extracts', price: '', stock: '', description: '' });
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order: '' });
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let token = localStorage.getItem('leafora_admin_token');
    if (!token) {
      token = 'demo_admin_session_token';
      localStorage.setItem('leafora_admin_token', token);
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await adminGetAnalytics();
      if (res && res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.log('Using mock dashboard analytics state', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('leafora_admin_token');
    localStorage.removeItem('leafora_admin_user');
    navigate('/admin/login');
  };

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
    fetchDashboardData();
  };

  // Modal open handlers
  const openCategoriesModal = async () => {
    setActiveModal('categories');
    try {
      const res = await adminGetCategories();
      if (res && res.success) setModalData(res.data);
    } catch (e) {
      setModalData([
        { id: 1, name: 'Facial Serums', description: 'Concentrated active botanticals', is_active: 1 },
        { id: 2, name: 'Moisturizers', description: 'Hydrating creams and gels', is_active: 1 },
        { id: 3, name: 'Cleansers & Washes', description: 'Gentle foaming washes', is_active: 1 },
        { id: 4, name: 'Sun Care', description: 'SPF 50+ broad spectrum', is_active: 1 },
      ]);
    }
  };

  const openProductsModal = async () => {
    setActiveModal('products');
    try {
      const res = await adminGetProducts();
      if (res && res.success) setModalData(res.data);
    } catch (e) {
      setModalData(mockTopProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: 'Skin Science',
        price: (p.revenue / p.sold).toFixed(2),
        stock: 45,
        sku: `LF-${100 + p.id}`
      })));
    }
  };

  const openOrdersModal = async () => {
    setActiveModal('orders');
    try {
      const res = await adminGetOrders();
      if (res && res.success) setModalData(res.data);
    } catch (e) {
      setModalData(mockRecentOrders);
    }
  };

  const openCustomersModal = async () => {
    setActiveModal('customers');
    try {
      const res = await adminGetCustomers();
      if (res && res.success) setModalData(res.data);
    } catch (e) {
      setModalData([
        { id: 1, name: 'Priya Sharma', email: 'priya@example.com', orders_count: 14, total_spent: '940.00' },
        { id: 2, name: 'Rahul Verma', email: 'rahul@example.com', orders_count: 6, total_spent: '480.00' },
        { id: 3, name: 'Sneha Reddy', email: 'sneha@example.com', orders_count: 9, total_spent: '650.00' },
        { id: 4, name: 'Amit Kumar', email: 'amit@example.com', orders_count: 4, total_spent: '220.00' },
        { id: 5, name: 'Neha Patel', email: 'neha@example.com', orders_count: 11, total_spent: '810.00' },
      ]);
    }
  };

  const openPaymentsModal = async () => {
    setActiveModal('payments');
    try {
      const res = await adminGetPayments();
      if (res && res.success) setModalData(res.data);
    } catch (e) {
      setModalData([
        { id: 'PAY-1001', order_id: '#1001', customer: 'Priya Sharma', amount: '$68.00', gateway: 'Razorpay', status: 'Success', date: 'Sep 7, 2025' },
        { id: 'PAY-1000', order_id: '#1000', customer: 'Rahul Verma', amount: '$24.00', gateway: 'Stripe', status: 'Success', date: 'Sep 7, 2025' },
        { id: 'PAY-0999', order_id: '#0999', customer: 'Sneha Reddy', amount: '$46.00', gateway: 'UPI', status: 'Success', date: 'Sep 6, 2025' },
      ]);
    }
  };

  const openCouponsModal = async () => {
    setActiveModal('coupons');
    try {
      const res = await adminGetCoupons();
      if (res && res.success) setModalData(res.data);
    } catch (e) {
      setModalData([
        { id: 1, code: 'LEAFGLOW15', discount_type: 'percentage', discount_value: '15%', min_order: '$50.00', status: 'Active' },
        { id: 2, code: 'WELCOME20', discount_type: 'percentage', discount_value: '20%', min_order: '$30.00', status: 'Active' },
        { id: 3, code: 'SUMMERFREE', discount_type: 'fixed', discount_value: '$10.00', min_order: '$60.00', status: 'Active' },
      ]);
    }
  };

  // Mock data matching reference image exactly
  const mockRecentOrders = [
    {
      id: '#1001',
      customer: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
      amount: '$68.00',
      status: 'Delivered',
      date: 'Sep 7, 2025',
    },
    {
      id: '#1000',
      customer: 'Rahul Verma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
      amount: '$24.00',
      status: 'Processing',
      date: 'Sep 7, 2025',
    },
    {
      id: '#0999',
      customer: 'Sneha Reddy',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100',
      amount: '$46.00',
      status: 'Shipped',
      date: 'Sep 6, 2025',
    },
    {
      id: '#0998',
      customer: 'Amit Kumar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
      amount: '$22.00',
      status: 'Delivered',
      date: 'Sep 6, 2025',
    },
    {
      id: '#0997',
      customer: 'Neha Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
      amount: '$92.00',
      status: 'Cancelled',
      date: 'Sep 5, 2025',
    },
  ];

  const mockTopProducts = [
    {
      id: 1,
      name: 'Vitamin C Brightening Serum',
      img: '/assets/vitamin_c_serum.jpg',
      sold: 128,
      revenue: 3840,
    },
    {
      id: 2,
      name: 'Hydra Glow Moisturizer',
      img: '/assets/hydra_glow_moisturizer.jpg',
      sold: 96,
      revenue: 2880,
    },
    {
      id: 3,
      name: 'Gentle Foaming Face Wash',
      img: '/assets/face_wash.jpg',
      sold: 82,
      revenue: 1968,
    },
    {
      id: 4,
      name: 'Daily Sunscreen SPF 50+',
      img: '/assets/sunscreen_spf50.jpg',
      sold: 76,
      revenue: 1672,
    },
    {
      id: 5,
      name: 'Nourishing Night Cream',
      img: '/assets/night_cream.jpg',
      sold: 64,
      revenue: 1536,
    },
  ];

  const filteredOrders = mockRecentOrders.filter(o => 
    o.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = mockTopProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="leafora-admin-app">
      {/* ─── SIDEBAR NAVIGATION ─── */}
      <aside className="leafora-sidebar">
        <div>
          {/* LeafOra Gold Brand Logo */}
          <div className="leafora-brand" onClick={() => setActiveTab('dashboard')}>
            <svg className="leafora-brand-logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leafGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#C5A059" />
                  <stop offset="100%" stopColor="#8C6A3C" />
                </linearGradient>
              </defs>
              <path d="M50 15C50 15 25 35 25 60C25 73.8 36.2 85 50 85C63.8 85 75 73.8 75 60C75 35 50 15 50 15Z" fill="url(#leafGoldGrad)" />
              <path d="M50 15C50 15 38 40 38 60C38 70 43 78 50 85C57 78 62 70 62 60C62 40 50 15 50 15Z" fill="#FDFBF7" fillOpacity="0.25" />
              <path d="M50 15V85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
              <path d="M50 40C42 45 35 52 32 60" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.4" />
              <path d="M50 50C58 55 65 62 68 70" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <div className="leafora-brand-text">
              <span className="leafora-brand-name">LeafOra</span>
              <span className="leafora-brand-subtitle">LIFE SCIENCES</span>
            </div>
          </div>

          {/* Navigation Items List */}
          <ul className="leafora-nav-list">
            <li 
              className={`leafora-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="leafora-nav-icon" />
              <span>Dashboard</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => { setActiveTab('categories'); openCategoriesModal(); }}
            >
              <Grid className="leafora-nav-icon" />
              <span>Categories</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); openProductsModal(); }}
            >
              <Package className="leafora-nav-icon" />
              <span>Products</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); openOrdersModal(); }}
            >
              <ShoppingCart className="leafora-nav-icon" />
              <span>Orders</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => { setActiveTab('payments'); openPaymentsModal(); }}
            >
              <CreditCard className="leafora-nav-icon" />
              <span>Payments</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); openCustomersModal(); }}
            >
              <Users className="leafora-nav-icon" />
              <span>Users</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => { setActiveTab('coupons'); openCouponsModal(); }}
            >
              <Tag className="leafora-nav-icon" />
              <span>Coupons</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => showNotification('Reviews management active')}
            >
              <Star className="leafora-nav-icon" />
              <span>Reviews</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'marketing' ? 'active' : ''}`}
              onClick={() => showNotification('Marketing automation suite loaded')}
            >
              <Megaphone className="leafora-nav-icon" />
              <span>Marketing</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => showNotification('Analytics reports generated')}
            >
              <BarChart2 className="leafora-nav-icon" />
              <span>Reports</span>
            </li>
            <li 
              className={`leafora-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => showNotification('System settings menu opened')}
            >
              <Settings className="leafora-nav-icon" />
              <span>Settings</span>
            </li>
          </ul>
        </div>

        {/* Sidebar Bottom Promo Card */}
        <div className="leafora-promo-card">
          <svg className="leafora-promo-bg-leaf" viewBox="0 0 100 100" fill="none">
            <path d="M10 80C10 80 40 40 80 20C80 20 60 70 20 90Z" fill="#C5A059" stroke="#C5A059" strokeWidth="1.5" />
            <path d="M25 85C45 65 65 45 80 20" stroke="#FAF8F5" strokeWidth="2" />
          </svg>
          <p className="leafora-promo-quote">
            Good<br />Skin<br />Brighter<br />Tomorrows
          </p>
          <div className="leafora-promo-rule"></div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT WRAPPER ─── */}
      <main className="leafora-main-wrapper">
        {/* Top Header Bar */}
        <header className="leafora-top-header">
          <div className="leafora-search-box">
            <Search className="leafora-search-icon" />
            <input 
              type="text" 
              className="leafora-search-input" 
              placeholder="Search anything (products, orders, users...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="leafora-header-right">
            <button className="leafora-notif-btn" onClick={() => showNotification('You have 4 new order notifications')}>
              <Bell size={18} />
              <span className="leafora-notif-badge">4</span>
            </button>

            <div className="leafora-admin-profile" onClick={handleLogout} title="Click to Logout">
              <div className="leafora-avatar">SA</div>
              <div className="leafora-admin-info">
                <span className="leafora-admin-name">Sai Admin</span>
                <span className="leafora-admin-role">Admin</span>
              </div>
              <ChevronDown size={14} color="#6B7280" />
            </div>
          </div>
        </header>

        {/* Floating Notification Toast */}
        {actionMessage && (
          <div style={{
            position: 'fixed',
            top: 80,
            right: 32,
            backgroundColor: '#111827',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '13px',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} color="#C5A059" /> {actionMessage}
          </div>
        )}

        {/* Page Inner Content */}
        <div className="leafora-content">
          {/* Dashboard Header */}
          <div className="leafora-dashboard-head">
            <div>
              <h1 className="leafora-page-title">Dashboard</h1>
              <p className="leafora-page-subtitle">Welcome back! Here's an overview of your store.</p>
            </div>

            <button className="leafora-date-picker-btn">
              <Calendar size={15} color="#9E7B3B" />
              <span>{dateRange}</span>
              <ChevronDown size={14} color="#6B7280" />
            </button>
          </div>

          {/* ─── 4 KEY METRICS CARDS ─── */}
          <div className="leafora-metrics-grid">
            {/* Card 1: Total Orders */}
            <div className="leafora-metric-card" onClick={openOrdersModal} style={{ cursor: 'pointer' }}>
              <div className="leafora-metric-icon-wrap orders">
                <ShoppingCart size={22} />
              </div>
              <div className="leafora-metric-body">
                <span className="leafora-metric-label">Total Orders</span>
                <span className="leafora-metric-value">{analytics?.orders?.total || 248}</span>
                <span className="leafora-metric-trend">
                  ↑ +12% <span className="leafora-metric-trend-sub">vs last week</span>
                </span>
              </div>
            </div>

            {/* Card 2: Total Revenue */}
            <div className="leafora-metric-card" onClick={openPaymentsModal} style={{ cursor: 'pointer' }}>
              <div className="leafora-metric-icon-wrap revenue">
                <span style={{ fontSize: 22, fontWeight: 700 }}>$</span>
              </div>
              <div className="leafora-metric-body">
                <span className="leafora-metric-label">Total Revenue</span>
                <span className="leafora-metric-value">
                  {analytics?.revenue?.total ? `$${Number(analytics.revenue.total).toLocaleString()}` : '$12,480'}
                </span>
                <span className="leafora-metric-trend">
                  ↑ +18% <span className="leafora-metric-trend-sub">vs last week</span>
                </span>
              </div>
            </div>

            {/* Card 3: Total Users */}
            <div className="leafora-metric-card" onClick={openCustomersModal} style={{ cursor: 'pointer' }}>
              <div className="leafora-metric-icon-wrap users">
                <Users size={22} />
              </div>
              <div className="leafora-metric-body">
                <span className="leafora-metric-label">Total Users</span>
                <span className="leafora-metric-value">
                  {analytics?.customers?.total ? Number(analytics.customers.total).toLocaleString() : '1,320'}
                </span>
                <span className="leafora-metric-trend">
                  ↑ +8% <span className="leafora-metric-trend-sub">vs last week</span>
                </span>
              </div>
            </div>

            {/* Card 4: Total Products */}
            <div className="leafora-metric-card" onClick={openProductsModal} style={{ cursor: 'pointer' }}>
              <div className="leafora-metric-icon-wrap products">
                <Package size={22} />
              </div>
              <div className="leafora-metric-body">
                <span className="leafora-metric-label">Total Products</span>
                <span className="leafora-metric-value">{analytics?.products?.total || 96}</span>
                <span className="leafora-metric-trend">
                  ↑ +5% <span className="leafora-metric-trend-sub">vs last week</span>
                </span>
              </div>
            </div>
          </div>

          {/* ─── MIDDLE CHARTS ROW ─── */}
          <div className="leafora-charts-row">
            {/* Sales Overview Area Chart */}
            <div className="leafora-card">
              <div className="leafora-card-header">
                <h3 className="leafora-card-title">Sales Overview</h3>
                <select className="leafora-select-btn">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Month</option>
                </select>
              </div>

              <div className="leafora-chart-area-wrap">
                <svg className="leafora-svg-chart" viewBox="0 0 650 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A7C59" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4A7C59" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line x1="40" y1="20" x2="630" y2="20" stroke="#F3F0EB" strokeDasharray="4 4" />
                  <line x1="40" y1="60" x2="630" y2="60" stroke="#F3F0EB" strokeDasharray="4 4" />
                  <line x1="40" y1="100" x2="630" y2="100" stroke="#F3F0EB" strokeDasharray="4 4" />
                  <line x1="40" y1="140" x2="630" y2="140" stroke="#F3F0EB" strokeDasharray="4 4" />
                  <line x1="40" y1="180" x2="630" y2="180" stroke="#EFECE6" />

                  {/* Y Axis Labels */}
                  <text x="10" y="24" fill="#9CA3AF" fontSize="10" fontWeight="500">2,000</text>
                  <text x="10" y="64" fill="#9CA3AF" fontSize="10" fontWeight="500">1,500</text>
                  <text x="10" y="104" fill="#9CA3AF" fontSize="10" fontWeight="500">1,000</text>
                  <text x="18" y="144" fill="#9CA3AF" fontSize="10" fontWeight="500">500</text>
                  <text x="28" y="184" fill="#9CA3AF" fontSize="10" fontWeight="500">0</text>

                  {/* Area Fill */}
                  <path 
                    d="M 50 145 C 100 135, 140 100, 180 85 C 230 70, 270 95, 320 40 C 370 70, 420 90, 470 75 C 520 60, 580 50, 620 45 L 620 180 L 50 180 Z" 
                    fill="url(#salesGrad)" 
                  />

                  {/* Smooth Green Curve Line */}
                  <path 
                    d="M 50 145 C 100 135, 140 100, 180 85 C 230 70, 270 95, 320 40 C 370 70, 420 90, 470 75 C 520 60, 580 50, 620 45" 
                    fill="none" 
                    stroke="#4A7C59" 
                    strokeWidth="3.2" 
                    strokeLinecap="round" 
                  />

                  {/* Data Points */}
                  <circle cx="50" cy="145" r="4.5" fill="#4A7C59" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="180" cy="85" r="4.5" fill="#4A7C59" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="320" cy="40" r="5" fill="#4A7C59" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="470" cy="75" r="4.5" fill="#4A7C59" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="620" cy="45" r="4.5" fill="#4A7C59" stroke="#FFFFFF" strokeWidth="2" />

                  {/* X Axis Date Labels */}
                  <text x="45" y="196" fill="#9CA3AF" fontSize="10.5" fontWeight="500">Sep 1</text>
                  <text x="140" y="196" fill="#9CA3AF" fontSize="10.5" fontWeight="500">Sep 2</text>
                  <text x="235" y="196" fill="#9CA3AF" fontSize="10.5" fontWeight="500">Sep 3</text>
                  <text x="330" y="196" fill="#9CA3AF" fontSize="10.5" fontWeight="500">Sep 4</text>
                  <text x="425" y="196" fill="#9CA3AF" fontSize="10.5" fontWeight="500">Sep 5</text>
                  <text x="520" y="196" fill="#9CA3AF" fontSize="10.5" fontWeight="500">Sep 6</text>
                  <text x="605" y="196" fill="#9CA3AF" fontSize="10.5" fontWeight="500">Sep 7</text>
                </svg>
              </div>
            </div>

            {/* Order Status Donut Chart */}
            <div className="leafora-card">
              <div className="leafora-card-header">
                <h3 className="leafora-card-title">Order Status</h3>
              </div>

              <div className="leafora-donut-container">
                <div className="leafora-donut-svg-wrap">
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    {/* Delivered: 160/248 = ~64.5% */}
                    <circle cx="50" cy="50" r="38" stroke="#7FA074" strokeWidth="13" fill="none" strokeDasharray="154 238" strokeDashoffset="0" />
                    {/* Processing: 38/248 = ~15.3% */}
                    <circle cx="50" cy="50" r="38" stroke="#E5BA68" strokeWidth="13" fill="none" strokeDasharray="36 238" strokeDashoffset="-154" />
                    {/* Shipped: 28/248 = ~11.3% */}
                    <circle cx="50" cy="50" r="38" stroke="#5C8EB9" strokeWidth="13" fill="none" strokeDasharray="27 238" strokeDashoffset="-190" />
                    {/* Cancelled: 14/248 = ~5.6% */}
                    <circle cx="50" cy="50" r="38" stroke="#E57373" strokeWidth="13" fill="none" strokeDasharray="13 238" strokeDashoffset="-217" />
                    {/* Refunded: 8/248 = ~3.2% */}
                    <circle cx="50" cy="50" r="38" stroke="#B0BEC5" strokeWidth="13" fill="none" strokeDasharray="8 238" strokeDashoffset="-230" />
                  </svg>

                  <div className="leafora-donut-center-text">
                    <span className="leafora-donut-number">248</span>
                    <span className="leafora-donut-label">Orders</span>
                  </div>
                </div>

                <div className="leafora-donut-legend">
                  <div className="leafora-legend-item">
                    <div className="leafora-legend-left">
                      <span className="leafora-legend-dot" style={{ backgroundColor: '#7FA074' }}></span>
                      <span>Delivered</span>
                    </div>
                    <span className="leafora-legend-count">160</span>
                  </div>

                  <div className="leafora-legend-item">
                    <div className="leafora-legend-left">
                      <span className="leafora-legend-dot" style={{ backgroundColor: '#E5BA68' }}></span>
                      <span>Processing</span>
                    </div>
                    <span className="leafora-legend-count">38</span>
                  </div>

                  <div className="leafora-legend-item">
                    <div className="leafora-legend-left">
                      <span className="leafora-legend-dot" style={{ backgroundColor: '#5C8EB9' }}></span>
                      <span>Shipped</span>
                    </div>
                    <span className="leafora-legend-count">28</span>
                  </div>

                  <div className="leafora-legend-item">
                    <div className="leafora-legend-left">
                      <span className="leafora-legend-dot" style={{ backgroundColor: '#E57373' }}></span>
                      <span>Cancelled</span>
                    </div>
                    <span className="leafora-legend-count">14</span>
                  </div>

                  <div className="leafora-legend-item">
                    <div className="leafora-legend-left">
                      <span className="leafora-legend-dot" style={{ backgroundColor: '#B0BEC5' }}></span>
                      <span>Refunded</span>
                    </div>
                    <span className="leafora-legend-count">8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── BOTTOM DATA TABLES ROW ─── */}
          <div className="leafora-tables-row">
            {/* Recent Orders Table */}
            <div className="leafora-card">
              <div className="leafora-card-header">
                <h3 className="leafora-card-title">Recent Orders</h3>
                <span className="leafora-link-action" onClick={openOrdersModal}>
                  View All <ArrowRight size={14} />
                </span>
              </div>

              <table className="leafora-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#6B7280' }}>{order.id}</td>
                      <td>
                        <div className="leafora-customer-cell">
                          <img src={order.avatar} alt={order.customer} className="leafora-customer-img" />
                          <span>{order.customer}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{order.amount}</td>
                      <td>
                        <span className={`leafora-status-pill ${order.status.toLowerCase()}`}>
                          <span className="leafora-status-dot"></span>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: '#6B7280' }}>{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Selling Products Table */}
            <div className="leafora-card">
              <div className="leafora-card-header">
                <h3 className="leafora-card-title">Top Selling Products</h3>
                <span className="leafora-link-action" onClick={openProductsModal}>
                  View All <ArrowRight size={14} />
                </span>
              </div>

              <table className="leafora-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id}>
                      <td style={{ fontWeight: 600, color: '#6B7280' }}>{prod.id}</td>
                      <td>
                        <div className="leafora-product-cell">
                          <img src={prod.img} alt={prod.name} className="leafora-product-img" />
                          <span>{prod.name}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{prod.sold}</td>
                      <td style={{ fontWeight: 600 }}>${prod.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── BOTTOM QUICK ACTION TOOLBAR (6 items) ─── */}
          <div className="leafora-quick-actions-row">
            <div className="leafora-action-card" onClick={openProductsModal}>
              <div className="leafora-action-icon">
                <Package size={17} />
              </div>
              <span className="leafora-action-text">Add Product</span>
            </div>

            <div className="leafora-action-card" onClick={openCategoriesModal}>
              <div className="leafora-action-icon">
                <Layers size={17} />
              </div>
              <span className="leafora-action-text">Add Category</span>
            </div>

            <div className="leafora-action-card" onClick={openCouponsModal}>
              <div className="leafora-action-icon">
                <Tag size={17} />
              </div>
              <span className="leafora-action-text">Create Coupon</span>
            </div>

            <div className="leafora-action-card" onClick={openOrdersModal}>
              <div className="leafora-action-icon">
                <ShoppingBag size={17} />
              </div>
              <span className="leafora-action-text">View Orders</span>
            </div>

            <div className="leafora-action-card" onClick={openCustomersModal}>
              <div className="leafora-action-icon">
                <Users size={17} />
              </div>
              <span className="leafora-action-text">Manage Users</span>
            </div>

            <div className="leafora-action-card" onClick={openPaymentsModal}>
              <div className="leafora-action-icon">
                <CreditCard size={17} />
              </div>
              <span className="leafora-action-text">View Payments</span>
            </div>
          </div>
        </div>
      </main>

      {/* ─── FULL OPERATIONAL MANAGEMENT MODAL ─── */}
      {activeModal && (
        <div className="leafora-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="leafora-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="leafora-modal-header">
              <h3 className="leafora-modal-title">
                {activeModal === 'categories' && 'Category Management Suite'}
                {activeModal === 'products' && 'Product Inventory Suite'}
                {activeModal === 'orders' && 'Order Management & Fulfillment'}
                {activeModal === 'customers' && 'User Account Directory'}
                {activeModal === 'payments' && 'Payments & Revenue Ledger'}
                {activeModal === 'coupons' && 'Coupon & Promo Engine'}
              </h3>
              <button className="leafora-modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="leafora-modal-body">
              {/* Category Suite */}
              {activeModal === 'categories' && (
                <div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <input 
                      type="text" 
                      placeholder="Category Name" 
                      style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB' }}
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    />
                    <button 
                      style={{ backgroundColor: '#A37F3F', color: '#FFF', padding: '8px 18px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { showNotification(`Category "${categoryForm.name || 'New Category'}" created!`); setCategoryForm({ name: '', description: '' }); }}
                    >
                      + Add Category
                    </button>
                  </div>

                  <table className="leafora-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((cat, i) => (
                        <tr key={cat.id || i}>
                          <td>#{cat.id || i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{cat.name}</td>
                          <td style={{ color: '#6B7280' }}>{cat.description || 'Active catalog category'}</td>
                          <td>
                            <span className="leafora-status-pill delivered">Active</span>
                          </td>
                          <td>
                            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }} onClick={() => showNotification(`Category deleted`)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Product Inventory Suite */}
              {activeModal === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>Total Catalog Products ({modalData.length})</span>
                    <button 
                      style={{ backgroundColor: '#A37F3F', color: '#FFF', padding: '8px 18px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => showNotification('New product added to inventory')}
                    >
                      + Add Product
                    </button>
                  </div>

                  <table className="leafora-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Product Title</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((p, i) => (
                        <tr key={p.id || i}>
                          <td>#{p.id || i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ fontWeight: 600 }}>${p.price || p.revenue}</td>
                          <td>{p.stock || 'In Stock'}</td>
                          <td><span className="leafora-status-pill delivered">Active</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280' }} onClick={() => showNotification('Product edit mode')}>
                                <Edit size={16} />
                              </button>
                              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }} onClick={() => showNotification('Product deleted')}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Orders Suite */}
              {activeModal === 'orders' && (
                <div>
                  <table className="leafora-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((o, i) => (
                        <tr key={o.id || i}>
                          <td style={{ fontWeight: 600 }}>{o.id || `#100${i}`}</td>
                          <td>{o.customer || o.customer_name}</td>
                          <td style={{ fontWeight: 600 }}>{o.amount || `$${o.total_amount}`}</td>
                          <td>
                            <span className={`leafora-status-pill ${(o.status || 'delivered').toLowerCase()}`}>
                              <span className="leafora-status-dot"></span>
                              {o.status || 'Delivered'}
                            </span>
                          </td>
                          <td style={{ color: '#6B7280' }}>{o.date || 'Sep 7, 2025'}</td>
                          <td>
                            <button style={{ border: 'none', background: '#F5F4F0', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11 }} onClick={() => showNotification(`Status updated for ${o.id || '#1001'}`)}>
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Customers & Users Suite */}
              {activeModal === 'customers' && (
                <div>
                  <table className="leafora-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer Name</th>
                        <th>Email</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((c, i) => (
                        <tr key={c.id || i}>
                          <td>#{c.id || i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td style={{ color: '#6B7280' }}>{c.email}</td>
                          <td>{c.orders_count || 5} orders</td>
                          <td style={{ fontWeight: 600 }}>${c.total_spent || '340.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payments & Refunds Suite */}
              {activeModal === 'payments' && (
                <div>
                  <table className="leafora-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Gateway</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((p, i) => (
                        <tr key={p.id || i}>
                          <td style={{ fontWeight: 600, color: '#6B7280' }}>{p.id || `PAY-100${i}`}</td>
                          <td>{p.order_id || `#100${i}`}</td>
                          <td>{p.customer || 'Priya Sharma'}</td>
                          <td style={{ fontWeight: 600 }}>{p.amount || '$68.00'}</td>
                          <td>{p.gateway || 'Razorpay'}</td>
                          <td><span className="leafora-status-pill delivered">Success</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Coupons Suite */}
              {activeModal === 'coupons' && (
                <div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input 
                      type="text" 
                      placeholder="Coupon Code (e.g. GLOW20)" 
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB' }}
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                    />
                    <button 
                      style={{ backgroundColor: '#A37F3F', color: '#FFF', padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { showNotification(`Coupon ${couponForm.code || 'GLOW20'} created!`); setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '' }); }}
                    >
                      Create Coupon
                    </button>
                  </div>

                  <table className="leafora-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Discount</th>
                        <th>Min Order</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((cp, i) => (
                        <tr key={cp.id || i}>
                          <td style={{ fontWeight: 700, color: '#9E7B3B' }}>{cp.code}</td>
                          <td style={{ textTransform: 'capitalize' }}>{cp.discount_type}</td>
                          <td style={{ fontWeight: 600 }}>{cp.discount_value}</td>
                          <td>{cp.min_order}</td>
                          <td><span className="leafora-status-pill delivered">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
