import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, User, LogOut, Wallet, Search, ShoppingBag, ChevronDown, Sparkles, ShieldCheck } from 'lucide-react';
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

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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

      {/* 2. MAIN STICKY NAVBAR */}
      <header className="leafora-main-navbar">
        <div className="navbar-inner">
          
          {/* BRAND LOGO */}
          <Link to="/" className="brand-logo">
            <div className="logo-emblem">
              <Leaf size={20} fill="#FFFFFF" />
            </div>
            <div>
              <span className="brand-title">LeafOra</span>
              <span className="brand-subtitle">LIFE SCIENCES</span>
            </div>
          </Link>

          {/* MAIN NAV LINKS WITH MEGA MENU HOVER */}
          <nav className="nav-links">
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/products" className={`nav-item ${location.pathname === '/products' ? 'active' : ''}`}>
              Shop
            </Link>
            <div 
              className="nav-item" 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <span>Skincare</span> <ChevronDown size={14} />
            </div>
            <Link to="/products" className="nav-item">Best Sellers</Link>
            <a href="#about" className="nav-item">About Us</a>
            <a href="#contact" className="nav-item">Contact</a>
          </nav>

          {/* SEARCH BAR */}
          <div className="nav-search-box">
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
                    to="/products" 
                    className="search-result-item"
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F4EFEA', padding: '4px 12px 4px 6px', borderRadius: 30, border: '1px solid #E7E0D6' }}>
                <img 
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`} 
                  alt={user.name} 
                  style={{ width: 28, height: 28, borderRadius: '50%', background: '#A67C52' }} 
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#292524' }}>₹{parseFloat(user.wallet_balance || 0).toFixed(2)}</span>
                <button 
                  onClick={handleLogout} 
                  title="Sign Out" 
                  style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: '#A67C52', textDecoration: 'none' }}>
                Sign In
              </Link>
            )}

            <Link 
              to="/products" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                background: '#A67C52',
                padding: '7px 16px',
                borderRadius: 20,
                textDecoration: 'none',
                transition: 'background-color 0.2s ease'
              }}
              className="navbar-cart-btn"
            >
              <ShoppingBag size={15} />
              <span>Cart ({cartCount})</span>
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


