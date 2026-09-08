import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Star, ShoppingBag, ArrowRight, ShieldCheck, Heart, Eye, 
  Copy, Check, Clock, Award, Leaf, Zap, RefreshCw, ChevronRight, X, Gift, Users, Mail, CheckCircle2
} from 'lucide-react';
import { getProducts, adminGetHomepageBanners, adminGetHomepageSections } from '../services/api';
import './Home.css';

// Fallback initial categories with circular icons & botanical counts
const CATEGORY_ITEMS = [
  { id: 'serums', name: 'Serums & Actives', icon: '✨', count: '14 Products', bg: '#F5EBE6' },
  { id: 'creams', name: 'Face Creams', icon: '🧴', count: '18 Products', bg: '#EBF2EE' },
  { id: 'cleansers', name: 'Gentle Cleansers', icon: '🫧', count: '10 Products', bg: '#F9F1E8' },
  { id: 'toners', name: 'Hydrating Toners', icon: '💧', count: '12 Products', bg: '#EEF4F8' },
  { id: 'sunscreen', name: 'Sun Defense', icon: '☀️', count: '8 Products', bg: '#FAF3E0' },
  { id: 'oils', name: 'Face Oils', icon: '🌿', count: '9 Products', bg: '#EAEFE9' },
  { id: 'masks', name: 'Treatment Masks', icon: '🎭', count: '11 Products', bg: '#F6ECEB' },
  { id: 'bundles', name: 'Ritual Bundles', icon: '🎁', count: '6 Sets', bg: '#F7EFE8' }
];

// Fallback initial products matching reference layout
const INITIAL_PRODUCTS = [
  {
    id: 101,
    name: 'Hydrating Botanical Serum',
    category: 'Serums & Actives',
    price: 48.00,
    originalPrice: 62.00,
    rating: 4.9,
    reviews: 128,
    badge: 'BESTSELLER',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    description: 'Triple-weight hyaluronic acid enriched with wild organic white tea extract for deep 72-hour moisture saturation.'
  },
  {
    id: 102,
    name: 'Nourishing Night Cream',
    category: 'Face Creams',
    price: 54.00,
    originalPrice: 70.00,
    rating: 5.0,
    reviews: 94,
    badge: 'ORGANIC',
    image: 'https://images.unsplash.com/photo-1608248597263-0057e57b4522?auto=format&fit=crop&w=600&q=80',
    description: 'Cold-pressed rosehip seed oil and bio-identical ceramides to restore skin barrier density while you sleep.'
  },
  {
    id: 103,
    name: 'Vitamin C Glow Concentrate',
    category: 'Serums & Actives',
    price: 65.00,
    originalPrice: 85.00,
    rating: 4.8,
    reviews: 210,
    badge: 'HOT DEAL',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80',
    description: '15% L-Ascorbic Acid infused with Kakadu plum & Ferulic acid to illuminate hyperpigmentation and fight radiance loss.'
  },
  {
    id: 104,
    name: 'Calming Chamomile Cleanser',
    category: 'Gentle Cleansers',
    price: 36.00,
    originalPrice: 44.00,
    rating: 4.9,
    reviews: 86,
    badge: 'GENTLE',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    description: 'Sulfate-free pH balanced lipid gel cleanser that melts waterproof impurities without compromising skin flora.'
  },
  {
    id: 105,
    name: 'Cellular Recovery Face Oil',
    category: 'Face Oils',
    price: 72.00,
    originalPrice: 90.00,
    rating: 5.0,
    reviews: 142,
    badge: 'LUXURY',
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80',
    description: 'Pure Bakuchiol & Squalane nectar designed to stimulate collagen synthesis and smooth fine surface lines.'
  },
  {
    id: 106,
    name: 'Organic Rose Water Toner',
    category: 'Hydrating Toners',
    price: 32.00,
    originalPrice: 40.00,
    rating: 4.7,
    reviews: 79,
    badge: 'FRESH',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
    description: 'Distilled Bulgarian Damask rose petals providing instant skin hydration, pore refining, and pH balance equilibrium.'
  }
];

