import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Layers, Package, ShoppingBag, Clock, Users, DollarSign, TrendingUp,
  AlertTriangle, XCircle, Star, Gift, Ticket, Plus, RefreshCw, LogOut,
  Edit, Trash2, CheckCircle2, Download, Send, Eye, ShieldAlert, FileSpreadsheet, Copy
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'categories', 'products', 'orders', etc.
  const [modalData, setModalData] = useState([]);
  const [actionMessage, setActionMessage] = useState(null);

  // Form states for modals
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({ name: '', category: 'Herbal Extracts', price: '', stock: '', description: '' });
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order: '' });
  const [replyText, setReplyText] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Check auth token
    const token = localStorage.getItem('leafora_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await adminGetAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
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

  // ─── MODAL OPEN HANDLERS ───
  const openCategoriesModal = async () => {
    setActiveModal('categories');
    const res = await adminGetCategories();
    if (res.success) setModalData(res.data);
  };

  const openProductsModal = async () => {
    setActiveModal('products');
    const res = await adminGetProducts();
    if (res.success) setModalData(res.data);
  };

  const openOrdersModal = async () => {
    setActiveModal('orders');
    const res = await adminGetOrders();
    if (res.success) setModalData(res.data);
  };

  const openCustomersModal = async () => {
    setActiveModal('customers');
    const res = await adminGetCustomers();
    if (res.success) setModalData(res.data);
  };

  const openPaymentsModal = async () => {
    setActiveModal('payments');
    const res = await adminGetPayments();
    if (res.success) setModalData(res.data);
  };

  const openLowStockModal = async () => {
    setActiveModal('lowStock');
    const res = await adminGetProducts();
    if (res.success) setModalData(res.data.filter(p => p.stock > 0 && p.stock <= 10));
  };

  const openOutOfStockModal = async () => {
    setActiveModal('outOfStock');
    const res = await adminGetProducts();
    if (res.success) setModalData(res.data.filter(p => p.stock === 0));
  };

  const openReviewsModal = async () => {
    setActiveModal('reviews');
    const res = await adminGetReviews();
    if (res.success) setModalData(res.data);
  };

  const openReferralsModal = async () => {
    setActiveModal('referrals');
    const res = await adminGetReferrals();
    if (res.success) setModalData(res.data);
  };

  const openCouponsModal = async () => {
    setActiveModal('coupons');
    const res = await adminGetCoupons();
    if (res.success) setModalData(res.data);
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* ─── HEADER BAR ─── */}
      <div style={styles.topHeader}>
        <div>
          <h1 style={styles.headerTitle}>Leafora Life Science — Admin Executive Hub</h1>
          <p style={styles.headerSubtitle}>Real-time Database Analytics & Complete Control Suites</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={fetchDashboardData} style={styles.refreshBtn}>
            <RefreshCw size={16} /> Refresh Data
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={styles.floatingBanner}>
          <CheckCircle2 size={18} /> {actionMessage}
        </div>
      )}

      {loading ? (
        <div style={styles.loadingState}>
          <RefreshCw className="spin" size={36} color="#10b981" />
          <p>Loading Live Analytics & Controls...</p>
        </div>
      ) : (
        /* ─── 12 ANALYTICS CARDS GRID ─── */
        <div style={styles.gridContainer}>
          {/* CARD 1: Total Categories */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                <Layers size={24} />
              </div>
              <span style={styles.badge}>Category Control</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.categories?.total || 0}</h3>
            <p style={styles.cardLabel}>Total Categories ({analytics?.categories?.active || 0} Active)</p>
            <div style={styles.cardControls}>
              <button onClick={openCategoriesModal} style={styles.actionBtnPrimary}>
                <Plus size={14} /> Add • Edit • Delete • Enable/Disable
              </button>
            </div>
          </div>

          {/* CARD 2: Total Products */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#10b98120', color: '#10b981' }}>
                <Package size={24} />
              </div>
              <span style={styles.badge}>Inventory Control</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.products?.total || 0}</h3>
            <p style={styles.cardLabel}>Total Products ({analytics?.products?.active || 0} Active)</p>
            <div style={styles.cardControls}>
              <button onClick={openProductsModal} style={styles.actionBtnPrimary}>
                <Edit size={14} /> CRUD Products • Bulk Upload • Duplicate
              </button>
            </div>
          </div>

          {/* CARD 3: Today's Orders */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#8b5cf620', color: '#8b5cf6' }}>
                <ShoppingBag size={24} />
              </div>
              <span style={styles.badge}>Order Operations</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.orders?.todayOrders || 0}</h3>
            <p style={styles.cardLabel}>Today's Orders Placed</p>
            <div style={styles.cardControls}>
              <button onClick={openOrdersModal} style={styles.actionBtnSecondary}>
                <Eye size={14} /> View • Confirm • Pack • Ship • Cancel
              </button>
            </div>
          </div>

          {/* CARD 4: Pending Orders */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <span style={styles.badgeWarning}>Fulfillment</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.orders?.pendingOrders || 0}</h3>
            <p style={styles.cardLabel}>Pending Orders Needing Approval</p>
            <div style={styles.cardControls}>
              <button onClick={openOrdersModal} style={styles.actionBtnPrimary}>
                <Send size={14} /> Approve • Reject • Assign Shipping
              </button>
            </div>
          </div>

          {/* CARD 5: Total Customers */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#06b6d420', color: '#06b6d4' }}>
                <Users size={24} />
              </div>
              <span style={styles.badge}>Customer CRM</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.customers?.total || 0}</h3>
            <p style={styles.cardLabel}>Registered Customers</p>
            <div style={styles.cardControls}>
              <button onClick={openCustomersModal} style={styles.actionBtnSecondary}>
                <Users size={14} /> View Profile • Suspend • Tier • Export
              </button>
            </div>
          </div>

          {/* CARD 6: Today's Revenue */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#10b98120', color: '#10b981' }}>
                <DollarSign size={24} />
              </div>
              <span style={styles.badge}>Payments</span>
            </div>
            <h3 style={styles.cardValue}>${analytics?.orders?.todayRevenue?.toFixed(2) || '0.00'}</h3>
            <p style={styles.cardLabel}>Today's Total Revenue</p>
            <div style={styles.cardControls}>
              <button onClick={openPaymentsModal} style={styles.actionBtnSecondary}>
                <DollarSign size={14} /> View Transactions • Refund
              </button>
            </div>
          </div>

          {/* CARD 7: Monthly Revenue */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#ec489920', color: '#ec4899' }}>
                <TrendingUp size={24} />
              </div>
              <span style={styles.badge}>Financial Reports</span>
            </div>
            <h3 style={styles.cardValue}>${analytics?.orders?.monthlyRevenue?.toFixed(2) || '0.00'}</h3>
            <p style={styles.cardLabel}>Monthly Revenue Total</p>
            <div style={styles.cardControls}>
              <a href={adminExportRevenueUrl} target="_blank" rel="noreferrer" style={{ ...styles.actionBtnPrimary, textDecoration: 'none', textAlign: 'center' }}>
                <FileSpreadsheet size={14} /> Download Excel / PDF Reports
              </a>
            </div>
          </div>

          {/* CARD 8: Low Stock Products */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#f9731620', color: '#f97316' }}>
                <AlertTriangle size={24} />
              </div>
              <span style={styles.badgeWarning}>Stock Alert</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.products?.lowStock || 0}</h3>
            <p style={styles.cardLabel}>Low Stock Products (&le;10 units)</p>
            <div style={styles.cardControls}>
              <button onClick={openLowStockModal} style={styles.actionBtnPrimary}>
                <Plus size={14} /> Restock • Edit Qty • Disable
              </button>
            </div>
          </div>

          {/* CARD 9: Out of Stock Products */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#ef444420', color: '#ef4444' }}>
                <XCircle size={24} />
              </div>
              <span style={styles.badgeDanger}>Critical Stock</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.products?.outOfStock || 0}</h3>
            <p style={styles.cardLabel}>Out of Stock Products (0 units)</p>
            <div style={styles.cardControls}>
              <button onClick={openOutOfStockModal} style={styles.actionBtnDanger}>
                <ShieldAlert size={14} /> Notify Vendor • Hide Product
              </button>
            </div>
          </div>

          {/* CARD 10: Product Reviews */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#eab30820', color: '#eab308' }}>
                <Star size={24} />
              </div>
              <span style={styles.badge}>Modulation</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.reviews?.total || 0}</h3>
            <p style={styles.cardLabel}>Customer Reviews ({analytics?.reviews?.pending || 0} Pending)</p>
            <div style={styles.cardControls}>
              <button onClick={openReviewsModal} style={styles.actionBtnSecondary}>
                <Star size={14} /> Approve • Delete • Reply • Feature
              </button>
            </div>
          </div>

          {/* CARD 11: Referral Earnings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#6366f120', color: '#6366f1' }}>
                <Gift size={24} />
              </div>
              <span style={styles.badge}>Affiliates</span>
            </div>
            <h3 style={styles.cardValue}>${analytics?.referrals?.totalEarnings?.toFixed(2) || '0.00'}</h3>
            <p style={styles.cardLabel}>Referral Rewards Paid ({analytics?.referrals?.pendingCount || 0} Pending)</p>
            <div style={styles.cardControls}>
              <button onClick={openReferralsModal} style={styles.actionBtnSecondary}>
                <Gift size={14} /> View Referrals • Approve • Reject Fraud
              </button>
            </div>
          </div>

          {/* CARD 12: Coupons Performance */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, backgroundColor: '#14b8a620', color: '#14b8a6' }}>
                <Ticket size={24} />
              </div>
              <span style={styles.badge}>Promotions</span>
            </div>
            <h3 style={styles.cardValue}>{analytics?.coupons?.total || 0}</h3>
            <p style={styles.cardLabel}>Coupons Created ({analytics?.coupons?.active || 0} Active)</p>
            <div style={styles.cardControls}>
              <button onClick={openCouponsModal} style={styles.actionBtnPrimary}>
                <Ticket size={14} /> Create • Edit • Expire • Disable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONTROLS OVERLAY ─── */}
      {activeModal && (
        <div style={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Admin Control Center — {activeModal.toUpperCase()}</h2>
              <button onClick={() => setActiveModal(null)} style={styles.closeBtn}>✕</button>
            </div>

            {/* MODAL 1: CATEGORIES CONTROL */}
            {activeModal === 'categories' && (
              <div style={styles.modalBody}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await adminAddCategory(categoryForm);
                    showNotification('Category added successfully');
                    setCategoryForm({ name: '', description: '' });
                    openCategoriesModal();
                  }}
                  style={styles.inlineForm}
                >
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                    style={styles.modalInput}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    style={styles.modalInput}
                  />
                  <button type="submit" style={styles.addBtn}><Plus size={14} /> Add Category</button>
                </form>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((cat) => (
                      <tr key={cat.id}>
                        <td>#{cat.id}</td>
                        <td><strong>{cat.name}</strong></td>
                        <td>{cat.slug}</td>
                        <td>
                          <span style={cat.is_active ? styles.statusActive : styles.statusDisabled}>
                            {cat.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={async () => {
                              await adminUpdateCategory(cat.id, { ...cat, is_active: !cat.is_active });
                              showNotification(`Category ${cat.name} status toggled`);
                              openCategoriesModal();
                            }}
                            style={styles.smallBtn}
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={async () => {
                              await adminDeleteCategory(cat.id);
                              showNotification(`Category deleted`);
                              openCategoriesModal();
                            }}
                            style={styles.dangerSmallBtn}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 2: PRODUCTS CONTROL */}
            {activeModal === 'products' && (
              <div style={styles.modalBody}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button
                    onClick={async () => {
                      await adminBulkUploadProducts();
                      showNotification('Demo bulk products uploaded to database');
                      openProductsModal();
                    }}
                    style={styles.actionBtnPrimary}
                  >
                    <Download size={14} /> Instant Bulk Upload Sample
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await adminAddProduct(productForm);
                    showNotification('Product added to database');
                    setProductForm({ name: '', category: 'Herbal Extracts', price: '', stock: '', description: '' });
                    openProductsModal();
                  }}
                  style={styles.inlineForm}
                >
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    style={styles.modalInput}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price ($)"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                    style={styles.modalInputSmall}
                  />
                  <input
                    type="number"
                    placeholder="Stock Qty"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                    style={styles.modalInputSmall}
                  />
                  <button type="submit" style={styles.addBtn}><Plus size={14} /> Add Product</button>
                </form>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((p) => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td>${Number(p.price).toFixed(2)}</td>
                        <td>
                          <span style={p.stock <= 10 ? styles.stockWarning : styles.stockNormal}>
                            {p.stock} units
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={async () => {
                              await adminDuplicateProduct(p.id);
                              showNotification(`Product "${p.name}" duplicated`);
                              openProductsModal();
                            }}
                            style={styles.smallBtn}
                          >
                            <Copy size={12} /> Duplicate
                          </button>
                          <button
                            onClick={async () => {
                              await adminDeleteProduct(p.id);
                              showNotification(`Product deleted`);
                              openProductsModal();
                            }}
                            style={styles.dangerSmallBtn}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 3 & 4: ORDERS CONTROL */}
            {activeModal === 'orders' && (
              <div style={styles.modalBody}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Shipping Partner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((ord) => (
                      <tr key={ord.id}>
                        <td><strong>{ord.order_number}</strong></td>
                        <td>{ord.customer_name}<br /><small>{ord.customer_email}</small></td>
                        <td>${Number(ord.total_amount).toFixed(2)}</td>
                        <td>
                          <span style={styles.statusActive}>{ord.status}</span>
                        </td>
                        <td>{ord.shipping_partner || 'Not Assigned'}</td>
                        <td>
                          <select
                            value={ord.status}
                            onChange={async (e) => {
                              await adminUpdateOrderStatus(ord.id, e.target.value);
                              showNotification(`Order #${ord.id} status updated to ${e.target.value}`);
                              openOrdersModal();
                            }}
                            style={styles.selectInput}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={async () => {
                              const partner = prompt('Enter Shipping Partner Name (e.g. DHL, FedEx, BlueDart):', 'DHL Express');
                              if (partner) {
                                await adminUpdateOrderStatus(ord.id, 'Shipped', partner);
                                showNotification(`Assigned ${partner} to Order #${ord.id}`);
                                openOrdersModal();
                              }
                            }}
                            style={styles.smallBtn}
                          >
                            Assign Partner
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 5: CUSTOMERS CRM */}
            {activeModal === 'customers' && (
              <div style={styles.modalBody}>
                <div style={{ marginBottom: '15px' }}>
                  <a href={adminExportCustomersUrl} target="_blank" rel="noreferrer" style={{ ...styles.actionBtnPrimary, textDecoration: 'none', display: 'inline-block' }}>
                    <Download size={14} /> Export Customers (CSV)
                  </a>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Loyalty Tier</th>
                      <th>Total Spent</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.email}</td>
                        <td><span style={styles.badge}>{c.loyalty_tier}</span></td>
                        <td>${Number(c.total_spent).toFixed(2)}</td>
                        <td>
                          <span style={c.status === 'Active' ? styles.statusActive : styles.statusDisabled}>{c.status}</span>
                        </td>
                        <td>
                          <button
                            onClick={async () => {
                              const nextStatus = c.status === 'Active' ? 'Suspended' : 'Active';
                              await adminUpdateCustomer(c.id, { status: nextStatus });
                              showNotification(`Customer status changed to ${nextStatus}`);
                              openCustomersModal();
                            }}
                            style={c.status === 'Active' ? styles.dangerSmallBtn : styles.smallBtn}
                          >
                            {c.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 6: REVENUE & REFUNDS */}
            {activeModal === 'payments' && (
              <div style={styles.modalBody}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Txn ID</th>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((pay) => (
                      <tr key={pay.id}>
                        <td><strong>{pay.transaction_id}</strong></td>
                        <td>#{pay.order_id}</td>
                        <td>${Number(pay.amount).toFixed(2)}</td>
                        <td>{pay.payment_method}</td>
                        <td><span style={pay.status === 'Completed' ? styles.statusActive : styles.statusDisabled}>{pay.status}</span></td>
                        <td>
                          {pay.status === 'Completed' && (
                            <button
                              onClick={async () => {
                                if (confirm(`Issue refund for Transaction ${pay.transaction_id}?`)) {
                                  await adminIssueRefund(pay.id);
                                  showNotification('Refund issued successfully');
                                  openPaymentsModal();
                                }
                              }}
                              style={styles.dangerSmallBtn}
                            >
                              Issue Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 8: LOW STOCK CONTROL */}
            {activeModal === 'lowStock' && (
              <div style={styles.modalBody}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Quick Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td><span style={styles.stockWarning}>{p.stock} left</span></td>
                        <td>
                          <button
                            onClick={async () => {
                              const qty = prompt('Add Restock Quantity:', '50');
                              if (qty) {
                                await adminUpdateProduct(p.id, { ...p, stock: p.stock + Number(qty) });
                                showNotification(`Restocked ${p.name} (+${qty})`);
                                openLowStockModal();
                              }
                            }}
                            style={styles.addBtn}
                          >
                            + Restock Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 9: OUT OF STOCK CONTROL */}
            {activeModal === 'outOfStock' && (
              <div style={styles.modalBody}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Vendor Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td><span style={styles.badgeDanger}>Out of Stock</span></td>
                        <td>
                          <button
                            onClick={async () => {
                              await adminNotifyVendor(p.id);
                              showNotification(`Restock notification email triggered to Vendor for ${p.name}`);
                            }}
                            style={styles.actionBtnPrimary}
                          >
                            <Send size={12} /> Notify Vendor Email
                          </button>
                          <button
                            onClick={async () => {
                              await adminUpdateProduct(p.id, { ...p, is_active: false });
                              showNotification(`Product ${p.name} hidden from store`);
                              openOutOfStockModal();
                            }}
                            style={styles.dangerSmallBtn}
                          >
                            Hide Product
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 10: REVIEWS MODERATION */}
            {activeModal === 'reviews' && (
              <div style={styles.modalBody}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.customer_name}</strong></td>
                        <td>{r.product_name}</td>
                        <td>{r.rating} ⭐</td>
                        <td>"{r.comment}"</td>
                        <td><span style={r.status === 'Approved' ? styles.statusActive : styles.statusDisabled}>{r.status}</span></td>
                        <td>
                          <button
                            onClick={async () => {
                              await adminUpdateReviewStatus(r.id, { status: 'Approved' });
                              showNotification('Review approved');
                              openReviewsModal();
                            }}
                            style={styles.smallBtn}
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              await adminDeleteReview(r.id);
                              showNotification('Review deleted');
                              openReviewsModal();
                            }}
                            style={styles.dangerSmallBtn}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 11: REFERRALS */}
            {activeModal === 'referrals' && (
              <div style={styles.modalBody}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Referrer</th>
                      <th>Referee</th>
                      <th>Reward</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((ref) => (
                      <tr key={ref.id}>
                        <td><strong>{ref.referrer_name}</strong></td>
                        <td>{ref.referee_name}</td>
                        <td>${Number(ref.reward_amount).toFixed(2)}</td>
                        <td><span style={ref.status === 'Approved' ? styles.statusActive : styles.statusDisabled}>{ref.status}</span></td>
                        <td>
                          <button
                            onClick={async () => {
                              await adminUpdateReferralStatus(ref.id, 'Approved');
                              showNotification('Referral reward approved!');
                              openReferralsModal();
                            }}
                            style={styles.smallBtn}
                          >
                            Approve Reward
                          </button>
                          <button
                            onClick={async () => {
                              await adminUpdateReferralStatus(ref.id, 'Rejected');
                              showNotification('Referral flagged as fraud & rejected');
                              openReferralsModal();
                            }}
                            style={styles.dangerSmallBtn}
                          >
                            Reject Fraud
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL 12: COUPONS MANAGEMENT */}
            {activeModal === 'coupons' && (
              <div style={styles.modalBody}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await adminAddCoupon(couponForm);
                    showNotification('New coupon created');
                    setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '' });
                    openCouponsModal();
                  }}
                  style={styles.inlineForm}
                >
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. SAVE25)"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    required
                    style={styles.modalInput}
                  />
                  <input
                    type="number"
                    placeholder="Discount Value"
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                    required
                    style={styles.modalInputSmall}
                  />
                  <button type="submit" style={styles.addBtn}><Plus size={14} /> Create Coupon</button>
                </form>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Used Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((coup) => (
                      <tr key={coup.id}>
                        <td><strong>{coup.code}</strong></td>
                        <td>{coup.discount_value} {coup.discount_type === 'percentage' ? '%' : '$'}</td>
                        <td>{coup.used_count} times</td>
                        <td><span style={coup.status === 'Active' ? styles.statusActive : styles.statusDisabled}>{coup.status}</span></td>
                        <td>
                          <button
                            onClick={async () => {
                              await adminUpdateCouponStatus(coup.id, 'Expired');
                              showNotification(`Coupon ${coup.code} marked as Expired`);
                              openCouponsModal();
                            }}
                            style={styles.dangerSmallBtn}
                          >
                            Expire
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  dashboardContainer: {
    padding: '2rem',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #1e293b',
  },
  headerTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    margin: 0,
    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerSubtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: '0.25rem 0 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontWeight: '600',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#f87171',
    cursor: 'pointer',
    fontWeight: '600',
  },
  floatingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid #10b981',
    color: '#34d399',
    padding: '0.75rem 1.25rem',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    fontWeight: '600',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '1rem',
    color: '#94a3b8',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
  },
  badgeWarning: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
  },
  badgeDanger: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: '800',
    margin: '0 0 0.25rem 0',
    color: '#f8fafc',
  },
  cardLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: '0 0 1.25rem 0',
  },
  cardControls: {
    marginTop: 'auto',
  },
  actionBtnPrimary: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#10b981',
    color: '#064e3b',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
  },
  actionBtnSecondary: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
  },
  actionBtnDanger: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    width: '100%',
    maxWidth: '850px',
    maxHeight: '90vh',
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    border: '1px solid #334155',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '1.5rem',
    overflowY: 'auto',
  },
  inlineForm: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  modalInput: {
    flex: 1,
    minWidth: '180px',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
  },
  modalInputSmall: {
    width: '110px',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
  },
  addBtn: {
    padding: '0.6rem 1rem',
    backgroundColor: '#10b981',
    color: '#064e3b',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  statusActive: {
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  statusDisabled: {
    color: '#94a3b8',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  stockWarning: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  stockNormal: {
    color: '#34d399',
  },
  smallBtn: {
    padding: '4px 8px',
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    marginRight: '6px',
  },
  dangerSmallBtn: {
    padding: '4px 8px',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer',
  },
  selectInput: {
    padding: '4px 6px',
    backgroundColor: '#0f172a',
    color: '#fff',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '0.8rem',
    marginRight: '6px',
  },
};
