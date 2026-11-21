import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, Heart, ShoppingBag, ShieldCheck, CheckCircle2, 
  ChevronLeft, ChevronRight, Play, Share2, Copy, Check, 
  ChevronDown, ChevronUp, Sparkles, Leaf, Award, Eye, X
} from 'lucide-react';
import { getProductById, getProducts, userToggleWishlist, getProductReviews, getReviewEligibility, submitProductReview } from '../services/api';
import { addToCart } from '../services/cartService';
import SEO from '../components/SEO';
import botanicalProductsPhoto from '../assets/login_botanical_products.jpg';
import './ProductDetails.css';



export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Interactive UI States
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'ingredients', 'how_to_use', 'benefits', 'reviews'
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);

  // Reviews (approved only, from the database)
  const [reviewData, setReviewData] = useState({ summary: { average: 0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }, reviews: [] });
  const [reviewEligibility, setReviewEligibility] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch product dynamically from Database (Zero default image flash)
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImgIndex(0);
    setLoadingProduct(true);

    if (id) {
      try {
        const stored = localStorage.getItem('leafora_wishlist_ids');
        if (stored) {
          const ids = JSON.parse(stored);
          if (Array.isArray(ids) && (ids.includes(Number(id)) || ids.includes(id))) {
            setIsWishlisted(true);
          }
        }
      } catch (e) {}

      getProductById(id)
        .then(res => {
          if (res?.data) {
            const data = res.data;
            let gallery = [];
            if (Array.isArray(data.images) && data.images.length > 0) {
              gallery = data.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
            }
            if (gallery.length === 0 && data.image_url) {
              gallery = [data.image_url];
            }
            if (gallery.length === 0) {
              gallery = ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='];
            }

            setProduct({
              ...data,
              price: Number(data.price) || 0,
              badge: data.is_best_seller ? 'Best Seller' : (data.is_new_arrival ? 'New Arrival' : (data.is_featured ? 'Featured' : null)),
              inStock: Number(data.stock) > 0,
              gallery
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching database product details:', err);
        })
        .finally(() => {
          setLoadingProduct(false);
        });
    } else {
      setLoadingProduct(false);
    }

    // Approved reviews and (if signed in) whether this customer may review
    if (id) {
      getProductReviews(id)
        .then((res) => setReviewData({ summary: res.summary, reviews: res.reviews || [] }))
        .catch(() => setReviewData({ summary: { average: 0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }, reviews: [] }));
      setReviewEligibility(null);
      if (localStorage.getItem('leafora_user_token')) {
        getReviewEligibility(id).then(setReviewEligibility).catch(() => setReviewEligibility(null));
      }
    }

    // Fetch database products for You May Also Like section
    getProducts()
      .then(res => {
        if (res?.data && res.data.length > 0) {
          const filtered = res.data.filter(p => String(p.id) !== String(id));
          setRelatedProducts(filtered.length > 0 ? filtered.slice(0, 4) : res.data.slice(0, 4));
        }
      })
      .catch(() => {});
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrevImage = () => {
    if (!product?.gallery || product.gallery.length <= 1) return;
    setSelectedImgIndex(prev => (prev === 0 ? product.gallery.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!product?.gallery || product.gallery.length <= 1) return;
    setSelectedImgIndex(prev => (prev === product.gallery.length - 1 ? 0 : prev + 1));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { showToast('Please choose a star rating.'); return; }
    if (reviewForm.comment.trim().length < 10) { showToast('Please write at least 10 characters.'); return; }
    setSubmittingReview(true);
    try {
      const res = await submitProductReview(product.id, reviewForm);
      showToast(res.message || 'Thank you! Your review will appear after approval.');
      setReviewForm({ rating: 0, title: '', comment: '' });
      setReviewEligibility({ can_review: false, has_purchased: true, existing_review_status: 'Pending' });
    } catch (err) {
      showToast(err.message || 'Could not submit your review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (value, size = 16) =>
    [...Array(5)].map((_, i) => (
      <Star key={i} size={size} fill={i < Math.round(value) ? '#A67C52' : 'none'} color="#A67C52" />
    ));

  const handleShareProduct = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Product link copied to your clipboard!');
  };

  const handleToggleWishlist = async () => {
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    try {
      const stored = localStorage.getItem('leafora_wishlist_ids');
      let ids = stored ? JSON.parse(stored) : [];
      const prodId = Number(product.id) || product.id;
      if (nextState) {
        if (!ids.includes(prodId)) ids.push(prodId);
      } else {
        ids = ids.filter(i => i !== prodId);
      }
      localStorage.setItem('leafora_wishlist_ids', JSON.stringify(ids));

      const userProfileStr = localStorage.getItem('leafora_user_profile');
      if (userProfileStr) {
        const u = JSON.parse(userProfileStr);
        if (u?.email) {
          await userToggleWishlist({ email: u.email, product_id: product.id });
        }
      }
    } catch (e) {}

    showToast(nextState ? 'Added to Wishlist ♥' : 'Removed from Wishlist');
  };

  if (loadingProduct) {
    return (
      <div className="details-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #EFE8DE', borderTop: '4px solid #A67C52', borderRadius: '50%', animation: 'pdpSpin 1s linear infinite' }} />
        <p style={{ color: '#64748B', fontSize: '1rem', fontWeight: 500 }}>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="details-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '2rem', color: '#1A2E22', marginBottom: '12px' }}>Product Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: '24px' }}>The product you are looking for does not exist or has been removed.</p>
        <Link to="/shop" style={{ display: 'inline-block', padding: '12px 24px', background: '#A67C52', color: '#FFF', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="details-container">
      <SEO 
        title={`${product.name} — Organic Botanical ${product.category || 'Skincare'}`}
        description={`Buy ${product.name} online at LeafOra Life Sciences. ${product.description || 'Natural botanical skincare formulation crafted with organic ingredients.'} Price: ₹${product.price}`}
        keywords={`${product.name}, ${product.category}, LeafOra Life Sciences, buy ${product.name} online, organic skincare India`}
        image={product.image_url}
        canonicalUrl={`https://leaforalifescience.com/products/${product.id}`}
        schema={{
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.name,
          "image": [product.image_url],
          "description": product.description || 'Natural botanical formulation crafted with organic ingredients.',
          "sku": product.sku || `LEA-PROD-${product.id}`,
          ...(reviewData.summary.count > 0 ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": reviewData.summary.average, "reviewCount": reviewData.summary.count } } : {}),
          "brand": {
            "@type": "Brand",
            "name": "LeafOra Life Sciences"
          },
          "offers": {
            "@type": "Offer",
            "url": `https://leaforalifescience.com/products/${product.id}`,
            "priceCurrency": "INR",
            "price": product.price,
            "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "LeafOra Life Sciences"
            }
          }
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-banner" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BREADCRUMBS */}
      <div className="details-breadcrumbs">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <Link to="/shop">{product.category}</Link> / <span className="current">{product.name}</span>
      </div>

      {/* 1. TOP HERO TWO-COLUMN LAYOUT */}
      <div className="pdp-hero-grid">

        {/* LEFT GALLERY COLUMN */}
        <div className="gallery-wrapper">
          {/* Thumbnails list (Rendered only if multiple gallery images exist) */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="gallery-thumbnails-col">
              {product.gallery.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  className={`thumb-item ${selectedImgIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImgIndex(idx)}
                >
                  <img 
                    src={imgUrl} 
                    alt={`${product.name} Thumb ${idx + 1}`} 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = botanicalProductsPhoto;
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Large Main Image Display */}
          <div className="main-img-container">
            {/* Top Left Natural Seal Badge */}
            <div className="natural-seal-badge">
              NATURAL<br />INGREDIENTS
            </div>

            {/* Top Right Wishlist Heart */}
            <button 
              className={`pdp-wishlist-btn ${isWishlisted ? 'active' : ''}`}
              onClick={handleToggleWishlist}
            >
              <Heart size={18} fill={isWishlisted ? '#E53E3E' : 'none'} />
            </button>

            {/* Navigation Arrows (Rendered only if multiple images exist) */}
            {product.gallery && product.gallery.length > 1 && (
              <>
                <button className="nav-arrow-btn nav-arrow-left" onClick={handlePrevImage}>
                  <ChevronLeft size={20} />
                </button>
                <button className="nav-arrow-btn nav-arrow-right" onClick={handleNextImage}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Main Image */}
            <img 
              src={product.gallery[selectedImgIndex] || product.gallery[0]} 
              alt={product.name} 
              className="main-img-display"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = botanicalProductsPhoto;
              }}
            />

            {/* Corner Text Callout inside Image */}
            <div className="img-corner-callout">
              Pure Care Brighter You
            </div>
          </div>
        </div>

        {/* RIGHT BUY BOX & SPECS COLUMN */}
        <div className="pdp-buy-col">
          {product.badge && <span className="pdp-top-badge">{product.badge}</span>}
          
          <h1 className="pdp-title">{product.name}</h1>
          {product.subtitle && <p className="pdp-subtitle">{product.subtitle}</p>}

          {/* Rating Row */}
          <div className="pdp-rating-row">
            <div className="stars">{renderStars(reviewData.summary.average)}</div>
            <span style={{ fontWeight: 600, color: 'var(--leafora-text-dark)' }}>
              {reviewData.summary.count > 0 ? `${reviewData.summary.average} (${reviewData.summary.count} review${reviewData.summary.count === 1 ? '' : 's'})` : 'No reviews yet'}
            </span>
            <span>|</span>
            <button className="btn-write-review" onClick={() => setActiveTab('reviews')}>Write a review</button>
          </div>

          {/* Price Row */}
          <div className="pdp-price-box">
            <span className="pdp-price-current">₹{Number(product.price).toFixed(2)}</span>
            {product.originalPrice && (
              <span className="pdp-price-original">₹{Number(product.originalPrice).toFixed(2)}</span>
            )}
            {product.discount && <span className="pdp-discount-badge">{product.discount}</span>}
            {product.net_quantity && (
              <span className="product-net-qty-badge" style={{ fontSize: '0.82rem', padding: '3px 10px' }}>
                ⚖️ {product.net_quantity}
              </span>
            )}
          </div>

          {product.description && <p className="pdp-description">{product.description}</p>}
          {!product.inStock && <p style={{ color: '#DC2626', fontWeight: 600, margin: '4px 0' }}>Currently out of stock</p>}

          {/* 5 Benefit Circles Row */}
          <div className="benefit-circles-row">
            <div className="benefit-circle-item">
              <div className="circle-icon-box">🧪</div>
              <span className="circle-label">Dermatologist<br />Tested</span>
            </div>
            <div className="benefit-circle-item">
              <div className="circle-icon-box">🐰</div>
              <span className="circle-label">Cruelty<br />Free</span>
            </div>
            <div className="benefit-circle-item">
              <div className="circle-icon-box">🌿</div>
              <span className="circle-label">Paraben<br />Free</span>
            </div>
            <div className="benefit-circle-item">
              <div className="circle-icon-box">🧼</div>
              <span className="circle-label">Sulfate<br />Free</span>
            </div>
            <div className="benefit-circle-item">
              <div className="circle-icon-box">✨</div>
              <span className="circle-label">{product.skin_type ? <>For<br />{product.skin_type}</> : <>Suitable for<br />All Skin Types</>}</span>
            </div>
          </div>

          {/* Quantity & Actions Row */}
          <div className="quantity-action-row">
            <div className="quantity-stepper">
              <button className="btn-step" onClick={() => setQuantity(prev => (prev > 1 ? prev - 1 : 1))}>-</button>
              <span className="step-value">{quantity}</span>
              <button className="btn-step" onClick={() => setQuantity(prev => prev + 1)}>+</button>
            </div>

            <button 
              className="btn-pdp-add-cart"
              disabled={!product.inStock}
              style={!product.inStock ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              onClick={() => {
                addToCart(product, quantity);
                showToast(`Added ${quantity} x "${product.name}" to your shopping bag!`);
              }}
            >
              <ShoppingBag size={18} /> Add to Cart
            </button>
          </div>

          <button 
            className="btn-pdp-buy-now"
            disabled={!product.inStock}
            style={!product.inStock ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
            addToCart(product, quantity);
            navigate('/cart');
          }}
          >
            Buy Now
          </button>

          <div style={{ display: 'flex', gap: 16 }}>
            <button className="btn-write-review" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleShareProduct}>
              <Share2 size={14} /> Share Product
            </button>
          </div>

        </div>
      </div>

      {/* 2. MIDDLE TABBED INFORMATION SECTION */}
      <section className="pdp-tabs-section">
        
        {/* Tab Headers Row */}
        <div className="tab-headers-row">
          {[
            { id: 'details', label: 'Product Details' },
            { id: 'ingredients', label: 'Ingredients' },
            { id: 'how_to_use', label: 'How to Use' },
            { id: 'benefits', label: 'Benefits' },
            { id: 'reviews', label: `Reviews (${reviewData.summary.count})` }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`tab-header-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PRODUCT DETAILS & SPECS TABLE */}
        {activeTab === 'details' && (
          <div className="tab-details-grid">
            <div className="tab-left-content">
              <p style={{ margin: '0 0 14px 0', color: '#475569', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {product.description}
              </p>

              <table className="specs-table">
                <tbody>
                  {product.brand && <tr><td>Brand</td><td>{product.brand}</td></tr>}
                  {product.category && <tr><td>Category</td><td>{product.category}</td></tr>}
                  {product.net_quantity && <tr><td>Net Quantity / Volume</td><td><strong style={{ color: '#1A3E2F' }}>{product.net_quantity}</strong></td></tr>}
                  {product.skin_type && <tr><td>Skin Type</td><td>{product.skin_type}</td></tr>}
                  {product.key_ingredients && <tr><td>Key Ingredients</td><td>{product.key_ingredients}</td></tr>}
                  {product.manufacturing_date && <tr><td>Manufacturing Date</td><td>{product.manufacturing_date}</td></tr>}
                  {product.expiry_date && <tr><td>Expiry Date</td><td>{product.expiry_date}</td></tr>}
                  {product.storage && <tr><td>Storage</td><td>{product.storage}</td></tr>}
                  {product.warning && <tr><td>Warning / Caution</td><td style={{ color: '#DC2626' }}>{product.warning}</td></tr>}
                </tbody>
              </table>

              {product.storage && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#F8F4EE', borderRadius: 8, fontSize: '0.9rem' }}>
                  <strong>📦 Storage Instructions:</strong> {product.storage}
                </div>
              )}

              {product.warning && (
                <div style={{ marginTop: 10, padding: '12px 16px', background: '#FEF2F2', borderLeft: '4px solid #EF4444', borderRadius: 8, fontSize: '0.9rem', color: '#991B1B' }}>
                  <strong>⚠️ Warning & Precautions:</strong> {product.warning}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INGREDIENTS */}
        {activeTab === 'ingredients' && (
          <div>
            
            
            {product.key_ingredients && (
              <div style={{ marginBottom: 20, padding: 16, background: '#F8F4EE', borderRadius: 10, borderLeft: '4px solid var(--leafora-bronze)' }}>
                <h4 style={{ color: 'var(--leafora-bronze)', marginBottom: 6, fontSize: '1rem', fontWeight: 700 }}>✨ Key Active Ingredients</h4>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>{product.key_ingredients}</p>
              </div>
            )}

            {product.ingredients ? (
              <div style={{ background: '#FAF9F6', padding: 20, borderRadius: 10, border: '1px solid #EFE8DE' }}>
                <h4 style={{ color: '#1E293B', marginBottom: 8, fontSize: '0.95rem', fontWeight: 600 }}>Full Ingredient Composition (INCI):</h4>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
                  {product.ingredients}
                </p>
              </div>
            ) : !product.key_ingredients && (
              <p style={{ color: '#64748B', fontSize: '0.92rem', margin: 0 }}>Ingredient details for this product will be added soon.</p>
            )}
          </div>
        )}

        {/* TAB 3: HOW TO USE */}
        {activeTab === 'how_to_use' && (
          <div>
            
            {product.how_to_use ? (
              <div style={{ background: '#F8F4EE', padding: 24, borderRadius: 10, borderLeft: '4px solid var(--leafora-bronze)' }}>
                <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
                  {product.how_to_use}
                </p>
              </div>
            ) : (
              <p style={{ color: '#64748B', fontSize: '0.92rem', margin: 0 }}>Usage details for this product will be added soon.</p>
            )}
          </div>
        )}

        {/* TAB 4: BENEFITS */}
        {activeTab === 'benefits' && (
          <div>
            
            {product.benefits ? (
              <div style={{ background: '#FAF9F6', padding: 24, borderRadius: 10, border: '1px solid #EFE8DE' }}>
                <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {product.benefits}
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748B', fontSize: '0.92rem', margin: 0 }}>Benefit details for this product will be added soon.</p>
            )}
          </div>
        )}

        {/* TAB 5: REVIEWS & RATINGS (approved reviews from the database) */}
        {activeTab === 'reviews' && (
          <div>
            {reviewData.summary.count > 0 && (
              <div className="reviews-breakdown-box">
                <div className="overall-score-col">
                  <div className="big-score">{reviewData.summary.average}</div>
                  <div className="stars" style={{ margin: '8px 0' }}>{renderStars(reviewData.summary.average, 18)}</div>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Based on {reviewData.summary.count} review{reviewData.summary.count === 1 ? '' : 's'}</span>
                </div>
                <div className="rating-bars-col">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = Math.round(((reviewData.summary.breakdown[star] || 0) / reviewData.summary.count) * 100);
                    return (
                      <div key={star} className="rating-bar-row">
                        <span style={{ width: 45 }}>{star} Stars</span>
                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div>
                        <span style={{ width: 35, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write a review */}
            <div style={{ background: '#FAF9F6', border: '1px solid #EFE8DE', borderRadius: 10, padding: 18, margin: '16px 0' }}>
              {!localStorage.getItem('leafora_user_token') ? (
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569' }}>
                  <Link to={`/login?redirect=/products/${product.id}`} style={{ color: 'var(--leafora-bronze)', fontWeight: 600 }}>Sign in</Link> to review this product (available after you have purchased it).
                </p>
              ) : reviewEligibility?.existing_review_status ? (
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569' }}>
                  Thanks for your review! {reviewEligibility.existing_review_status === 'Approved' ? 'It is published below.' : 'It will appear once approved.'}
                </p>
              ) : reviewEligibility && !reviewEligibility.can_review ? (
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569' }}>Only customers who have bought this product can review it.</p>
              ) : reviewEligibility?.can_review ? (
                <form onSubmit={handleSubmitReview}>
                  <h4 style={{ margin: '0 0 10px', color: '#1E293B' }}>Write a review</h4>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }} role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
                        <Star size={24} fill={n <= reviewForm.rating ? '#A67C52' : 'none'} color="#A67C52" />
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="Title (optional)" maxLength={120} value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    style={{ width: '100%', padding: 10, border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 8, boxSizing: 'border-box' }} />
                  <textarea placeholder="What did you like or dislike? (min. 10 characters)" rows={4} maxLength={2000} value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    style={{ width: '100%', padding: 10, border: '1px solid #E2E8F0', borderRadius: 8, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  <button type="submit" className="btn-pdp-add-cart" disabled={submittingReview} style={{ marginTop: 10, maxWidth: 220 }}>
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748B' }}>Checking whether you can review this product…</p>
              )}
            </div>

            <div className="reviews-list">
              {reviewData.reviews.length === 0 ? (
                <p style={{ color: '#64748B', fontSize: '0.92rem' }}>No reviews yet.</p>
              ) : reviewData.reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <div className="review-card-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar-initials" style={{ width: 40, height: 40, borderRadius: '50%', background: '#A67C52', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.88rem' }}>
                        {String(r.customer_name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="reviewer-name">{r.customer_name}</div>
                        {Number(r.is_verified_buyer) === 1 && <div className="verified-badge"><CheckCircle2 size={12} /> Verified Buyer</div>}
                      </div>
                    </div>
                    <div className="stars">{renderStars(r.rating, 14)}</div>
                  </div>
                  {r.title && <strong style={{ display: 'block', marginBottom: 4, color: '#1E293B' }}>{r.title}</strong>}
                  <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{r.comment}</p>
                  <small style={{ color: '#94A3B8' }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                  {r.admin_reply && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#F8F4EE', borderRadius: 8, fontSize: '0.88rem', color: '#334155' }}>
                      <strong>Reply from Leafora:</strong> {r.admin_reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* 3. FREQUENTLY ASKED QUESTIONS (FAQS) ACCORDION */}
      {(product.skin_type || product.how_to_use || product.storage || product.warning || product.expiry_date) && (
      <section className="faqs-section">
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.8rem', color: '#1A2E22' }}>Frequently Asked Questions</h2>
        <div className="faqs-grid">
          {[
            product.skin_type && { q: 'Which skin type is this product for?', a: product.skin_type },
            product.how_to_use && { q: 'How should I use it?', a: product.how_to_use },
            product.storage && { q: 'How should I store it?', a: product.storage },
            product.warning && { q: 'Are there any precautions?', a: product.warning },
            product.expiry_date && { q: 'What is the expiry date?', a: product.expiry_date },
          ].filter(Boolean).map((faq, idx) => (
            <div key={idx} className="faq-card">
              <button 
                className="faq-question-btn"
                onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? -1 : idx)}
              >
                <span>{faq.q}</span>
                {expandedFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedFaqIndex === idx && (
                <div className="faq-answer-content" style={{ whiteSpace: 'pre-line' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      )}

      {/* 4. "YOU MAY ALSO LIKE" RELATED PRODUCTS GRID */}
      <section className="related-products-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.8rem', color: '#1A2E22', margin: 0 }}>You May Also Like</h2>
          <Link to="/shop" style={{ color: 'var(--leafora-bronze)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="related-products-grid">
          {relatedProducts.map(item => {
            const relPrimary = item.image_url || item.image || (Array.isArray(item.images) && item.images[0]) || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg==';
            const relSecondary = Array.isArray(item.images) && item.images.length > 1 ? item.images[1] : null;

            return (
              <div 
                key={item.id} 
                className="shop-card"
                onClick={() => {
                  navigate(`/products/${item.id}`);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-img-container">
                  <img 
                    src={relPrimary} 
                    alt={item.name} 
                    className="card-img-primary"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = botanicalProductsPhoto;
                    }}
                  />
                  {relSecondary && (
                    <img 
                      src={relSecondary} 
                      alt={`${item.name} alternate view`} 
                      className="card-img-secondary"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              <div className="shop-card-info">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                  <span className="shop-card-brand">{item.brand || 'Leafora Life Sciences'}</span>
                  {item.net_quantity && <span className="product-net-qty-badge">{item.net_quantity}</span>}
                </div>
                <h3 className="shop-card-title">{item.name}</h3>
                <div className="shop-card-price-row">
                  <span className="price-main">₹{parseFloat(item.price || 0).toFixed(2)}</span>
                </div>
              </div>
              <button 
                className="btn-card-add-cart"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(item, 1);
                  showToast(`Added "${item.name}" to your bag!`);
                }}
              >
                <ShoppingBag size={14} /> Add to Cart
              </button>
            </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
