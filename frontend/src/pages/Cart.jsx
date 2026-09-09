import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Trash2, ArrowLeft, ShieldCheck, Truck, Sparkles, CheckCircle2, 
  MapPin, Plus, Check, CreditCard, X, ChevronRight, AlertCircle, Phone, User
} from 'lucide-react';
import { getCart, getCartSubtotal, updateCartQuantity, removeFromCart, clearCart } from '../services/cartService';
import { userGetAddresses, userAddAddress, placeOrder } from '../services/api';
import './Cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  // User Auth & Checkout State
  const [user, setUser] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  // Add New Address Inline State
  const [showInlineAddrForm, setShowInlineAddrForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    type: 'Home',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: true
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Order Placement State
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlacedData, setOrderPlacedData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshCart = () => {
    setCartItems(getCart());
    setSubtotal(getCartSubtotal());
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener('leafora_cart_updated', refreshCart);
    window.addEventListener('storage', refreshCart);

    // Sync logged in user
    const storedUser = localStorage.getItem('leafora_user_profile');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('leafora_cart_updated', refreshCart);
      window.removeEventListener('storage', refreshCart);
    };
  }, []);

  const shippingCost = subtotal >= 999 ? 0 : (subtotal > 0 ? 99 : 0);
  const totalAmount = subtotal + shippingCost;

  // Handle "Place Order Now" Click
  const handlePlaceOrderClick = () => {
    const token = localStorage.getItem('leafora_user_token');
    const storedUser = localStorage.getItem('leafora_user_profile');

    if (!token || !storedUser) {
      showToast('Please sign in or create an account to place your order.');
      setTimeout(() => {
        navigate('/login?redirect=/cart');
      }, 600);
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      setUser(u);
      setNewAddress(prev => ({
        ...prev,
        name: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.name || '',
        phone: u.phone || u.mobile || ''
      }));

      // Fetch user's saved addresses
      if (u.email) {
        userGetAddresses(u.email)
          .then(res => {
            const addrs = res?.data?.addresses || [];
            setUserAddresses(addrs);
            if (addrs.length > 0) {
              const def = addrs.find(a => a.is_default) || addrs[0];
              setSelectedAddressId(def.id);
            } else {
              setShowInlineAddrForm(true);
            }
          })
          .catch(() => setShowInlineAddrForm(true));
      } else {
        setShowInlineAddrForm(true);
      }

      setShowCheckoutModal(true);
    } catch (e) {
      navigate('/login?redirect=/cart');
    }
  };

  // Add Inline Address Submit
  const handleAddInlineAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      showToast('Please complete street address, city, state, and pincode.');
      return;
    }

    setSavingAddress(true);
    try {
      const payload = {
        ...newAddress,
        email: user.email,
        customer_id: user.id
      };
      const res = await userAddAddress(payload);
      if (res?.data?.success || res?.success) {
        showToast('New delivery address saved!');
        setShowInlineAddrForm(false);
        // Refresh address list
        const refreshed = await userGetAddresses(user.email);
        const addrs = refreshed?.data?.addresses || [];
        setUserAddresses(addrs);
        if (res?.data?.address_id) {
          setSelectedAddressId(res.data.address_id);
        } else if (addrs.length > 0) {
          setSelectedAddressId(addrs[0].id);
        }
      }
    } catch (err) {
      showToast(err.message || 'Error saving delivery address.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Confirm Order Submit
  const handleConfirmOrder = async () => {
    let chosenAddress = null;
    if (selectedAddressId) {
      chosenAddress = userAddresses.find(a => a.id === selectedAddressId);
    }

    if (!chosenAddress && (newAddress.address_line1 && newAddress.city && newAddress.pincode)) {
      chosenAddress = newAddress;
    }

    if (!chosenAddress) {
      showToast('Please select or add a delivery address.');
      setShowInlineAddrForm(true);
      return;
    }

    setPlacingOrder(true);
    try {
      const payload = {
        customer_name: user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Valued Customer'),
        customer_email: user?.email,
        customer_phone: user?.phone || chosenAddress.phone || '',
        shipping_address: chosenAddress,
        items: cartItems,
        subtotal,
        shipping_fee: shippingCost,
        total_amount: totalAmount,
        payment_method: paymentMethod
      };

      const res = await placeOrder(payload);
      if (res?.data?.success || res?.success) {
        const ord = res?.data?.order || res?.order;
        setOrderPlacedData(ord);
        clearCart();
        refreshCart();
      } else {
        showToast(res?.message || 'Error placing order. Please try again.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="cart-page-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="toast-banner" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="cart-page-inner">
        {/* HEADER BREADCRUMB */}
        <div className="cart-page-header">
          <Link to="/products" className="cart-back-link">
            <ArrowLeft size={18} /> Continue Shopping
          </Link>
          <h1 className="cart-page-title">
            Your Shopping Bag <span className="cart-title-count">({cartItems.reduce((a, b) => a + (b.quantity || 1), 0)})</span>
          </h1>
        </div>

        {cartItems.length === 0 && !orderPlacedData ? (
          <div className="cart-page-empty">
            <div className="cart-empty-icon-wrap">
              <ShoppingBag size={56} color="#A67C52" />
            </div>
            <h2>Your Shopping Bag is Empty</h2>
            <p>Looks like you haven't added any botanical skincare items to your cart yet.</p>
            <Link to="/products" className="cart-shop-now-btn">
              Explore Our Collection →
            </Link>
          </div>
        ) : orderPlacedData ? (
          /* SUCCESS ORDER CONFIRMATION DISPLAY */
          <div className="cart-page-empty" style={{ maxWidth: 640 }}>
            <div className="cart-empty-icon-wrap" style={{ background: '#E6F4EA', color: '#15803D' }}>
              <CheckCircle2 size={64} color="#15803D" />
            </div>
            <h2 style={{ color: '#1A2E22' }}>Order Confirmed Successfully!</h2>
            <p style={{ fontSize: '1.05rem', color: '#475569', margin: '8px 0 16px 0' }}>
              Order Number: <strong style={{ color: '#A67C52' }}>#{orderPlacedData.order_number}</strong>
            </p>
            <p style={{ fontSize: '0.92rem', color: '#64748B', lineHeight: 1.6 }}>
              A confirmation email has been dispatched to <strong>{user?.email}</strong>. You can track your order status live from your personal dashboard.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 28 }}>
              <Link to="/dashboard?tab=orders" className="cart-shop-now-btn" style={{ background: '#1A2E22' }}>
                View Order in Dashboard →
              </Link>
              <Link to="/products" className="cart-shop-now-btn" style={{ background: '#FFFFFF', color: '#A67C52', border: '1.5px solid #A67C52' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-page-grid">
            {/* LEFT COLUMN: CART ITEMS LIST */}
            <div className="cart-items-section">
              {/* FREE SHIPPING BANNER */}
              <div className="cart-shipping-alert">
                {subtotal >= 999 ? (
                  <div className="shipping-alert-success">
                    <Truck size={20} color="#15803D" />
                    <div>
                      <strong>Free Express Shipping Unlocked!</strong>
                      <div className="shipping-subtext">You qualify for free delivery across India.</div>
                    </div>
                  </div>
                ) : (
                  <div className="shipping-alert-progress">
                    <Truck size={20} color="#A67C52" />
                    <div style={{ flex: 1 }}>
                      <div>Add <strong>₹{(999 - subtotal).toFixed(2)}</strong> more to unlock <strong>FREE Express Shipping</strong></div>
                      <div className="cart-progress-bar-bg" style={{ marginTop: 6 }}>
                        <div 
                          className="cart-progress-bar-fill" 
                          style={{ width: `${Math.min(100, (subtotal / 999) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="cart-items-card-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <img 
                      src={item.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='} 
                      alt={item.name} 
                      className="cart-item-image" 
                    />
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <div className="cart-item-brand">{item.brand || 'LeafOra Life Sciences'}</div>
                      <div className="cart-item-unit-cost">₹{parseFloat(item.price || 0).toFixed(2)} / unit</div>
                      
                      <div className="cart-item-controls-mobile">
                        <div className="cart-qty-picker">
                          <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <button className="cart-remove-icon-btn" onClick={() => removeFromCart(item.id)}>
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total-col">
                      <div className="cart-item-total-price">
                        ₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-actions-bar">
                <button className="cart-clear-btn" onClick={() => clearCart()}>
                  <Trash2 size={15} /> Clear Shopping Bag
                </button>
                <Link to="/products" className="cart-continue-link">
                  + Add More Products
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <div className="cart-summary-section">
              <div className="cart-summary-card">
                <h3 className="summary-title">Order Summary</h3>

                <div className="summary-row">
                  <span>Items Subtotal</span>
                  <span className="summary-val">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Shipping Fee</span>
                  <span className="summary-val">
                    {shippingCost === 0 ? <strong style={{ color: '#15803D' }}>FREE</strong> : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="summary-row summary-total-row">
                  <span>Total Amount</span>
                  <span className="summary-total-val">₹{totalAmount.toFixed(2)}</span>
                </div>

                <button 
                  className="cart-checkout-main-btn"
                  onClick={handlePlaceOrderClick}
                >
                  Place Order Now →
                </button>

                <div className="cart-trust-badges">
                  <div className="trust-item"><ShieldCheck size={16} color="#15803D" /> 100% Secure Checkout</div>
                  <div className="trust-item"><Sparkles size={16} color="#A67C52" /> Pure Herbal Formulations</div>
                  <div className="trust-item"><CheckCircle2 size={16} color="#2563EB" /> 7-Day Easy Returns</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHECKOUT ADDRESS SELECTION MODAL */}
      {showCheckoutModal && (
        <div className="modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Select Delivery Address & Checkout</h3>
              <button onClick={() => setShowCheckoutModal(false)}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* ADDRESS SELECTION SECTION */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#1A2E22' }}>
                    1. Choose Delivery Address
                  </h4>
                  {!showInlineAddrForm && (
                    <button 
                      onClick={() => setShowInlineAddrForm(true)}
                      style={{ background: 'none', border: 'none', color: '#A67C52', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  )}
                </div>

                {/* SAVED ADDRESSES RADIO LIST */}
                {!showInlineAddrForm && userAddresses.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {userAddresses.map((addr) => (
                      <label 
                        key={addr.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: 16,
                          border: `1.5px solid ${selectedAddressId === addr.id ? '#A67C52' : '#EFE8DE'}`,
                          borderRadius: 12,
                          background: selectedAddressId === addr.id ? '#FAF7F2' : '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        <input 
                          type="radio" 
                          name="checkout_address" 
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          style={{ marginTop: 4 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2D3748', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {addr.name || user?.name}
                            {addr.is_default && <span style={{ fontSize: '0.7rem', background: '#A67C52', color: '#FFF', padding: '2px 8px', borderRadius: 10 }}>Default</span>}
                          </div>
                          <div style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 4 }}>
                            {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#2D3748', fontWeight: 600, marginTop: 4 }}>
                            Phone: {addr.phone || user?.phone}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* INLINE ADD NEW ADDRESS FORM */}
                {(showInlineAddrForm || userAddresses.length === 0) && (
                  <form onSubmit={handleAddInlineAddress} style={{ background: '#FAF7F2', padding: 18, borderRadius: 12, border: '1px solid #EFE8DE' }}>
                    <h5 style={{ margin: '0 0 14px 0', color: '#1A2E22' }}>+ Add New Delivery Address</h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <input 
                        type="text" 
                        placeholder="Full Name *"
                        value={newAddress.name}
                        onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                        required
                        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #EFE8DE', fontSize: '0.88rem' }}
                      />
                      <input 
                        type="tel" 
                        placeholder="Mobile Number *"
                        value={newAddress.phone}
                        onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                        required
                        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #EFE8DE', fontSize: '0.88rem' }}
                      />
                    </div>

                    <input 
                      type="text" 
                      placeholder="Flat, House No., Building, Street *"
                      value={newAddress.address_line1}
                      onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #EFE8DE', fontSize: '0.88rem', marginBottom: 12, boxSizing: 'border-box' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <input 
                        type="text" 
                        placeholder="City *"
                        value={newAddress.city}
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                        required
                        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #EFE8DE', fontSize: '0.88rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="State *"
                        value={newAddress.state}
                        onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                        required
                        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #EFE8DE', fontSize: '0.88rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Pincode *"
                        value={newAddress.pincode}
                        onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        required
                        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #EFE8DE', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button 
                        type="submit" 
                        disabled={savingAddress}
                        style={{ padding: '8px 18px', background: '#A67C52', color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {savingAddress ? 'Saving...' : 'Save & Select Address'}
                      </button>
                      {userAddresses.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => setShowInlineAddrForm(false)}
                          style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* PAYMENT METHOD SECTION */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px 0', fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#1A2E22' }}>
                  2. Payment Option
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 14,
                      border: `1.5px solid ${paymentMethod === 'COD' ? '#A67C52' : '#EFE8DE'}`,
                      borderRadius: 10,
                      background: paymentMethod === 'COD' ? '#FAF7F2' : '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="payment_method" 
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    💵 Cash on Delivery (COD)
                  </label>

                  <label 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 14,
                      border: `1.5px solid ${paymentMethod === 'UPI' ? '#A67C52' : '#EFE8DE'}`,
                      borderRadius: 10,
                      background: paymentMethod === 'UPI' ? '#FAF7F2' : '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="payment_method" 
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                    />
                    💳 Pay Online (UPI / Card)
                  </label>
                </div>
              </div>

              {/* ORDER RECAP & FINAL CONFIRM BUTTON */}
              <div style={{ background: '#FAF7F2', padding: 18, borderRadius: 12, border: '1px solid #EFE8DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Total Payable Amount</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1A2E22' }}>₹{totalAmount.toFixed(2)}</div>
                </div>

                <button 
                  onClick={handleConfirmOrder}
                  disabled={placingOrder}
                  style={{
                    padding: '12px 28px',
                    background: '#A67C52',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 24,
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(166, 124, 82, 0.35)'
                  }}
                >
                  {placingOrder ? 'Processing Order...' : 'Confirm & Place Order →'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