export default function Home() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [cartCount, setCartCount] = useState(2);

  // Flash Sale Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    // Ticking Flash Sale Timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch Dynamic Data from API
    const loadHomeData = async () => {
      try {
        const prodRes = await getProducts();
        if (prodRes?.data && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
          // Merge API products with image defaults if needed
          const merged = prodRes.data.map((p, idx) => ({
            ...p,
            rating: p.rating || (4.7 + (idx % 4) * 0.1).toFixed(1),
            reviews: p.reviews || 45 + idx * 12,
            badge: idx % 3 === 0 ? 'BESTSELLER' : idx % 2 === 0 ? 'ORGANIC' : 'HOT',
            image: p.image_url || p.images?.[0] || INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length].image
          }));
          setProducts(merged);
        }
      } catch (err) {
        console.warn('Using initial fallback products for Home CMS');
      }

      try {
        const banRes = await adminGetHomepageBanners();
        if (banRes?.data && Array.isArray(banRes.data)) {
          setBanners(banRes.data);
        }
      } catch (err) {
        console.warn('Banners loaded from standard defaults');
      }
    };

    loadHomeData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCoupon = (code = 'LEAFORA15') => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    showToast(`Coupon Code "${code}" copied to clipboard! Enjoy 15% OFF.`);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleCopyReferral = () => {
    const refCode = 'LEAFORA-REF-8942';
    navigator.clipboard.writeText(refCode);
    setCopiedReferral(true);
    showToast(`Referral Code "${refCode}" copied! Share with friends to earn $15.`);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    setCartCount(prev => prev + 1);
    showToast(`Added "${product.name}" to your botanical shopping bag!`);
  };

  // Filtered Products for Best Sellers section
  const filteredProducts = selectedCategoryFilter === 'All'
    ? products
    : products.filter(p => p.category?.toLowerCase().includes(selectedCategoryFilter.toLowerCase()));

  return (
    <div className="home-container">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-banner">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HERO SPLIT CAROUSEL & BANNER */}
      <section className="hero-split-section">
        <div className="hero-text-content">
          <div className="hero-trust-pill">
            <Leaf size={14} className="spin-leaf" /> 100% Certified Organic & Vegan Formulas
          </div>
          
          <h1 className="hero-heading">
            Glow Naturally, <br />
            <span>Live Beautifully.</span>
          </h1>

          <p className="hero-subtext">
            Experience clinical-grade botanical formulations engineered by bio-chemists. Pure plant elixirs designed to nourish, illuminate, and protect skin longevity.
          </p>

          <div className="hero-cta-group">
            <a href="#bestsellers" className="btn-leafora-primary">
              Shop Bestsellers <ArrowRight size={18} />
            </a>
            <a href="#brandstory" className="btn-leafora-secondary">
              Explore Our Science
            </a>
          </div>

          <div className="hero-badges-row">
            <div className="hero-badge-item">
              <ShieldCheck size={18} color="#A67C52" />
              <span>Dermatologist Approved</span>
            </div>
            <div className="hero-badge-item">
              <Award size={18} color="#A67C52" />
              <span>Cruelty Free Certified</span>
            </div>
            <div className="hero-badge-item">
              <Leaf size={18} color="#A67C52" />
              <span>Sustainably Sourced</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Image Column */}
        <div className="hero-visual-content">
          <div className="hero-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80" 
              alt="Leafora Botanical Skincare Radiance" 
              className="hero-main-img"
            />
            <div className="hero-floating-card">
              <div className="floating-card-rating">
                <Star size={16} fill="#A67C52" color="#A67C52" />
                <span>4.9 / 5.0 Rating</span>
              </div>
              <p>Over 14,000+ happy customers glowing naturally everyday.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CIRCULAR CATEGORY SELECTION PILLS */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Shop By Category</h2>
            <p className="section-subtitle">Curated botanical regimens tailored to your specific skin needs</p>
          </div>
          <a href="#all-products" className="view-all-link">View All Categories <ChevronRight size={16} /></a>
        </div>

        <div className="category-circle-grid">
          {CATEGORY_ITEMS.map((cat) => (
            <div key={cat.id} className="category-circle-card" onClick={() => setSelectedCategoryFilter(cat.name.split(' ')[0])}>
              <div className="category-circle-icon" style={{ backgroundColor: cat.bg }}>
                <span className="cat-emoji">{cat.icon}</span>
              </div>
              <h4 className="category-name">{cat.name}</h4>
              <span className="category-count">{cat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. BEST SELLERS GRID + TALL GOLDEN PROMO CARD (MATCHING REFERENCE IMAGE) */}
      <section className="home-section" id="bestsellers">
        <div className="section-header">
          <div>
            <h2 className="section-title">Loved By Many, Made For You</h2>
            <p className="section-subtitle">Discover our most celebrated bio-botanical remedies</p>
          </div>

          <div className="filter-pill-group">
            {['All', 'Serums', 'Creams', 'Cleansers'].map(f => (
              <button 
                key={f}
                className={`filter-pill ${selectedCategoryFilter === f ? 'active' : ''}`}
                onClick={() => setSelectedCategoryFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bestseller-layout-grid">
          {/* Product Cards Column */}
          <div className="bestseller-products-column">
            {filteredProducts.slice(0, 4).map(product => (
              <div key={product.id} className="leafora-product-card">
                <div className="card-image-box">
                  <span className="card-badge">{product.badge}</span>
                  <button 
                    className="card-quickview-btn" 
                    onClick={() => setQuickViewProduct(product)}
                    title="Quick View"
                  >
                    <Eye size={16} />
                  </button>
                  <img src={product.image} alt={product.name} className="product-thumb" />
                </div>

                <div className="card-content">
                  <div className="card-meta-row">
                    <span className="card-category">{product.category}</span>
                    <div className="card-rating">
                      <Star size={14} fill="#A67C52" color="#A67C52" />
                      <span>{product.rating} ({product.reviews})</span>
                    </div>
                  </div>

                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-desc-short">{product.description}</p>

                  <div className="card-bottom-row">
                    <div className="price-block">
                      <span className="current-price">${Number(product.price).toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="original-price">${Number(product.originalPrice).toFixed(2)}</span>
                      )}
                    </div>

                    <button 
                      className="btn-add-bag"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingBag size={16} /> Add to Bag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TALL GOLDEN PROMO CARD (Exact match to reference image side card) */}
          <div className="tall-promo-card">
            <div className="promo-card-overlay">
              <span className="promo-tag">LIMITED SPECIAL EDITION</span>
              <h3 className="promo-heading">NATURE MEETS SCIENCE FOR HEALTHY RADIANT SKIN</h3>
              <p className="promo-body">
                Formulated with concentrated alpine phyto-extracts and bio-peptides for immediate dermal rejuvenation.
              </p>
              <a href="#flash-sale" className="btn-promo-gold">
                Shop Special Collection <ArrowRight size={16} />
              </a>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80" 
              alt="Nature Meets Science Promo" 
              className="promo-bg-img"
            />
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITIONS BAR */}
      <section className="value-props-section">
        <div className="value-props-grid">
          <div className="value-prop-card">
            <div className="value-icon-box"><Leaf size={24} color="#A67C52" /></div>
            <h4>Clean Ingredients</h4>
            <p>100% free from parabens, phthalates, synthetic fragrance, or harsh chemicals.</p>
          </div>

          <div className="value-prop-card">
            <div className="value-icon-box"><Heart size={24} color="#A67C52" /></div>
            <h4>Cruelty Free & Vegan</h4>
            <p>Leaping Bunny certified. We never test on animals at any stage of development.</p>
          </div>

          <div className="value-prop-card">
            <div className="value-icon-box"><Sparkles size={24} color="#A67C52" /></div>
            <h4>Dermatologist Tested</h4>
            <p>Rigorous clinical testing ensures high potency and gentle tolerance for sensitive skin.</p>
          </div>

          <div className="value-prop-card">
            <div className="value-icon-box"><ShieldCheck size={24} color="#A67C52" /></div>
            <h4>Sustainable Packaging</h4>
            <p>Recyclable glass bottles, biodegradable soy inks, and eco-friendly FSC certified boxes.</p>
          </div>
        </div>
      </section>

      {/* 5. BRAND STORY BANNER ("Skincare That Cares") */}
      <section className="brand-story-banner" id="brandstory">
        <div className="story-image-col">
          <img 
            src="https://images.unsplash.com/photo-1608248597263-0057e57b4522?auto=format&fit=crop&w=900&q=80" 
            alt="Leafora Laboratory & Botanical Extraction" 
            className="story-img-main"
          />
          <div className="story-accent-box">
            <Award size={32} color="#A67C52" />
            <span>Winner of Green Beauty Award 2025</span>
          </div>
        </div>

        <div className="story-text-col">
          <span className="story-mini-tag">OUR BOTANICAL PHILOSOPHY</span>
          <h2 className="story-heading">Skincare That Cares For Your Skin & The Planet</h2>
          <p className="story-paragraph">
            At Leafora Life Science, we bridge the gap between ancient botanical wisdom and cutting-edge cellular biotechnology. Founded in our organic farm laboratories, every drop of our serum is cold-extracted to preserve bio-active enzymes.
          </p>
          <p className="story-paragraph">
            We believe true radiance comes from harmony. No compromises, no fillers—just pure, high-performing skincare that transforms your daily routine into a mindful ritual.
          </p>

          <div className="story-stats-row">
            <div className="story-stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Organic Ingredients</span>
            </div>
            <div className="story-stat-item">
              <span className="stat-number">100k+</span>
              <span className="stat-label">Trees Planted</span>
            </div>
            <div className="story-stat-item">
              <span className="stat-number">4.9★</span>
              <span className="stat-label">Customer Satisfaction</span>
            </div>
          </div>

          <a href="#newsletter" className="btn-leafora-primary" style={{ marginTop: 24 }}>
            Discover Our Green Pledges <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* 6. FLASH SALE COUNTDOWN SECTION */}
      <section className="flash-sale-section" id="flash-sale">
        <div className="flash-sale-container">
          <div className="flash-sale-header">
            <div>
              <div className="flash-badge"><Zap size={14} /> FLASH BOTANICAL DEAL</div>
              <h2 className="flash-title">Limited Time Botanical Harvest Sale</h2>
              <p className="flash-sub">Save up to 35% OFF on our clinical hydration collection before stock runs out.</p>
            </div>

            {/* Countdown Clock */}
            <div className="countdown-clock-box">
              <span className="clock-label">Ends In:</span>
              <div className="timer-unit">
                <span className="timer-num">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="timer-txt">HRS</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-unit">
                <span className="timer-num">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="timer-txt">MIN</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-unit">
                <span className="timer-num">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="timer-txt">SEC</span>
              </div>
            </div>
          </div>

          {/* Flash Sale Product Highlight Row */}
          <div className="flash-products-grid">
            {products.slice(0, 3).map(item => (
              <div key={`flash-${item.id}`} className="flash-product-card">
                <div className="flash-card-img-wrap">
                  <span className="flash-discount-tag">30% OFF</span>
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="flash-card-info">
                  <h4>{item.name}</h4>
                  <div className="flash-price-row">
                    <span className="flash-now">${(item.price * 0.7).toFixed(2)}</span>
                    <span className="flash-was">${Number(item.price).toFixed(2)}</span>
                  </div>

                  <div className="stock-progress-wrap">
                    <div className="stock-bar">
                      <div className="stock-fill" style={{ width: '74%' }}></div>
                    </div>
                    <span className="stock-text">Only 12 items left in stock!</span>
                  </div>

                  <button className="btn-flash-buy" onClick={(e) => handleAddToCart(item, e)}>
                    Claim Flash Discount
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. COUPON PROMO BANNER */}
      <section className="home-section">
        <div className="coupon-banner-card">
          <div className="coupon-content">
            <div className="coupon-badge"><Gift size={16} /> EXCLUSIVE WELCOME COUPON</div>
            <h3 className="coupon-headline">Get 15% Off Your First Botanical Order</h3>
            <p className="coupon-sub">Use coupon code at checkout to unlock instant discounts and free shipping.</p>
          </div>

          <div className="coupon-code-box">
            <span className="code-text">LEAFORA15</span>
            <button className="btn-copy-code" onClick={() => handleCopyCoupon('LEAFORA15')}>
              {copiedCoupon ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Code</>}
            </button>
          </div>
        </div>
      </section>

      {/* 8. REFER & EARN BANNER */}
      <section className="home-section">
        <div className="refer-banner-card">
          <div className="refer-icon-circle"><Users size={32} color="#A67C52" /></div>
          <div className="refer-text-box">
            <h3>Give $15, Get $15 Wallet Cash</h3>
            <p>Invite your friends to switch to clean organic skincare. They get $15 off, and you get $15 added directly to your Leafora Wallet balance!</p>
          </div>
          <button className="btn-refer-share" onClick={handleCopyReferral}>
            {copiedReferral ? <><Check size={16} /> Code Copied!</> : <>Share Referral Link <ArrowRight size={16} /></>}
          </button>
        </div>
      </section>

      {/* 9. TRENDING PRODUCTS & NEW ARRIVALS */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">New Botanical Arrivals</h2>
            <p className="section-subtitle">Freshly formulated serums and creams fresh from our botanical labs</p>
          </div>
          <a href="#all" className="view-all-link">Explore Collection <ChevronRight size={16} /></a>
        </div>

        <div className="bestseller-products-column" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {products.slice(2, 6).map(item => (
            <div key={`new-${item.id}`} className="leafora-product-card">
              <div className="card-image-box">
                <span className="card-badge" style={{ backgroundColor: '#2D5A27' }}>NEW FORMULA</span>
                <button className="card-quickview-btn" onClick={() => setQuickViewProduct(item)}><Eye size={16} /></button>
                <img src={item.image} alt={item.name} className="product-thumb" />
              </div>
              <div className="card-content">
                <div className="card-meta-row">
                  <span className="card-category">{item.category}</span>
                  <div className="card-rating">
                    <Star size={14} fill="#A67C52" color="#A67C52" />
                    <span>{item.rating} ({item.reviews})</span>
                  </div>
                </div>
                <h3 className="product-title">{item.name}</h3>
                <p className="product-desc-short">{item.description}</p>
                <div className="card-bottom-row">
                  <div className="price-block">
                    <span className="current-price">${Number(item.price).toFixed(2)}</span>
                  </div>
                  <button className="btn-add-bag" onClick={(e) => handleAddToCart(item, e)}>
                    <ShoppingBag size={16} /> Add to Bag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. BRAND & CERTIFICATION SLIDER */}
      <section className="certifications-section">
        <span className="cert-section-title">TRUSTED & CERTIFIED BY WORLDWIDE ORGANIC ORGANIZATIONS</span>
        <div className="cert-logos-row">
          <div className="cert-logo-item">🌿 USDA ORGANIC</div>
          <div className="cert-logo-item">🐰 LEAPING BUNNY</div>
          <div className="cert-logo-item">🧪 ECOCERT CERTIFIED</div>
          <div className="cert-logo-item">✨ GMP QUALITY VERIFIED</div>
          <div className="cert-logo-item">♻️ 100% RECYCLABLE GLASS</div>
        </div>
      </section>

      {/* 11. VERIFIED TESTIMONIALS & REVIEWS */}
      <section className="home-section">
        <div className="section-header" style={{ textAlign: 'center', display: 'block' }}>
          <h2 className="section-title">What Our Community Says</h2>
          <p className="section-subtitle">Real experiences from over 14,000+ satisfied Leafora skincare enthusiasts</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#A67C52" color="#A67C52" />)}
            </div>
            <p className="testimonial-quote">
              "The Hydrating Botanical Serum completely saved my winter skin barrier. Within 4 days, my redness completely vanished and my skin has a healthy natural dew."
            </p>
            <div className="testimonial-user">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Sophia M." />
              <div>
                <h5 className="user-name">Sophia Martinez</h5>
                <span className="user-status">Verified Buyer • New York</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#A67C52" color="#A67C52" />)}
            </div>
            <p className="testimonial-quote">
              "I have very sensitive skin prone to breakouts. The Nourishing Night Cream is super lightweight yet deeply hydrating. I love that it's 100% cruelty-free!"
            </p>
            <div className="testimonial-user">
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80" alt="Elena R." />
              <div>
                <h5 className="user-name">Elena Rostova</h5>
                <span className="user-status">Verified Buyer • London</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#A67C52" color="#A67C52" />)}
            </div>
            <p className="testimonial-quote">
              "The Vitamin C Glow Concentrate gave me noticeable radiance in two weeks! Plus, their eco-friendly packaging smells divine. Will definitely order again!"
            </p>
            <div className="testimonial-user">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Marcus T." />
              <div>
                <h5 className="user-name">Marcus Vance</h5>
                <span className="user-status">Verified Buyer • San Francisco</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. INSTAGRAM GALLERY */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">#GlowWithLeafora</h2>
            <p className="section-subtitle">Tag @leafora.official on Instagram to be featured on our global showcase</p>
          </div>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="view-all-link">Follow @leafora.official <ChevronRight size={16} /></a>
        </div>

        <div className="instagram-grid">
          {[
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1608248597263-0057e57b4522?auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
            'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=500&q=80'
          ].map((url, i) => (
            <div key={`insta-${i}`} className="insta-item">
              <img src={url} alt="Instagram Post Showcase" />
              <div className="insta-overlay">
                <Heart size={20} fill="#fff" color="#fff" />
                <span>@leafora.official</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 13. NEWSLETTER BOX */}
      <section className="newsletter-section" id="newsletter">
        <div className="newsletter-card">
          <div className="newsletter-content">
            <span className="newsletter-tag"><Mail size={14} /> JOIN THE LEAFORA CIRCLE</span>
            <h2>Receive Botanical Skincare Insights & 15% OFF</h2>
            <p>Subscribe to our weekly clean beauty journal for dermatological tips, early sale access, and eco-initiatives.</p>

            <form onSubmit={(e) => { e.preventDefault(); showToast('Thank you for joining the Leafora Circle!'); }} className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email address..." 
                required 
                className="newsletter-input"
              />
              <button type="submit" className="btn-newsletter-submit">
                Subscribe Now <ArrowRight size={16} />
              </button>
            </form>
            <span className="newsletter-privacy">We respect your privacy. Unsubscribe at any time with 1-click.</span>
          </div>
        </div>
      </section>

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
                <span className="card-category">{quickViewProduct.category}</span>
                <h2>{quickViewProduct.name}</h2>
                
                <div className="card-rating" style={{ marginBottom: 16 }}>
                  <Star size={16} fill="#A67C52" color="#A67C52" />
                  <span style={{ fontSize: '0.95rem' }}>{quickViewProduct.rating} ({quickViewProduct.reviews} customer reviews)</span>
                </div>

                <div className="price-block" style={{ marginBottom: 20 }}>
                  <span className="current-price" style={{ fontSize: '1.75rem' }}>${Number(quickViewProduct.price).toFixed(2)}</span>
                  {quickViewProduct.originalPrice && (
                    <span className="original-price" style={{ fontSize: '1.1rem' }}>${Number(quickViewProduct.originalPrice).toFixed(2)}</span>
                  )}
                </div>

                <p style={{ color: '#4A5568', lineHeight: 1.6, marginBottom: 24 }}>
                  {quickViewProduct.description}
                </p>

                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="btn-leafora-primary" onClick={(e) => { handleAddToCart(quickViewProduct, e); setQuickViewProduct(null); }}>
                    <ShoppingBag size={18} /> Add to Bag
                  </button>
                  <button className="btn-leafora-secondary" onClick={() => setQuickViewProduct(null)}>
                    Close Preview
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
