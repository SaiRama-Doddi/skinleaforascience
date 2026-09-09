import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Grid, List, Filter, Heart, ShoppingBag, Star, 
  ChevronRight, X, RotateCcw, CheckCircle2, ShieldCheck, Leaf, Award, Eye
} from 'lucide-react';
import { getProducts, getCategories } from '../services/api';
import { addToCart } from '../services/cartService';
import './Shop.css';

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Filter States matching reference image
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [priceMax, setPriceMax] = useState(100);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState([]);
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  
  // Sort and Search
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive UI States
  const [wishlist, setWishlist] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [dbCategories, setDbCategories] = useState([]);

  // Load API products & categories from Database
  useEffect(() => {
    setLoadingProducts(true);
    getProducts()
      .then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiMerged = res.data.map((p, i) => ({
            id: p.id,
            name: p.name,
            brand: p.brand || 'Leafora',
            category: p.category || 'Skincare',
            price: Number(p.price) || 0,
            rating: (4.7 + (i % 4) * 0.1).toFixed(1),
            reviews: 40 + i * 14,
            badge: i % 4 === 0 ? 'Best Seller' : i % 3 === 0 ? 'New' : null,
            badgeType: i % 4 === 0 ? 'bestseller' : i % 3 === 0 ? 'new' : null,
            skinType: ['Normal', 'Dry'],
            concerns: ['Hydration'],
            inStock: true,
            image: p.image_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23F7F4EE"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23A67C52" font-family="sans-serif" font-size="16">No Image Available</text></svg>',
            description: p.description || 'Natural botanical formulation crafted with organic ingredients.'
          }));
          setProducts(apiMerged);
        } else {
          setProducts([]);
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));

    getCategories()
      .then(res => {
        if (res?.data && Array.isArray(res.data)) {
          setDbCategories(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const categoryOptions = useMemo(() => {
    const list = [{ name: 'All Products', count: products.length }];
    if (dbCategories.length > 0) {
      dbCategories.forEach(cat => {
        const count = products.filter(p => 
          p.category?.toLowerCase() === cat.name?.toLowerCase() ||
          p.category_id === cat.id
        ).length;
        list.push({ name: cat.name, count, id: cat.id });
      });
    } else {
      const catMap = {};
      products.forEach(p => {
        if (p.category) {
          catMap[p.category] = (catMap[p.category] || 0) + 1;
        }
      });
      Object.keys(catMap).forEach(catName => {
        list.push({ name: catName, count: catMap[catName] });
      });
    }
    return list;
  }, [dbCategories, products]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleWishlist = (id, e) => {
    if (e) e.stopPropagation();
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    showToast(wishlist.includes(id) ? 'Removed item from your Wishlist' : 'Saved item to your Wishlist ♥');
  };

  const handleSkinTypeToggle = (type) => {
    setSelectedSkinTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleConcernToggle = (concern) => {
    setSelectedConcerns(prev => 
      prev.includes(concern) ? prev.filter(c => c !== concern) : [...prev, concern]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategory('All Products');
    setPriceMax(100);
    setSelectedSkinTypes([]);
    setSelectedConcerns([]);
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('featured');
    showToast('All filters have been reset');
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'All Products' && !p.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }
      // Price filter
      if (p.price > priceMax) return false;
      // In stock filter
      if (inStockOnly && !p.inStock) return false;
      // Skin Type filter
      if (selectedSkinTypes.length > 0) {
        const hasSkinType = selectedSkinTypes.some(st => p.skinType?.includes(st));
        if (!hasSkinType) return false;
      }
      // Concern filter
      if (selectedConcerns.length > 0) {
        const hasConcern = selectedConcerns.some(c => p.concerns?.includes(c));
        if (!hasConcern) return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesDesc) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'popularity') return b.reviews - a.reviews;
      return 0; // Featured
    });
  }, [products, selectedCategory, priceMax, selectedSkinTypes, selectedConcerns, inStockOnly, searchQuery, sortBy]);

  // Paginated Slice
  const paginatedProducts = filteredProducts.slice(0, currentPage * itemsPerPage);

  return (
    <div className="shop-container">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-banner" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}



      {/* 2. SHOP MAIN LAYOUT GRID (SIDEBAR + PRODUCTS AREA) */}
      <div className="shop-main-layout">

        {/* SIDEBAR FILTER PANEL */}
        <aside className="shop-sidebar">
          
          {/* Category Filter */}
          <div>
            <h3 className="filter-group-title">Categories</h3>
            <ul className="category-filter-list">
              {categoryOptions.map(cat => (
                <li 
                  key={cat.name} 
                  className={`category-item ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span>{cat.name}</span>
                  <span className="cat-count">({cat.count}) <ChevronRight size={14} className="cat-arrow" /></span>
                </li>
              ))}
            </ul>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--leafora-border)', margin: '4px 0' }} />

          <h3 className="filter-group-title" style={{ marginBottom: 12 }}>Filter By</h3>

          {/* Price Range Slider */}
          <div className="price-slider-box">
            <div className="price-range-inputs">
              <span>Price Range</span>
              <span>₹0 — ₹{priceMax}</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={priceMax} 
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Skin Type Filter */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--leafora-text-dark)', marginBottom: 10 }}>Skin Type</h4>
            <div className="checkbox-filter-list">
              {[
                { name: 'Normal', count: 28 },
                { name: 'Dry', count: 24 },
                { name: 'Oily', count: 20 },
                { name: 'Combination', count: 22 },
                { name: 'Sensitive', count: 18 }
              ].map(st => (
                <label key={st.name} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={selectedSkinTypes.includes(st.name)}
                    onChange={() => handleSkinTypeToggle(st.name)}
                  />
                  <span className="checkbox-label-text">{st.name}</span>
                  <span className="item-count">({st.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Concerns Filter */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--leafora-text-dark)', marginBottom: 10 }}>Concerns</h4>
            <div className="checkbox-filter-list">
              {[
                { name: 'Acne', count: 12 },
                { name: 'Anti-Aging', count: 16 },
                { name: 'Brightening', count: 14 },
                { name: 'Hydration', count: 20 },
                { name: 'Dark Spots', count: 10 }
              ].map(c => (
                <label key={c.name} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={selectedConcerns.includes(c.name)}
                    onChange={() => handleConcernToggle(c.name)}
                  />
                  <span className="checkbox-label-text">{c.name}</span>
                  <span className="item-count">({c.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--leafora-text-dark)', marginBottom: 10 }}>Availability</h4>
            <label className="checkbox-item">
              <input 
                type="checkbox" 
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span className="checkbox-label-text">In Stock</span>
              <span className="item-count">(32)</span>
            </label>
          </div>

          {/* Clear Filters Button */}
          <button className="btn-clear-filters" onClick={handleClearFilters}>
            <RotateCcw size={14} /> Clear Filters
          </button>
        </aside>

        {/* PRODUCTS CONTENT AREA */}
        <main className="shop-content-area">

          {/* TOOLBAR ROW */}
          <div className="shop-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn-mobile-filter-trigger" onClick={() => setIsMobileFilterOpen(true)}>
                <Filter size={16} /> Filters
              </button>
              <span className="results-count">{filteredProducts.length} Products</span>
            </div>

            <div className="toolbar-controls">
              {/* In-category Search */}
              <div className="in-category-search">
                <Search size={14} color="#94A3B8" />
                <input 
                  type="text" 
                  placeholder="Search in collection..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <X size={14} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
                )}
              </div>

              {/* Sort selector */}
              <div className="sort-dropdown-box">
                <span>Sort by:</span>
                <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popularity">Most Popular</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* Grid / List View Mode Toggle */}
              <div className="view-mode-toggle">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid size={16} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* PRODUCTS DISPLAY GRID / LIST */}
          {paginatedProducts.length > 0 ? (
            <div className={viewMode === 'grid' ? 'shop-products-grid' : 'shop-products-list'}>
              {paginatedProducts.map(product => (
                <div 
                  key={product.id} 
                  className={viewMode === 'grid' ? 'shop-card' : 'shop-list-card'}
                  onClick={() => navigate(`/products/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  
                  {/* Image Container */}
                  <div className="card-img-container">
                    {product.badge && (
                      <span className={`shop-card-badge badge-${product.badgeType || 'bestseller'}`}>
                        {product.badge}
                      </span>
                    )}

                    <button 
                      className={`btn-wishlist-heart ${wishlist.includes(product.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id, e); }}
                      title="Add to Wishlist"
                    >
                      <Heart size={16} fill={wishlist.includes(product.id) ? '#E53E3E' : 'none'} />
                    </button>

                    <img src={product.image} alt={product.name} />
                  </div>

                  {/* Card Info */}
                  <div className="shop-card-info">
                    <span className="shop-card-brand">{product.brand}</span>
                    <h3 className="shop-card-title">{product.name}</h3>

                    <div className="shop-card-rating">
                      <div className="stars-row">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={13} fill="#A67C52" color="#A67C52" />
                        ))}
                      </div>
                      <span>({product.reviews})</span>
                    </div>

                    <div className="shop-card-price-row">
                      <span className="price-main">₹{Number(product.price).toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="price-original">₹{Number(product.originalPrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Action */}
                  <div className={viewMode === 'list' ? 'list-card-actions' : ''} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-card-add-cart"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, 1); showToast(`Added "${product.name}" to your botanical shopping bag!`); }}
                    >
                      <ShoppingBag size={15} /> Add to Cart
                    </button>
                    {viewMode === 'list' && (
                      <button 
                        className="btn-clear-filters"
                        onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}
                      >
                        <Eye size={14} /> Quick View
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', padding: 48, borderRadius: 12, textAlign: 'center', border: '1px solid var(--leafora-border)' }}>
              <Leaf size={32} color="var(--leafora-bronze)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--leafora-text-dark)', marginBottom: 8 }}>
                No products match your selected filters
              </h3>
              <p style={{ color: 'var(--leafora-text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                Try loosening your price range or clearing active skin type filters.
              </p>
              <button className="btn-card-add-cart" style={{ width: 'auto', margin: '0 auto' }} onClick={handleClearFilters}>
                Reset All Filters
              </button>
            </div>
          )}

          {/* PAGINATION BAR */}
          {filteredProducts.length > itemsPerPage && (
            <div className="shop-pagination-bar">
              <span style={{ fontSize: '0.88rem', color: 'var(--leafora-text-muted)' }}>
                Showing 1–{Math.min(paginatedProducts.length, filteredProducts.length)} of {filteredProducts.length} Products
              </span>

              {paginatedProducts.length < filteredProducts.length ? (
                <button 
                  className="btn-load-more" 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Load More Products <ChevronRight size={16} />
                </button>
              ) : (
                <div className="pagination-pages">
                  <button className="page-num-btn active">1</button>
                  <button className="page-num-btn">2</button>
                  <button className="page-num-btn">3</button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* MOBILE OFF-CANVAS SLIDE-OVER FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="mobile-filter-overlay" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="mobile-filter-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h3>Filter Products</h3>
              <button className="btn-drawer-close" onClick={() => setIsMobileFilterOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: 10 }}>Categories</h4>
                <ul className="category-filter-list">
                  {categoryOptions.map(c => (
                    <li 
                      key={c.name} 
                      className={`category-item ${selectedCategory === c.name ? 'active' : ''}`}
                      onClick={() => { setSelectedCategory(c.name); setIsMobileFilterOpen(false); }}
                    >
                      <span>{c.name}</span>
                      <span className="cat-count">({c.count})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, marginBottom: 10 }}>Price Limit: ₹{priceMax}</h4>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="5"
                  value={priceMax} 
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="range-slider"
                />
              </div>

              <button className="btn-card-add-cart" onClick={() => setIsMobileFilterOpen(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="modal-backdrop" onClick={() => setQuickViewProduct(null)}>
          <div className="quickview-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setQuickViewProduct(null)}><X size={20} /></button>

            <div className="quickview-grid">
              <div className="quickview-img-box">
                <img src={quickViewProduct.image} alt={quickViewProduct.name} />
              </div>

              <div className="quickview-info">
                <span className="shop-card-brand">{quickViewProduct.brand} • {quickViewProduct.category}</span>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', marginTop: 4, marginBottom: 8 }}>{quickViewProduct.name}</h2>
                
                <div className="shop-card-rating" style={{ marginBottom: 16 }}>
                  <div className="stars-row">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#A67C52" color="#A67C52" />)}
                  </div>
                  <span>({quickViewProduct.reviews} verified reviews)</span>
                </div>

                <div className="price-main" style={{ fontSize: '1.6rem', color: 'var(--leafora-text-dark)', marginBottom: 16 }}>
                  ₹{Number(quickViewProduct.price).toFixed(2)}
                </div>

                <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
                  {quickViewProduct.description}
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn-card-add-cart" onClick={() => { addToCart(quickViewProduct, 1); showToast(`Added "${quickViewProduct.name}" to your bag!`); setQuickViewProduct(null); }}>
                    <ShoppingBag size={16} /> Add to Cart
                  </button>
                  <button 
                    className="btn-clear-filters" 
                    onClick={() => {
                      const pid = quickViewProduct.id;
                      setQuickViewProduct(null);
                      navigate(`/products/${pid}`);
                    }}
                  >
                    View Details
                  </button>
                  <button className="btn-clear-filters" onClick={() => setQuickViewProduct(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
