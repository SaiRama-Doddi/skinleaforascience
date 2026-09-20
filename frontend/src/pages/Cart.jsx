import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Trash2, ArrowLeft, ShieldCheck, Truck, Sparkles, CheckCircle2, 
  MapPin, Plus, Check, CreditCard, X, ChevronRight, AlertCircle, Phone, User, Navigation, Lock
} from 'lucide-react';
import { getCart, getCartSubtotal, updateCartQuantity, removeFromCart, clearCart, DEFAULT_PRODUCT_IMAGE } from '../services/cartService';
import { userGetAddresses, userAddAddress, placeOrder, createRazorpayOrder, verifyRazorpayPayment } from '../services/api';
import { detectLiveLocation } from '../services/locationService';
import './Cart.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  // User Auth & Checkout State
  const [user, setUser] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  
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
  const [detectingLoc, setDetectingLoc] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDetectLocation = async () => {
    setDetectingLoc(true);
    try {
      const loc = await detectLiveLocation();
      setNewAddress(prev => ({
        ...prev,
        address_line1: loc.address_line1 || prev.address_line1,
        city: loc.city || prev.city,
        state: loc.state || prev.state,
        pincode: loc.pincode || prev.pincode
      }));
      showToast('📍 Live location detected and filled successfully!');
    } catch (err) {
      showToast(err.message || 'Could not detect live location.');
    } finally {
      setDetectingLoc(false);
    }
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

    // Preload Razorpay SDK script
    loadRazorpayScript().catch(() => {});

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
            if (res && res.data && res.data.length > 0) {
              setUserAddresses(res.data);
              const def = res.data.find(a => a.is_default) || res.data[0];
              setSelectedAddressId(def.id);
            } else {
              setShowInlineAddrForm(true);
            }
          })
          .catch(() => {
            setShowInlineAddrForm(true);
          });
      }

      setShowCheckoutModal(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      navigate('/login?redirect=/cart');
    }
  };

  // Handle Add Inline Address Submit
  const handleAddInlineAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      showToast('Please fill all mandatory address fields.');
      return;
    }

    setSavingAddress(true);
    try {
      const payload = {
        ...newAddress,
        name: newAddress.name || user?.name || 'Customer',
        email: user?.email,
        phone: newAddress.phone || user?.phone || user?.mobile || '9999999999'
      };

      const res = await userAddAddress(payload);
      if (res && res.success) {
        showToast('Delivery address saved successfully in database!');
        const savedId = res.address_id || (res.data && res.data.id);
        if (user?.email) {
          const addrs = await userGetAddresses(user.email);
          const list = addrs?.data || addrs?.addresses || [];
          if (list.length > 0) {
            setUserAddresses(list);
            setSelectedAddressId(savedId || list[0].id);
          }
        }
        setShowInlineAddrForm(false);
      } else {
        showToast(res?.message || 'Failed to save address.');
      }
    } catch (error) {
      showToast(error.message || 'Error saving address.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle Razorpay Order Placement
  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      showToast('Your shopping cart is empty.');
      return;
    }

    let finalAddress = null;
    if (userAddresses.length > 0 && selectedAddressId) {
      finalAddress = userAddresses.find(a => a.id === selectedAddressId);
    }

    if (!finalAddress) {
      if (!newAddress.address_line1 || !newAddress.city || !newAddress.pincode) {
        showToast('Please select or add a delivery address to proceed.');
        return;
      }
      finalAddress = newAddress;
    }

    setPlacingOrder(true);

    try {
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        showToast('Payment gateway failed to load. Check your internet connection.');
        setPlacingOrder(false);
        return;
      }

      // 1. Create Razorpay backend order
      const rzpOrderRes = await createRazorpayOrder({
        amount: totalAmount,
        currency: 'INR',
        customer_email: user?.email,
        customer_phone: finalAddress.phone || user?.phone || '9999999999'
      });

      if (!rzpOrderRes || !rzpOrderRes.success) {
        throw new Error(rzpOrderRes?.message || 'Could not initialize payment order.');
      }

      const orderKeyId = (rzpOrderRes.key_id || 'rzp_test_SwedUUn1KgRMs0').trim();
      const orderId = rzpOrderRes.order_id || rzpOrderRes.order?.id;
      const orderAmount = rzpOrderRes.amount || rzpOrderRes.order?.amount || Math.round(totalAmount * 100);
      const orderCurrency = rzpOrderRes.currency || rzpOrderRes.order?.currency || 'INR';

      // 2. Launch Razorpay Standard Checkout Popup
      const options = {
        key: orderKeyId,
        amount: orderAmount,
        currency: orderCurrency,
        name: 'Leafora Life Science',
        description: `Order for ${cartItems.length} Botanical Skincare Product(s)`,
        order_id: orderId,
        prefill: {
          name: finalAddress.name || user?.name || '',
          email: user?.email || '',
          contact: finalAddress.phone || user?.phone || ''
        },
        theme: {
          color: '#0C4F25'
        },
        handler: async function (response) {
          try {
            setPlacingOrder(true);
            showToast('Verifying payment and generating order invoice...');

            // 3. Verify Payment Signature
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer_email: user?.email,
              shipping_address: finalAddress,
              items: cartItems,
              total_amount: totalAmount,
              payment_method: 'Razorpay Online'
            });

            if (verifyRes && verifyRes.success) {
              clearCart();
              setShowCheckoutModal(false);
              setOrderPlacedData({
                order_number: verifyRes.order_number || verifyRes.order_id || `LFA-${Date.now().toString().slice(-6)}`,
                total_amount: totalAmount,
                payment_id: response.razorpay_payment_id
              });
              showToast('🎉 Order placed successfully! Thank you.');
            } else {
              showToast(verifyRes?.message || 'Payment verification failed. Please contact support.');
            }
          } catch (verErr) {
            console.error('Verification error:', verErr);
            showToast(verErr.message || 'Payment verification failed.');
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
            showToast('Payment window closed. You can retry checkout anytime.');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp) {
        showToast(`Payment failed: ${resp.error.description}`);
        setPlacingOrder(false);
      });

      razorpayInstance.open();
    } catch (error) {
      console.error('Checkout error:', error);
      showToast(error.message || 'Failed to open payment gateway.');
      setPlacingOrder(false);
    }
  };

  return (
    <div className="cart-page-container">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="cart-toast-banner">
          <Sparkles size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ORDER CONFIRMED SUCCESS VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {orderPlacedData ? (
        <div className="cart-page-inner" style={{ maxWidth: 720 }}>
          <div className="cart-success-luxury-card">
            <div className="cart-success-icon-wrap">
              <CheckCircle2 size={68} color="#0C4F25" />
            </div>
            <h2>Order Confirmed Successfully!</h2>
            <div className="cart-success-order-num">
              Order Reference: <strong>#{orderPlacedData.order_number}</strong>
            </div>
            <p className="cart-success-note">
              We've dispatched your confirmation details to <strong>{user?.email}</strong>. Our herbalists are preparing your fresh botanical order.
            </p>

            <div className="cart-success-btn-group">
              <Link to="/dashboard?tab=orders" className="cart-primary-action-btn">
                View Order in Dashboard →
              </Link>
              <Link to="/products" className="cart-secondary-action-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      ) : showCheckoutModal ? (

        /* ───────────────────────────────────────────────────────────── */
        /* 2. FULL SCREEN WIDTH LUXURY CHECKOUT & ADDRESS VIEW */
        /* ───────────────────────────────────────────────────────────── */
        <div className="cart-fullscreen-checkout-view">
          
          {/* TOP CHECKOUT NAVIGATION BAR */}
          <div className="checkout-fullscreen-topbar">
            <button 
              type="button" 
              className="checkout-back-to-bag-btn"
              onClick={() => setShowCheckoutModal(false)}
            >
              <ArrowLeft size={18} /> Back to Shopping Bag
            </button>

            <div className="checkout-stepper-track">
              <span className="step-tag-pill completed">1. Bag ({cartItems.length})</span>
              <span className="step-arrow-divider">›</span>
              <span className="step-tag-pill active">2. Choose Delivery Address & Payment</span>
            </div>

            <div className="checkout-security-badge">
              <Lock size={15} color="#0C4F25" />
              <span>256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>

          {/* FULL WIDTH 2-COLUMN MAIN CHECKOUT GRID */}
          <div className="checkout-fullscreen-grid">
            
            {/* LEFT COLUMN: DELIVERY ADDRESS & PAYMENT (65% WIDTH) */}
            <div className="checkout-left-main-col">
              
              {/* SECTION 1: CHOOSE DELIVERY ADDRESS */}
              <div className="checkout-panel-box">
                <div className="checkout-panel-header">
                  <div className="panel-title-group">
                    <span className="panel-step-num">1</span>
                    <h3 className="panel-heading">Choose Delivery Address</h3>
                  </div>
                  {!showInlineAddrForm && (
                    <button 
                      type="button"
                      className="add-new-addr-trigger-btn"
                      onClick={() => setShowInlineAddrForm(true)}
                    >
                      <Plus size={16} /> Add New Address
                    </button>
                  )}
                </div>

                {/* SAVED ADDRESSES LIST */}
                {!showInlineAddrForm && userAddresses.length > 0 && (
                  <div className="saved-addresses-grid">
                    {userAddresses.map((addr) => (
                      <label 
                        key={addr.id} 
                        className={`saved-address-luxury-card ${selectedAddressId === addr.id ? 'is-selected' : ''}`}
                      >
                        <input 
                          type="radio" 
                          name="checkout_delivery_addr" 
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="addr-radio-input"
                        />
                        <div className="addr-card-body">
                          <div className="addr-card-name-row">
                            <span className="addr-person-name">{addr.name || user?.name}</span>
                            {addr.is_default && <span className="addr-default-badge">Default</span>}
                            {selectedAddressId === addr.id && <span className="addr-selected-tag">Selected</span>}
                          </div>
                          <p className="addr-street-line">
                            {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                          </p>
                          <div className="addr-phone-line">
                            <Phone size={14} /> Phone: <span>{addr.phone || user?.phone || user?.mobile}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* INLINE ADD NEW ADDRESS FORM */}
                {(showInlineAddrForm || userAddresses.length === 0) && (
                  <form onSubmit={handleAddInlineAddress} className="inline-add-address-card">
                    <div className="inline-form-top">
                      <h4>+ Add New Delivery Address</h4>
                      <button 
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={detectingLoc}
                        className="detect-live-location-btn"
                      >
                        <Navigation size={15} style={{ animation: detectingLoc ? 'spinLoc 1s linear infinite' : 'none' }} />
                        {detectingLoc ? 'Detecting Location...' : '📍 Detect My Live Location'}
                      </button>
                    </div>

                    <div className="inline-form-row two-cols">
                      <div className="form-input-field">
                        <label>Full Name *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Himmat Ahir"
                          value={newAddress.name}
                          onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-input-field">
                        <label>Mobile Number *</label>
                        <input 
                          type="tel" 
                          placeholder="10-digit mobile number"
                          value={newAddress.phone}
                          onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-input-field full-width">
                      <label>Flat, House No., Building, Street Address *</label>
                      <input 
                        type="text" 
                        placeholder="29 harekrishna park, near shivaji chowk nikol"
                        value={newAddress.address_line1}
                        onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                        required
                      />
                    </div>

                    <div className="inline-form-row three-cols">
                      <div className="form-input-field">
                        <label>City *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Ahmedabad"
                          value={newAddress.city}
                          onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-input-field">
                        <label>State *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Gujarat"
                          value={newAddress.state}
                          onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-input-field">
                        <label>Pincode *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 382350"
                          value={newAddress.pincode}
                          onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="inline-form-actions-row">
                      <button 
                        type="submit" 
                        disabled={savingAddress}
                        className="save-addr-primary-btn"
                      >
                        {savingAddress ? 'Saving Address...' : 'Save & Deliver to this Address'}
                      </button>
                      {userAddresses.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => setShowInlineAddrForm(false)}
                          className="cancel-addr-btn"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* SECTION 2: PAYMENT GATEWAY */}
              <div className="checkout-panel-box">
                <div className="checkout-panel-header">
                  <div className="panel-title-group">
                    <span className="panel-step-num">2</span>
                    <h3 className="panel-heading">Payment Gateway</h3>
                  </div>
                </div>

                <div className="razorpay-gateway-highlight-card">
                  <div className="gateway-left-meta">
                    <div className="gateway-icon-circle">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <div className="gateway-name-row">
                        <h4>Razorpay Secure Gateway</h4>
                        <span className="gateway-ssl-badge">SSL Encrypted</span>
                      </div>
                      <p className="gateway-desc">
                        Pay securely via UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking & Wallets.
                      </p>
                    </div>
                  </div>
                  <div className="gateway-check-circle">
                    <CheckCircle2 size={24} color="#0C4F25" />
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: STICKY ORDER SUMMARY (35% WIDTH) */}
            <div className="checkout-right-summary-col">
              <div className="checkout-summary-sticky-card">
                <h3 className="summary-card-title">Order Summary ({cartItems.length} items)</h3>
                
                {/* ITEMS MINI PREVIEW */}
                <div className="checkout-items-preview-scroll">
                  {cartItems.map((item) => (
                    <div key={item.id} className="checkout-preview-item-row">
                      <img 
                        src={item.image_url || DEFAULT_PRODUCT_IMAGE} 
                        alt={item.name} 
                        className="preview-item-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                      <div className="preview-item-info">
                        <span className="preview-item-name">{item.name}</span>
                        <span className="preview-item-qty">Qty: {item.quantity}</span>
                      </div>
                      <div className="preview-item-price">
                        ₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-price-breakdown">
                  <div className="price-row">
                    <span>Items Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="price-row">
                    <span>Shipping Fee</span>
                    <span>
                      {shippingCost === 0 ? <strong style={{ color: '#0C4F25' }}>FREE</strong> : `₹${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="summary-divider-line"></div>

                  <div className="price-row total-amount-row">
                    <span>Total Payable Amount</span>
                    <span className="final-price-bold">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* PROCEED TO PAY CTA BUTTON */}
                <button 
                  onClick={handleConfirmOrder}
                  disabled={placingOrder}
                  className="checkout-pay-now-btn"
                >
                  {placingOrder ? 'Opening Razorpay Gateway...' : `Proceed to Pay with Razorpay →`}
                </button>

                <div className="checkout-guarantee-badges">
                  <div className="g-badge-item"><ShieldCheck size={16} color="#0C4F25" /> 100% Safe & Verified Transactions</div>
                  <div className="g-badge-item"><Truck size={16} color="#B88E2F" /> Express Insured Shipping Across India</div>
                  <div className="g-badge-item"><Sparkles size={16} color="#0C4F25" /> 100% Authentic Botanical Formulations</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      ) : (

        /* ───────────────────────────────────────────────────────────── */
        /* 3. STANDARD SHOPPING BAG VIEW */
        /* ───────────────────────────────────────────────────────────── */
        <div className="cart-page-inner">
          <div className="cart-page-header">
            <Link to="/products" className="cart-back-link">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
            <h1 className="cart-page-title">
              Your Shopping Bag
              <span className="cart-title-count">({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
            </h1>
          </div>

          {cartItems.length === 0 ? (
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
                        src={item.image_url || DEFAULT_PRODUCT_IMAGE} 
                        alt={item.name} 
                        className="cart-item-image" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PRODUCT_IMAGE;
                        }}
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
      )}

    </div>
  );
}
