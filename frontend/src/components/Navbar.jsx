import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, User, LogOut, Wallet, Search, ShoppingBag, ChevronDown, Sparkles, ShieldCheck, Menu, X, Trash2 } from 'lucide-react';
import { checkHealth, getCategories, getProducts } from '../services/api';
import { getCart, getCartCount, getCartSubtotal, updateCartQuantity, removeFromCart } from '../services/cartService';
import './Navbar.css';

export default function Navbar() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    checkHealth()
      .then((res) => setApiStatus(res?.success ? 'connected' : 'offline'))
      .catch(() => setApiStatus('offline'));

    // Sync user profile
    const savedUser = localStorage.getItem('leafora_user_profile');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }

    // Fetch categories for Mega Menu
    getCategories()
      .then(res => {
        if (res && res.data) setCategories(res.data);
      })
      .catch(() => {});

    // Sync Cart state live
    const updateCartState = () => {
      setCartCount(getCartCount());
      setCartItems(getCart());
    };
    updateCartState();

    window.addEventListener('leafora_cart_updated', updateCartState);
    window.addEventListener('storage', updateCartState);

    return () => {
      window.removeEventListener('leafora_cart_updated', updateCartState);
      window.removeEventListener('storage', updateCartState);
    };
  }, [location.pathname]);

  // Live search handler
  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      try {
        const res = await getProducts();
        if (res && res.data) {
          const filtered = res.data.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (p.category && p.category.toLowerCase().includes(q.toLowerCase())));
          setSearchResults(filtered.slice(0, 5));
        }
      } catch (err) {}
    } else {
      setSearchResults([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('leafora_user_token');
    localStorage.removeItem('leafora_user_profile');
    setUser(null);
    navigate('/login');
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="top-announcement-bar">
        <div className="top-bar-inner">
          <span className="announcement-text">
            🚚 <strong>Free Shipping</strong> on Orders Above ₹999 | Natural Skincare for a Healthier You
          </span>
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 2. MAIN STICKY NAVBAR */}
      <header className="leafora-main-navbar">
        <div className="navbar-inner">
          
          {/* Mobile Left: Hamburger Button */}
          <button 
            className="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Center: Brand Logo */}
          <Link to="/" className="brand-logo">
            <div className="logo-emblem">
              <Leaf size={18} fill="#FFFFFF" />
            </div>
            <div className="brand-text-col">
              <span className="brand-title">LeafOra</span>
              <span className="brand-subtitle">LIFE SCIENCES</span>
            </div>
          </Link>

          {/* MAIN NAV LINKS WITH MEGA MENU HOVER & MOBILE DRAWER */}
          <nav className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Mobile Drawer Header */}
            <div className="mobile-drawer-top">
              <span className="mobile-drawer-brand">LeafOra Life Sciences</span>
              <button className="btn-mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Mobile Dedicated Search Field */}
            <div className="mobile-drawer-search">
              <Search size={16} className="search-icon-nav" />
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/products" className={`nav-item ${location.pathname === '/products' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
              Shop Catalog
            </Link>
            <div 
              className="nav-item" 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
              onClick={() => { setShowMegaMenu(!showMegaMenu); }}
            >
              <span>Skincare</span> <ChevronDown size={14} />
            </div>
            <Link to="/products" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>Best Sellers</Link>
            <a href="#about" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
            <a href="#contact" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</a>

            <div className="mobile-drawer-footer">
              {!user ? (
                <Link to="/login" className="btn-mobile-login" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In / Create Account
                </Link>
              ) : (
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="btn-mobile-logout">
                  Sign Out ({user.name})
                </button>
              )}
            </div>
          </nav>

          {/* DESKTOP SEARCH BAR */}
          <div className="nav-search-box desktop-only">
            <Search size={16} className="search-icon-nav" />
            <input
              type="text"
              className="search-input"
              placeholder="Search for skincare, beauty..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map(item => (
                  <Link 
                    key={item.id} 
                    to={`/products/${item.id}`} 
                    className="search-result-item"
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setIsMobileMenuOpen(false); }}
                  >
                    <img src={item.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='} alt={item.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#292524' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#A67C52', fontWeight: 700 }}>₹{item.price}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* USER ACCOUNT BADGE & CART BUTTON IN NAVBAR */}
          <div className="nav-actions-right">
            <button 
              className="mobile-search-trigger"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {!user ? (
              <Link to="/login" className="nav-signin-btn desktop-only">
                Sign In
              </Link>
            ) : (
              <div className="user-badge-nav desktop-only">
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
                  <img 
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'User')}`} 
                    alt={user.name} 
                    className="user-avatar-img"
                  />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--leafora-green)' }}>
                    {user.first_name || (user.name ? user.name.split(' ')[0] : 'Account')}
                  </span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  title="Sign Out" 
                  className="btn-logout-icon"
                  style={{ marginLeft: 6 }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}

            <button 
              type="button"
              className="navbar-cart-btn"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={20} />
              <span className="cart-btn-label">Cart </span>
              <span className="cart-badge-count">{cartCount || 0}</span>
            </button>
          </div>

        </div>

        {/* MEGA MENU DROPDOWN DRAWER */}
        {showMegaMenu && (
          <div 
            className="mega-menu-wrapper"
            onMouseEnter={() => setShowMegaMenu(true)}
            onMouseLeave={() => setShowMegaMenu(false)}
          >
            <div className="mega-menu-inner">
              {categories.length > 0 ? (
                categories.slice(0, 3).map(cat => (
                  <div className="mega-column" key={cat.id}>
                    <h4>{cat.name}</h4>
                    <p style={{ fontSize: 12, color: '#78716C', marginBottom: 8 }}>
                      {cat.description || 'Formulated with pure botanical science.'}
                    </p>
                    <ul>
                      <li>
                        <Link to={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`}>
                          Browse {cat.name} Collection
                        </Link>
                      </li>
                    </ul>
                  </div>
                ))
              ) : (
                <div className="mega-column">
                  <h4>Categories</h4>
                  <p style={{ fontSize: 12, color: '#78716C' }}>No categories available in database.</p>
                </div>
              )}
              <div className="mega-column" style={{ background: '#FAF7F2', padding: 16, borderRadius: 14 }}>
                <h4 style={{ color: '#292524' }}>🌿 Pure Ingredients Guarantee</h4>
                <p style={{ fontSize: 12, color: '#78716C', lineHeight: 1.5, marginTop: 4 }}>
                  All Leafora formulations are 100% cruelty-free, paraben-free, and tested by dermatologists.
                </p>
                <Link to="/products" className="hero-cta-btn" style={{ fontSize: 12, padding: '8px 16px', marginTop: 10 }}>
                  Explore Collection →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MINI CART SLIDE-OUT DRAWER */}
        {isCartOpen && (
          <>
            <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)} />
            <div className="cart-drawer-panel">
              <div className="cart-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShoppingBag size={22} color="#A67C52" />
                  <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1F2937' }}>
                    Your Shopping Bag <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 400 }}>({cartCount})</span>
                  </h3>
                </div>
                <button className="btn-mobile-close" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
                  <X size={22} />
                </button>
              </div>

              <div className="cart-drawer-body">
                {cartItems.length > 0 && (
                  <div className="cart-shipping-banner">
                    {getCartSubtotal() >= 999 ? (
                      <div className="cart-shipping-unlocked">
                        🎉 <strong>Free Delivery Unlocked!</strong> You saved shipping fees.
                      </div>
                    ) : (
                      <div className="cart-shipping-progress">
                        <span>Add <strong>₹{(999 - getCartSubtotal()).toFixed(2)}</strong> more for <strong>Free Delivery</strong></span>
                        <div className="cart-progress-bar-bg">
                          <div 
                            className="cart-progress-bar-fill" 
                            style={{ width: `${Math.min(100, (getCartSubtotal() / 999) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {cartItems.length === 0 ? (
                  <div className="cart-empty-state">
                    <ShoppingBag size={52} color="#D1D5DB" style={{ margin: '0 auto 16px auto' }} />
                    <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#1F2937', marginBottom: 8 }}>Your bag is empty</h4>
                    <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: 24 }}>Explore our pure botanical skincare formulations.</p>
                    <Link to="/products" className="cart-checkout-btn" onClick={() => setIsCartOpen(false)} style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px' }}>
                      Shop Best Sellers
                    </Link>
                  </div>
                ) : (
                  <div className="cart-items-list">
                    {cartItems.map(item => (
                      <div key={item.id} className="cart-item-card">
                        <div className="cart-item-top">
                          <img 
                            src={item.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='} 
                            alt={item.name} 
                            className="cart-item-thumb" 
                          />
                          <div className="cart-item-details">
                            <div className="cart-item-title">{item.name}</div>
                            <div className="cart-item-unit-price">
                              ₹{parseFloat(item.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <button 
                            className="cart-item-remove-btn"
                            onClick={() => removeFromCart(item.id)}
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="cart-item-bottom">
                          <div className="cart-item-qty-stepper">
                            <button 
                              className="qty-btn"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >-</button>
                            <span className="qty-val">{item.quantity}</span>
                            <button 
                              className="qty-btn"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >+</button>
                          </div>
                          <div className="cart-item-line-total">
                            <span className="line-total-label">Total:</span>
                            <span className="line-total-val">₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="cart-drawer-footer">
                  <div className="cart-footer-summary-row">
                    <span className="cart-footer-subtotal-label">Subtotal</span>
                    <span className="cart-footer-subtotal-val">₹{getCartSubtotal().toFixed(2)}</span>
                  </div>
                  <Link 
                    to="/cart" 
                    className="cart-checkout-btn" 
                    onClick={() => setIsCartOpen(false)}
                  >
                    Proceed to Checkout →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </header>
    </div>
  );
}


