import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, User, LogOut, Wallet, Search, ShoppingBag, ChevronDown, Sparkles, ShieldCheck, Menu, X } from 'lucide-react';
import { checkHealth, getCategories, getProducts } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
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
                    <img src={item.image_url || '/assets/vitamin_c_serum.jpg'} alt={item.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain' }} />
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
                <img 
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`} 
                  alt={user.name} 
                  className="user-avatar-img"
                />
                <span className="user-wallet-val">₹{parseFloat(user.wallet_balance || 0).toFixed(2)}</span>
                <button 
                  onClick={handleLogout} 
                  title="Sign Out" 
                  className="btn-logout-icon"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}

            <Link 
              to="/products" 
              className="navbar-cart-btn"
            >
              <ShoppingBag size={20} />
              <span className="cart-btn-label">Cart </span>
              <span className="cart-badge-count">{cartCount || 0}</span>
            </Link>
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
      </header>
    </div>
  );
}


