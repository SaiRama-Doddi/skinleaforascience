import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  User, MapPin, Package, Heart, LogOut, Edit3, Plus, Trash2, CheckCircle2, 
  Clock, ShieldCheck, Phone, Mail, Award, ChevronRight, Check, AlertCircle, ShoppingBag, Eye, X
} from 'lucide-react';
import { 
  userGetProfile, userUpdateProfile, userGetAddresses, userAddAddress, 
  userDeleteAddress, userGetOrders, userGetWishlist 
} from '../services/api';
import { addToCart } from '../services/cartService';
import './UserDashboard.css';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'profile'); // 'profile' | 'addresses' | 'orders' | 'wishlist'

  // User Auth State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Tab Data States
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Add Address Modal / Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: '',
    phone: '',
    type: 'Home',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });
  const [addingAddr, setAddingAddr] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load User Data
  useEffect(() => {
    const storedUser = localStorage.getItem('leafora_user_profile');
    if (!storedUser) {
      navigate('/login?redirect=/dashboard');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setProfileForm({
        first_name: parsed.first_name || (parsed.name ? parsed.name.split(' ')[0] : ''),
        last_name: parsed.last_name || (parsed.name ? parsed.name.split(' ').slice(1).join(' ') : ''),
        email: parsed.email || '',
        phone: parsed.phone || parsed.mobile || ''
      });

      // Fetch fresh profile from API
      if (parsed.email) {
        userGetProfile(parsed.email)
          .then(res => {
            if (res?.data?.user) {
              const u = res.data.user;
              setUser(u);
              setProfileForm({
                first_name: u.first_name || '',
                last_name: u.last_name || '',
                email: u.email || '',
                phone: u.phone || ''
              });
              localStorage.setItem('leafora_user_profile', JSON.stringify(u));
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.error('Error parsing user session:', e);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load active tab data
  useEffect(() => {
    if (!user?.email) return;

    if (activeTab === 'addresses') {
      userGetAddresses(user.email)
        .then(res => {
          if (res?.data?.addresses) setAddresses(res.data.addresses);
        })
        .catch(() => {});
    } else if (activeTab === 'orders') {
      userGetOrders(user.email)
        .then(res => {
          if (res?.data?.orders) setOrders(res.data.orders);
        })
        .catch(() => {});
    } else if (activeTab === 'wishlist') {
      userGetWishlist(user.email)
        .then(res => {
          if (res?.data?.wishlist) setWishlist(res.data.wishlist);
        })
        .catch(() => {});
    }
  }, [activeTab, user]);

  // Update Profile Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await userUpdateProfile(profileForm);
      if (res?.data?.success || res?.success) {
        const updatedUser = {
          ...user,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          name: `${profileForm.first_name} ${profileForm.last_name}`.trim(),
          phone: profileForm.phone
        };
        setUser(updatedUser);
        localStorage.setItem('leafora_user_profile', JSON.stringify(updatedUser));
        showToast('Personal details updated successfully!');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Add Address Submit
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddingAddr(true);

    try {
      const payload = {
        ...newAddr,
        email: user.email,
        customer_id: user.id
      };
      const res = await userAddAddress(payload);
      if (res?.data?.success || res?.success) {
        showToast('New delivery address added successfully!');
        setShowAddressModal(false);
        setNewAddr({
          name: '', phone: '', type: 'Home', address_line1: '', address_line2: '',
          city: '', state: '', pincode: '', is_default: false
        });
        // Refresh addresses
        userGetAddresses(user.email).then(r => setAddresses(r?.data?.addresses || []));
      }
    } catch (err) {
      showToast(err.message || 'Error adding address.');
    } finally {
      setAddingAddr(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      await userDeleteAddress(addrId);
      showToast('Address removed.');
      setAddresses(prev => prev.filter(a => a.id !== addrId));
    } catch (e) {
      showToast('Error removing address.');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('leafora_user_token');
    localStorage.removeItem('leafora_user_profile');
    showToast('Signed out successfully.');
    setTimeout(() => navigate('/login'), 500);
  };

  if (loading) {
    return (
      <div className="user-dashboard-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #EFE8DE', borderTop: '4px solid #A67C52', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748B' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DASHBOARD TOP HEADER BANNER */}
      <div className="dashboard-header-card">
        <div className="user-avatar-box">
          <img 
            src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Customer')}`} 
            alt={user?.name} 
          />
        </div>

        <div className="user-welcome-info">
          <h1>Welcome, {user?.first_name || user?.name || 'Valued Member'}!</h1>
          <p>{user?.email} • Member Tier: <span className="tier-badge">{user?.loyalty_tier || 'Silver Member'}</span></p>
        </div>

        <div className="dashboard-quick-stats">
          <div className="stat-pill">
            <Award size={18} color="var(--leafora-bronze)" />
            <div>
              <span className="stat-val">{user?.loyalty_points || 100}</span>
              <span className="stat-lbl">Rewards Points</span>
            </div>
          </div>

          <div className="stat-pill">
            <ShoppingBag size={18} color="var(--leafora-bronze)" />
            <div>
              <span className="stat-val">₹{Number(user?.wallet_balance || 0).toFixed(2)}</span>
              <span className="stat-lbl">Wallet Cash</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD LAYOUT */}
      <div className="dashboard-main-grid">
        
        {/* LEFT TAB NAVIGATION SIDEBAR */}
        <div className="dashboard-tabs-sidebar">
          <button 
            className={`dashboard-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Personal Details
          </button>

          <button 
            className={`dashboard-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={18} /> Delivery Address Details
          </button>

          <button 
            className={`dashboard-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={18} /> Previous Orders
          </button>

          <button 
            className={`dashboard-nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            <Heart size={18} /> Wishlist Favorites
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid #EFE8DE', margin: '12px 0' }} />

          <button className="dashboard-nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* RIGHT TAB CONTENT AREA */}
        <div className="dashboard-content-panel">

          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'profile' && (
            <div className="tab-card-body">
              <div className="tab-card-title">
                <h2>Personal Details</h2>
                <p>Manage your account profile details and contact info.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="profile-form-grid">
                <div className="form-group-row">
                  <div className="form-group-col">
                    <label>First Name *</label>
                    <input 
                      type="text" 
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-col">
                    <label>Last Name</label>
                    <input 
                      type="text" 
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group-col">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      value={profileForm.email}
                      readOnly 
                      style={{ background: '#F8F4EE', cursor: 'not-allowed' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>Registered Email (Verified)</span>
                  </div>

                  <div className="form-group-col">
                    <label>Mobile Number *</label>
                    <input 
                      type="tel" 
                      placeholder="+91 9876543210"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-save-profile" disabled={savingProfile}>
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: DELIVERY ADDRESS DETAILS */}
          {activeTab === 'addresses' && (
            <div className="tab-card-body">
              <div className="tab-card-header-row">
                <div className="tab-card-title">
                  <h2>Delivery Address Details</h2>
                  <p>Manage saved shipping addresses for fast 1-click checkout.</p>
                </div>
                <button className="btn-add-new-addr" onClick={() => setShowAddressModal(true)}>
                  <Plus size={16} /> Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="empty-tab-state">
                  <MapPin size={48} color="#A67C52" />
                  <h3>No Delivery Addresses Saved Yet</h3>
                  <p>Add a delivery address so you can quickly place orders during checkout.</p>
                  <button className="btn-add-new-addr" onClick={() => setShowAddressModal(true)} style={{ marginTop: 12 }}>
                    <Plus size={16} /> Add Delivery Address Now
                  </button>
                </div>
              ) : (
                <div className="addresses-grid">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`address-card ${addr.is_default ? 'default' : ''}`}>
                      {addr.is_default ? <span className="default-badge"><Check size={12} /> Default Delivery Address</span> : null}
                      <h4 className="addr-name">{addr.name || user?.name}</h4>
                      <p className="addr-text">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="addr-text">{addr.address_line2}</p>}
                      <p className="addr-text">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="addr-phone">Phone: {addr.phone || user?.phone}</p>

                      <div className="addr-actions">
                        <button className="btn-addr-del" onClick={() => handleDeleteAddress(addr.id)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREVIOUS ORDERS */}
          {activeTab === 'orders' && (
            <div className="tab-card-body">
              <div className="tab-card-title">
                <h2>Previous Orders</h2>
                <p>View complete history of your botanical orders and live shipment status.</p>
              </div>

              {orders.length === 0 ? (
                <div className="empty-tab-state">
                  <Package size={48} color="#A67C52" />
                  <h3>No Orders Placed Yet</h3>
                  <p>Explore our organic formulations and place your first order today.</p>
                  <Link to="/shop" className="btn-add-new-addr" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
                    Browse Shop Catalog
                  </Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((ord) => (
                    <div key={ord.id} className="order-history-card">
                      <div className="order-card-header">
                        <div>
                          <span className="ord-number">Order #{ord.order_number}</span>
                          <span className="ord-date">{new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <span className={`ord-status-pill ${ord.status.toLowerCase()}`}>{ord.status}</span>
                      </div>

                      <div className="order-items-preview">
                        {ord.items && ord.items.map((item, idx) => (
                          <div key={idx} className="ord-item-row">
                            <img src={item.product_image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='} alt={item.product_name} />
                            <div className="ord-item-info">
                              <span className="item-title">{item.product_name}</span>
                              <span className="item-qty">Qty: {item.quantity} x ₹{Number(item.price).toFixed(2)}</span>
                            </div>
                            <span className="item-total">₹{Number(item.total_price || item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-card-footer">
                        <div className="total-amount-box">
                          <span>Total Amount:</span>
                          <strong>₹{Number(ord.total_amount).toFixed(2)}</strong>
                        </div>
                        <button className="btn-view-ord-details" onClick={() => setSelectedOrderDetails(ord)}>
                          <Eye size={14} /> View Order Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WISHLIST FAVORITES */}
          {activeTab === 'wishlist' && (
            <div className="tab-card-body">
              <div className="tab-card-title">
                <h2>Wishlist Favorites</h2>
                <p>Saved botanical skincare products for your routine.</p>
              </div>

              {wishlist.length === 0 ? (
                <div className="empty-tab-state">
                  <Heart size={48} color="#A67C52" />
                  <h3>Your Wishlist is Empty</h3>
                  <p>Save items you love while shopping to quickly add them to your cart later.</p>
                  <Link to="/shop" className="btn-add-new-addr" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
                    Discover Products
                  </Link>
                </div>
              ) : (
                <div className="wishlist-grid">
                  {wishlist.map((item) => (
                    <div key={item.id} className="wishlist-card">
                      <img src={item.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='} alt={item.name} />
                      <h4>{item.name}</h4>
                      <p className="wish-price">₹{Number(item.price).toFixed(2)}</p>
                      <button 
                        className="btn-wish-cart"
                        onClick={() => {
                          addToCart(item, 1);
                          showToast(`Added "${item.name}" to cart!`);
                        }}
                      >
                        <ShoppingBag size={14} /> Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ADD NEW ADDRESS MODAL */}
      {showAddressModal && (
        <div className="modal-backdrop" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Delivery Address</h3>
              <button onClick={() => setShowAddressModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddAddress} className="modal-form">
              <div className="form-group-row">
                <div className="form-group-col">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="Recipient Name"
                    value={newAddr.name}
                    onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group-col">
                  <label>Mobile Number *</label>
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number"
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div className="form-group-col">
                <label>Street Address / Flat / Building *</label>
                <input 
                  type="text" 
                  placeholder="House No., Street Name, Area"
                  value={newAddr.address_line1}
                  onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group-col">
                <label>Landmark / Suite (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Near landmark"
                  value={newAddr.address_line2}
                  onChange={(e) => setNewAddr({ ...newAddr, address_line2: e.target.value })}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group-col">
                  <label>City *</label>
                  <input 
                    type="text" 
                    placeholder="City"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    required 
                  />
                </div>

                <div className="form-group-col">
                  <label>State *</label>
                  <input 
                    type="text" 
                    placeholder="State"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    required 
                  />
                </div>

                <div className="form-group-col">
                  <label>Pincode *</label>
                  <input 
                    type="text" 
                    placeholder="6-digit ZIP / Pincode"
                    value={newAddr.pincode}
                    onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div style={{ margin: '12px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={newAddr.is_default}
                    onChange={(e) => setNewAddr({ ...newAddr, is_default: e.target.checked })}
                  />
                  <span>Make this my default delivery address</span>
                </label>
              </div>

              <button type="submit" className="btn-save-profile" disabled={addingAddr}>
                {addingAddr ? 'Saving Address...' : 'Save Delivery Address'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedOrderDetails(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Order #{selectedOrderDetails.order_number} Details</h3>
              <button onClick={() => setSelectedOrderDetails(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <p><strong>Status:</strong> <span className={`ord-status-pill ${selectedOrderDetails.status.toLowerCase()}`}>{selectedOrderDetails.status}</span></p>
              <p style={{ marginTop: 8 }}><strong>Delivery Address:</strong> {selectedOrderDetails.shipping_address}</p>
              <p style={{ marginTop: 8 }}><strong>Total Amount:</strong> ₹{Number(selectedOrderDetails.total_amount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
