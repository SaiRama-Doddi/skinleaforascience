import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowLeft, ShieldCheck, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { getCart, getCartSubtotal, updateCartQuantity, removeFromCart, clearCart } from '../services/cartService';
import './Cart.css';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  const refreshCart = () => {
    setCartItems(getCart());
    setSubtotal(getCartSubtotal());
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener('leafora_cart_updated', refreshCart);
    window.addEventListener('storage', refreshCart);
    return () => {
      window.removeEventListener('leafora_cart_updated', refreshCart);
      window.removeEventListener('storage', refreshCart);
    };
  }, []);

  const shippingCost = subtotal >= 999 ? 0 : (subtotal > 0 ? 99 : 0);
  const totalAmount = subtotal + shippingCost;

  return (
    <div className="cart-page-container">
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
                  onClick={() => alert('Order Placed Successfully! Thank you for choosing LeafOra Life Sciences.')}
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
    </div>
  );
}
