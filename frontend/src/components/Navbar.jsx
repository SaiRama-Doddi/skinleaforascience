import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Search, 
  ShoppingCart, 
  ShoppingBag, 
  Truck, 
  Leaf, 
  FlaskConical, 
  Heart, 
  Menu, 
  X, 
  Trash2, 
  Home 
} from 'lucide-react';
import { checkHealth, getProducts } from '../services/api';
import { getCart, getCartCount, getCartSubtotal, updateCartQuantity, removeFromCart, DEFAULT_PRODUCT_IMAGE } from '../services/cartService';
import leaforaLogo from '../assets/leafora-logo.png';
import './Navbar.css';

// Botanical Leaf Cluster SVG for the announcement bar corners
const BotanicalFoliage = ({ side = 'left' }) => (
  <div className={`announcement-foliage announcement-foliage-${side}`} aria-hidden="true">
    <svg viewBox="0 0 110 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`leafGrad1_${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A8756" />
          <stop offset="50%" stopColor="#2D603A" />
          <stop offset="100%" stopColor="#123B22" />
        </linearGradient>
        <linearGradient id={`leafGrad2_${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78B981" />
          <stop offset="60%" stopColor="#3E7E4C" />
          <stop offset="100%" stopColor="#18482A" />
        </linearGradient>
        <linearGradient id={`leafGrad3_${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ED397" />
          <stop offset="60%" stopColor="#488D56" />
          <stop offset="100%" stopColor="#1C4B2C" />
        </linearGradient>
      </defs>
      
      {/* Organic stems */}
      <path d="M-8 22 C 16 20, 36 24, 68 33" stroke="#163F25" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22 22 C 34 14, 48 9, 62 8" stroke="#163F25" strokeWidth="1.4" strokeLinecap="round" />
      
      {/* Lower leaf */}
      <path d="M-6 29 C 10 14, 34 16, 50 28 C 34 38, 12 40, -6 29 Z" fill={`url(#leafGrad1_${side})`} />
      <path d="M-2 27 Q 22 22, 48 28" stroke="#78B981" strokeWidth="0.8" opacity="0.65" />
      
      {/* Upper main leaf */}
      <path d="M12 20 C 24 1, 52 5, 67 17 C 51 25, 27 26, 12 20 Z" fill={`url(#leafGrad2_${side})`} />
      <path d="M14 18 Q 38 11, 65 17" stroke="#8ED397" strokeWidth="0.8" opacity="0.75" />

      {/* Top small leaf pointing inward */}
      <path d="M32 13 C 46 1, 70 3, 85 12 C 71 19, 50 19, 32 13 Z" fill={`url(#leafGrad3_${side})`} />
      <path d="M34 12 Q 56 7, 83 12" stroke="#A7E4B0" strokeWidth="0.7" opacity="0.85" />

      {/* Center forward leaf */}
      <path d="M30 24 C 48 14, 74 22, 92 32 C 74 40, 48 36, 30 24 Z" fill={`url(#leafGrad2_${side})`} />
      <path d="M32 25 Q 58 23, 89 32" stroke="#78B981" strokeWidth="0.8" opacity="0.65" />
    </svg>
  </div>
);

export default function Navbar() {
  const [apiStatus, setApiStatus] = useState('connected');
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
    if (q.trim().length >= 1) {
      try {
        const res = await getProducts();
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const filtered = res.data.filter(p => 
            p.name.toLowerCase().includes(q.toLowerCase()) || 
            (p.category && p.category.toLowerCase().includes(q.toLowerCase())) ||
            (p.description && p.description.toLowerCase().includes(q.toLowerCase()))
          );
          setSearchResults(filtered.slice(0, 6));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
      setSearchResults([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('leafora_user_token');
    localStorage.removeItem('leafora_user_profile');
    setUser(null);
    navigate('/login');
  };

  const isHomeActive = location.pathname === '/';
  const isCatalogActive = location.pathname.startsWith('/products') || location.pathname.startsWith('/shop');
  const isAboutActive = location.pathname === '/about' || location.pathname === '/about-us';
  const isContactActive = location.pathname === '/contact' || location.pathname === '/contact-us';

  return (
    <div className="leafora-nav-sticky-wrapper">
      <div className="leafora-nav-floating-container">
        
        {/* 1. TOP ANNOUNCEMENT BAR */}
        <div className="top-announcement-bar">
          {/* Botanical foliage graphics on left & right corners */}
          <BotanicalFoliage side="left" />
          <BotanicalFoliage side="right" />

          {/* Desktop Announcement View */}
          <div className="top-bar-inner desktop-only">
            <div className="announcement-left-group">
              <Truck size={17} className="announcement-truck-icon" />
              <div className="announcement-text-content">
                <span className="announcement-highlight">Free Shipping</span>
                <span className="announcement-sub">on Orders Above ₹999</span>
                <span className="announcement-sep">|</span>
                <span className="announcement-sub">Natural Skincare for a Healthier You</span>
              </div>
            </div>

            <div className="announcement-trust-group">
              <div className="trust-badge-item">
                <Leaf size={14} className="trust-icon-leaf" />
                <span>100% Natural</span>
              </div>
              <div className="trust-badge-item">
                <FlaskConical size={14} className="trust-icon-flask" />
                <span>Toxin Free</span>
              </div>
              <div className="trust-badge-item">
                <Heart size={14} className="trust-icon-heart" />
                <span>Skin Safe</span>
              </div>
            </div>
          </div>

          {/* Mobile Single-Line Scrolling Marquee */}
          <div className="mobile-announcement-ticker mobile-only">
            <div className="ticker-track">
              <div className="ticker-item">
                <Truck size={15} className="announcement-truck-icon" />
                <span className="announcement-highlight">Free Shipping</span>
                <span className="announcement-sub">on Orders Above ₹999</span>
                <span className="announcement-sep">|</span>
                <span className="announcement-sub">Natural Skincare for a Healthier You</span>
                <span className="ticker-bullet">•</span>
                <span className="trust-badge-item"><Leaf size={13} className="trust-icon-leaf" /> 100% Natural</span>
                <span className="ticker-bullet">•</span>
                <span className="trust-badge-item"><FlaskConical size={13} className="trust-icon-flask" /> Toxin Free</span>
                <span className="ticker-bullet">•</span>
                <span className="trust-badge-item"><Heart size={13} className="trust-icon-heart" /> Skin Safe</span>
              </div>
              {/* Duplicated for seamless infinite looping */}
              <div className="ticker-item" aria-hidden="true">
                <Truck size={15} className="announcement-truck-icon" />
                <span className="announcement-highlight">Free Shipping</span>
                <span className="announcement-sub">on Orders Above ₹999</span>
                <span className="announcement-sep">|</span>
                <span className="announcement-sub">Natural Skincare for a Healthier You</span>
                <span className="ticker-bullet">•</span>
                <span className="trust-badge-item"><Leaf size={13} className="trust-icon-leaf" /> 100% Natural</span>
                <span className="ticker-bullet">•</span>
                <span className="trust-badge-item"><FlaskConical size={13} className="trust-icon-flask" /> Toxin Free</span>
                <span className="ticker-bullet">•</span>
                <span className="trust-badge-item"><Heart size={13} className="trust-icon-heart" /> Skin Safe</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN STICKY NAVBAR */}
        <header className="leafora-main-navbar">
          <div className="navbar-inner">
            
            {/* Left: Brand Logo */}
            <Link to="/" className="brand-logo" aria-label="LeafOra Life Sciences">
              <img 
                src={leaforaLogo} 
                alt="LeafOra Life Sciences Logo" 
                className="brand-logo-img"
              />
            </Link>

            {/* Divider next to logo */}
            <div className="nav-vertical-divider desktop-only" />

            {/* Mobile Hamburger Button */}
            <button 
              className="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* DESKTOP NAV LINKS */}
            <nav className="nav-links desktop-only">
              {/* Nav Link: Home with distinctive golden glow underline */}
              <Link 
                to="/" 
                className={`nav-item ${isHomeActive ? 'active' : ''}`} 
              >
                Home
              </Link>

              {/* Nav Link: Shop */}
              <Link 
                to="/products" 
                className={`nav-item ${isCatalogActive ? 'active' : ''}`} 
              >
                Shop
              </Link>

              {/* Nav Link: About Us */}
              <Link 
                to="/about" 
                className={`nav-item ${isAboutActive ? 'active' : ''}`} 
              >
                About Us
              </Link>

              {/* Nav Link: Contact Us */}
              <Link 
                to="/contact" 
                className={`nav-item ${isContactActive ? 'active' : ''}`} 
              >
                Contact Us
              </Link>
            </nav>

            {/* DESKTOP SEARCH BAR PILL */}
            <form className="nav-search-pill desktop-only" onSubmit={handleSearchSubmit}>
              <Search size={18} className="search-pill-icon-left" />
              <input
                type="text"
                className="search-pill-input"
                placeholder="Search for skincare, beauty..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="search-clear-btn" 
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button type="submit" className="search-pill-submit-btn" aria-label="Submit search">
                <Search size={15} color="#FFFFFF" strokeWidth={2.4} />
              </button>

              {/* Live search results dropdown */}
              {searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map(item => (
                    <Link 
                      key={item.id} 
                      to={`/products/${item.id}`} 
                      className="search-result-item"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    >
                      <img 
                        src={item.image_url || DEFAULT_PRODUCT_IMAGE} 
                        alt={item.name} 
                        style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'contain' }} 
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#292524' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#A67C52', fontWeight: 700 }}>₹{item.price}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </form>

            {/* USER SIGN IN, DIVIDER & CART ACTION GROUP */}
            <div className="nav-actions-right">
              {/* Mobile search trigger */}
              <button 
                className="mobile-search-trigger"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Sign In button */}
              {!user ? (
                <Link to="/login" className="nav-signin-pill-btn" title="Sign In / Account">
                  <User size={19} strokeWidth={1.8} className="signin-user-icon" />
                  <span className="signin-btn-text desktop-only">Sign In</span>
                </Link>
              ) : (
                <div className="user-badge-nav">
                  <Link to="/dashboard" className="user-profile-link">
                    <img 
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'User')}`} 
                      alt={user.name} 
                      className="user-avatar-img"
                    />
                    <span className="desktop-only user-display-name">
                      {user.first_name || (user.name ? user.name.split(' ')[0] : 'Account')}
                    </span>
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    title="Sign Out" 
                    className="btn-logout-icon"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              )}

              {/* Vertical divider before cart */}
              <div className="nav-vertical-divider desktop-only" />

              {/* Cart Button with shopping cart icon and badge */}
              <button 
                type="button"
                className="navbar-cart-pill-btn"
                onClick={() => setIsCartOpen(true)}
                aria-label={`Cart with ${cartCount || 0} items`}
              >
                <ShoppingCart size={19} strokeWidth={1.8} className="cart-pill-icon" />
                <span className="cart-pill-badge">{cartCount || 0}</span>
              </button>
            </div>

          </div>


        </header>

      </div>

          {/* MINI CART SLIDE-OUT DRAWER */}
          {isCartOpen && (
            <>
              <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)} />
              <div className="cart-drawer-panel">
                <div className="cart-drawer-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShoppingCart size={22} color="#A67C52" />
                    <h3 style={{ margin: 0, fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', color: '#1F2937' }}>
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
                      <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.15rem', color: '#1F2937', marginBottom: 8 }}>Your bag is empty</h4>
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
                              src={item.image_url || DEFAULT_PRODUCT_IMAGE} 
                              alt={item.name} 
                              className="cart-item-thumb" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = DEFAULT_PRODUCT_IMAGE;
                              }}
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

      {/* MOBILE DRAWER NAVIGATION MENU */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="mobile-nav-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobile-nav-drawer">
            <div className="mobile-drawer-top">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src={leaforaLogo} 
                  alt="LeafOra Life Sciences Logo" 
                  style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
                />
              </Link>
              <button className="btn-mobile-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            {/* Mobile Dedicated Search Field */}
            <form className="mobile-drawer-search" onSubmit={handleSearchSubmit}>
              <Search size={16} className="search-icon-nav" />
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <X size={14} color="#94A3B8" style={{ cursor: 'pointer', marginLeft: 6 }} onClick={() => { setSearchQuery(''); setSearchResults([]); }} />
              )}
            </form>

            <div className="mobile-nav-links-list">
              <Link to="/" className={`mobile-nav-link ${isHomeActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/products" className={`mobile-nav-link ${isCatalogActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                Shop
              </Link>
              <Link to="/about" className={`mobile-nav-link ${isAboutActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link to="/contact" className={`mobile-nav-link ${isContactActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                Contact Us
              </Link>
            </div>

            <div className="mobile-drawer-footer">
              {!user ? (
                <Link to="/login" className="btn-mobile-login" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} />
                  <span>Sign In / Create Account</span>
                </Link>
              ) : (
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="btn-mobile-logout">
                  <LogOut size={18} />
                  <span>Sign Out ({user.first_name || (user.name ? user.name.split(' ')[0] : 'User')})</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      <div className="mobile-bottom-nav">
        <Link 
          to="/" 
          className={`mobile-bottom-tab ${isHomeActive ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Home</span>
        </Link>
        
        <Link 
          to="/products" 
          className={`mobile-bottom-tab ${isCatalogActive ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Shop</span>
        </Link>
        
        <Link 
          to={user ? "/dashboard" : "/login"} 
          className={`mobile-bottom-tab ${location.pathname === '/login' || location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Account</span>
        </Link>
        
        <button 
          className={`mobile-bottom-tab ${isCartOpen ? 'active' : ''}`} 
          onClick={() => setIsCartOpen(true)}
        >
          <div className="cart-tab-icon-wrapper">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="mobile-tab-cart-badge">{cartCount}</span>}
          </div>
          <span>Cart</span>
        </button>
      </div>
    </div>
  );
}
