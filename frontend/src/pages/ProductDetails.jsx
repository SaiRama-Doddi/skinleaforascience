import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, CheckCircle2, 
  ChevronLeft, ChevronRight, Play, Share2, Copy, Check, MapPin, 
  ChevronDown, ChevronUp, Sparkles, Leaf, Award, Eye, X
} from 'lucide-react';
import { getProductById, getProducts } from '../services/api';
import { addToCart } from '../services/cartService';
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
  const [pincode, setPincode] = useState('');
  const [deliveryResult, setDeliveryResult] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);

  // Fetch product dynamically from Database (Zero default image flash)
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImgIndex(0);
    setLoadingProduct(true);

    if (id) {
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
              id: data.id,
              name: data.name || 'Botanical Skincare Formulation',
              subtitle: data.subtitle || 'Formulated with Pure Herbal Science',
              brand: data.brand || 'Leafora Life Sciences',
              category: data.category || 'Skincare',
              price: Number(data.price) || 0,
              originalPrice: data.original_price ? Number(data.original_price) : (data.originalPrice ? Number(data.originalPrice) : null),
              discount: data.discount || null,
              rating: data.rating || 4.8,
              reviewsCount: data.reviews_count || data.reviewsCount || 18,
              badge: data.badge || (data.is_featured ? 'Best Seller' : 'Pure Botanical'),
              description: data.description || 'A mild, sulfate-free natural formulation that purifies skin while keeping it soft, hydrated and balanced.',
              size: data.size || '100 ml',
              productType: data.productType || data.category || 'Skincare',
              skinType: data.skinType || 'All Skin Types',
              targetConcerns: data.targetConcerns || 'Dirt, Oil, Dullness & Balance',
              formulation: data.formulation || 'Sulfate Free, Paraben Free, Cruelty Free',
              shelfLife: data.shelfLife || '24 Months',
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

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (pincode.length >= 5) {
      const today = new Date();
      today.setDate(today.getDate() + 3);
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      setDeliveryResult(`Est. Delivery by ${today.toLocaleDateString('en-US', options)} (Free Delivery)`);
    } else {
      setDeliveryResult('Please enter a valid 5 or 6 digit ZIP / Pincode.');
    }
  };

  const handleShareProduct = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Product link copied to your clipboard!');
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
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#1A2E22', marginBottom: '12px' }}>Product Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: '24px' }}>The product you are looking for does not exist or has been removed.</p>
        <Link to="/shop" style={{ display: 'inline-block', padding: '12px 24px', background: '#A67C52', color: '#FFF', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="details-container">

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
                  <img src={imgUrl} alt={`${product.name} Thumb ${idx + 1}`} />
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
              onClick={() => { setIsWishlisted(!isWishlisted); showToast(isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist ♥'); }}
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
          <p className="pdp-subtitle">{product.subtitle}</p>

          {/* Rating Row */}
          <div className="pdp-rating-row">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#A67C52" color="#A67C52" />
              ))}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--leafora-text-dark)' }}>{product.rating} ({product.reviewsCount} reviews)</span>
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
          </div>

          <p className="pdp-description">{product.description}</p>

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
              <span className="circle-label">Suitable for<br />All Skin Types</span>
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
            onClick={() => showToast('Proceeding to Express Direct Checkout...')}
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

      {/* FULL WIDTH TRUST & DELIVERY STRIP */}
      <div className="pdp-trust-delivery-strip">
        <div className="trust-badges-bar">
          <div className="trust-item">
            <Truck size={20} color="var(--leafora-bronze)" />
            <div>
              <div className="trust-item-title">Free Shipping</div>
              <div className="trust-item-sub">On orders above ₹999</div>
            </div>
          </div>

          <div className="trust-item">
            <RotateCcw size={20} color="var(--leafora-bronze)" />
            <div>
              <div className="trust-item-title">Easy Returns</div>
              <div className="trust-item-sub">Hassle-free returns</div>
            </div>
          </div>

          <div className="trust-item">
            <ShieldCheck size={20} color="var(--leafora-bronze)" />
            <div>
              <div className="trust-item-title">Secure Payments</div>
              <div className="trust-item-sub">100% protected</div>
            </div>
          </div>
        </div>

        <div className="delivery-checker-box">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--leafora-text-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color="var(--leafora-bronze)" /> Check Delivery & Pincode
          </span>
          <form onSubmit={handleCheckPincode} className="pincode-input-row">
            <input 
              type="text" 
              placeholder="Enter Pincode..."
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
            <button type="submit" className="btn-check-pincode">Check</button>
          </form>
          {deliveryResult && (
            <div className="delivery-result-text">
              <CheckCircle2 size={14} /> {deliveryResult}
            </div>
          )}
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
            { id: 'reviews', label: `Reviews (${product.reviewsCount})` }
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
              <h3>Product Details</h3>
              <p>
                {product.description || 'Leafora Gentle Foaming Face Wash is crafted with the goodness of nature to purify your skin without stripping its natural moisture.'}
              </p>

              <table className="specs-table">
                <tbody>
                  <tr><td>Brand</td><td>{product.brand || 'Leafora Life Sciences'}</td></tr>
                  <tr><td>Product Type</td><td>{product.productType || 'Botanical Skincare'}</td></tr>
                  <tr><td>Skin Type</td><td>{product.skinType || 'All Skin Types'}</td></tr>
                  <tr><td>Size</td><td>{product.size || '100 ml'}</td></tr>
                  <tr><td>Target Concerns</td><td>{product.targetConcerns || 'Cleanses, Hydrates & Soothes'}</td></tr>
                  <tr><td>Formulation</td><td>{product.formulation || 'Sulfate Free, Paraben Free, Cruelty Free'}</td></tr>
                  <tr><td>Shelf Life</td><td>{product.shelfLife || '24 Months'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INGREDIENTS */}
        {activeTab === 'ingredients' && (
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: 16 }}>Key Active Ingredients</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <div style={{ background: '#F8F4EE', padding: 20, borderRadius: 10 }}>
                <h4 style={{ color: 'var(--leafora-bronze)', marginBottom: 6 }}>🌱 Organic Aloe Vera</h4>
                <p style={{ fontSize: '0.88rem', color: '#475569' }}>Rich in vitamins C and E, provides instant thermal soothing and anti-inflammatory hydration.</p>
              </div>
              <div style={{ background: '#F8F4EE', padding: 20, borderRadius: 10 }}>
                <h4 style={{ color: 'var(--leafora-bronze)', marginBottom: 6 }}>🍵 Wild Green Tea Extract</h4>
                <p style={{ fontSize: '0.88rem', color: '#475569' }}>Potent EGCG polyphenols protect cellular lipid membranes against environmental pollution.</p>
              </div>
              <div style={{ background: '#F8F4EE', padding: 20, borderRadius: 10 }}>
                <h4 style={{ color: 'var(--leafora-bronze)', marginBottom: 6 }}>✨ Niacinamide (Vitamin B3)</h4>
                <p style={{ fontSize: '0.88rem', color: '#475569' }}>Refines enlarged pore architecture while regulating sebum secretion balance.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HOW TO USE */}
        {activeTab === 'how_to_use' && (
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: 16 }}>Simple 3-Step Daily Cleansing Ritual</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--leafora-bronze)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</div>
                <div><strong>Dampen Face:</strong> Splash lukewarm water gently over face and neck.</div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--leafora-bronze)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</div>
                <div><strong>Lather & Massage:</strong> Pump 1-2 dollops of cleanser onto fingertips and massage in circular upward motions for 60 seconds.</div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--leafora-bronze)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</div>
                <div><strong>Rinse & Pat Dry:</strong> Rinse thoroughly with cool water and gently pat dry with a clean cotton cloth.</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BENEFITS */}
        {activeTab === 'benefits' && (
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: 16 }}>Clinical Benefits & Results</h3>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: '#475569' }}>
              <li><strong>98%</strong> reported immediate removal of excess surface oils and makeup residue.</li>
              <li><strong>95%</strong> noticed smoother skin texture and zero post-wash tightness within 7 days.</li>
              <li>Dermatologist-tested for high tolerance on acne-prone and reactive skin.</li>
            </ul>
          </div>
        )}

        {/* TAB 5: REVIEWS & RATINGS */}
        {activeTab === 'reviews' && (
          <div>
            <div className="reviews-breakdown-box">
              <div className="overall-score-col">
                <div className="big-score">4.8</div>
                <div className="stars" style={{ margin: '8px 0' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#A67C52" color="#A67C52" />)}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Based on 124 Reviews</span>
              </div>

              <div className="rating-bars-col">
                {[
                  { star: 5, pct: 85 },
                  { star: 4, pct: 10 },
                  { star: 3, pct: 3 },
                  { star: 2, pct: 1 },
                  { star: 1, pct: 1 }
                ].map(r => (
                  <div key={r.star} className="rating-bar-row">
                    <span style={{ width: 45 }}>{r.star} Stars</span>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${r.pct}%` }}></div>
                    </div>
                    <span style={{ width: 35, textAlign: 'right' }}>{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reviews-list">
              <div className="review-card">
                <div className="review-card-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar-initials" style={{ width: 40, height: 40, borderRadius: '50%', background: '#A67C52', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.88rem' }}>
                      SK
                    </div>
                    <div>
                      <div className="reviewer-name">Samantha K.</div>
                      <div className="verified-badge"><CheckCircle2 size={12} /> Verified Buyer</div>
                    </div>
                  </div>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#A67C52" color="#A67C52" />)}
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                  "I've been using this face wash for 3 weeks now and my skin has never felt softer! It smells subtly of fresh green tea and doesn't leave my face feeling dry or stripped at all."
                </p>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* 3. FREQUENTLY ASKED QUESTIONS (FAQS) ACCORDION */}
      <section className="faqs-section">
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#1A2E22' }}>Frequently Asked Questions</h2>
        <div className="faqs-grid">
          {[
            {
              q: 'Is this cleanser suitable for sensitive skin?',
              a: 'Yes, absolutely! Gentle Foaming Face Wash is 100% sulfate-free, paraben-free, and formulated at a skin-identical pH of 5.5 to ensure maximum tolerance.'
            },
            {
              q: 'Can I use this twice daily in the morning and evening?',
              a: 'Yes, it is gentle enough to be used as your daily morning cleanser as well as your second-step evening cleanse.'
            },
            {
              q: 'Does it remove waterproof makeup?',
              a: 'It effectively removes light daily makeup and sunscreen. For heavy waterproof mascara, we recommend pairing with our Botanical Cleansing Oil first.'
            }
          ].map((faq, idx) => (
            <div key={idx} className="faq-card">
              <button 
                className="faq-question-btn"
                onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? -1 : idx)}
              >
                <span>{faq.q}</span>
                {expandedFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedFaqIndex === idx && (
                <div className="faq-answer-content">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. "YOU MAY ALSO LIKE" RELATED PRODUCTS GRID */}
      <section className="related-products-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#1A2E22', margin: 0 }}>You May Also Like</h2>
          <Link to="/shop" style={{ color: 'var(--leafora-bronze)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="related-products-grid">
          {relatedProducts.map(item => (
            <div 
              key={item.id} 
              className="shop-card"
              onClick={() => {
                navigate(`/products/${item.id}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-img-container">
                <button className="btn-wishlist-heart" onClick={(e) => { e.stopPropagation(); showToast('Saved to Wishlist ♥'); }}><Heart size={16} /></button>
                <img 
                  src={item.image_url || item.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZHg9IjEwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='} 
                  alt={item.name} 
                />
              </div>
              <div className="shop-card-info">
                <span className="shop-card-brand">{item.brand || 'Leafora'}</span>
                <h3 className="shop-card-title">{item.name}</h3>
                <div className="shop-card-rating">
                  <div className="stars-row">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#A67C52" color="#A67C52" />)}
                  </div>
                  <span>({item.reviews_count || item.reviews || 12})</span>
                </div>
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
          ))}
        </div>
      </section>

      {/* VIDEO PREVIEW MODAL */}
      {isVideoModalOpen && (
        <div className="video-modal-backdrop" onClick={() => setIsVideoModalOpen(false)}>
          <div className="video-modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }} onClick={() => setIsVideoModalOpen(false)}>
              <X size={20} />
            </button>
            <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
              <Play size={48} color="var(--leafora-bronze)" style={{ marginBottom: 16 }} />
              <h3>Leafora Gentle Foaming Face Wash Demonstration</h3>
              <p style={{ color: '#94A3B8', marginTop: 8 }}>Watch how our rich botanical foam purifies skin without stripping moisture.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
