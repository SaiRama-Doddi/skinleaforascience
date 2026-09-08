import React, { useState } from 'react';
import { 
  ArrowRight, Leaf, ShieldCheck, Heart, ShoppingBag, Star, 
  ChevronRight, Sparkles, Globe, Share2, MessageCircle, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from '../assets/hero.png';
import './Home.css';

// 8 Circular Categories data using robust local assets & high-reliability botanical icons
const CIRCULAR_CATEGORIES = [
  { id: 'cleansers', name: 'Cleansers', icon: '/assets/face_wash.jpg' },
  { id: 'moisturizers', name: 'Moisturizers', icon: '/assets/hydra_glow_moisturizer.jpg' },
  { id: 'serums', name: 'Serums', icon: '/assets/vitamin_c_serum.jpg' },
  { id: 'masks', name: 'Face Masks', icon: '/assets/night_cream.jpg' },
  { id: 'sunscreen', name: 'Sunscreens', icon: '/assets/sunscreen_spf50.jpg' },
  { id: 'eyecare', name: 'Eye Care', icon: '/assets/vitamin_c_serum.jpg' },
  { id: 'bodycare', name: 'Body Care', icon: '/assets/face_wash.jpg' },
  { id: 'oils', name: 'Face Oils', icon: '/assets/hydra_glow_moisturizer.jpg' }
];

// 4 Bestseller Products matching reference image
const BESTSELLER_PRODUCTS = [
  {
    id: 1,
    name: 'Gentle Foaming Face Wash',
    brand: 'Leafora',
    price: 18.00,
    rating: 4.9,
    reviews: 124,
    image: '/assets/face_wash.jpg'
  },
  {
    id: 2,
    name: 'Vitamin C Brightening Serum',
    brand: 'Leafora',
    price: 28.00,
    rating: 4.8,
    reviews: 98,
    image: '/assets/vitamin_c_serum.jpg'
  },
  {
    id: 3,
    name: 'Hydra Glow Moisturizer',
    brand: 'Leafora',
    price: 24.00,
    rating: 5.0,
    reviews: 156,
    image: '/assets/hydra_glow_moisturizer.jpg'
  },
  {
    id: 4,
    name: 'Daily Sunscreen SPF 50+',
    brand: 'Leafora',
    price: 22.00,
    rating: 4.9,
    reviews: 112,
    image: '/assets/sunscreen_spf50.jpg'
  }
];

export default function Home() {
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="home-page-pixel">

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="toast-banner" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. HERO SECTION WITH HERO.PNG AS BACKGROUND BANNER */}
      <div className="hero-banner-container-pixel">
        <section className="hero-section-pixel" style={{ backgroundImage: `url(${heroImg})` }}>
          <div className="hero-left-col-pixel">
            <span className="section-tag-gold-pixel">NATURAL CARE • REAL RESULTS</span>
            <h1 className="hero-heading-pixel">
              Glow Naturally <br />
              Live Beautifully
            </h1>
            <p className="hero-subtext-pixel">
              Pure ingredients. Proven science. Skincare that brings out your natural glow.
            </p>

            <Link to="/shop" className="btn-bronze-pill-pixel">
              Shop Now <ArrowRight size={16} />
            </Link>

            {/* 3 Bottom Benefit Pills Row */}
            <div className="hero-pills-row-pixel">
              <div className="pill-item-pixel">
                <div className="pill-icon-circle-pixel">🍃</div>
                <span>Natural Ingredients</span>
              </div>

              <div className="pill-item-pixel">
                <div className="pill-icon-circle-pixel">🧪</div>
                <span>Dermatologist Tested</span>
              </div>

              <div className="pill-item-pixel">
                <div className="pill-icon-circle-pixel">🤎</div>
                <span>Safe & Gentle for All Skin Types</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 2. SHOP BY CATEGORY (8 CIRCULAR PILLS) */}
      <section className="category-section-pixel">
        <div className="category-container-pixel">
          <div className="category-flex-header-pixel">
            <div>
              <span className="section-tag-gold-pixel">EXPLORE OUR RANGE</span>
              <h2 className="section-title-serif-pixel" style={{ margin: 0 }}>Shop by Category</h2>
            </div>
            <Link to="/shop" className="link-view-all-pixel">
              View All Categories <ChevronRight size={16} />
            </Link>
          </div>

          <div className="category-pills-grid-pixel">
            {CIRCULAR_CATEGORIES.map(cat => (
              <Link key={cat.id} to="/shop" className="category-pill-card-pixel">
                <div className="category-circle-box-pixel">
                  <img 
                    src={cat.icon} 
                    alt={cat.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/face_wash.jpg';
                    }}
                  />
                </div>
                <span className="category-pill-name-pixel">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BESTSELLERS GRID (4 PRODUCT CARDS + 1 TALL GOLDEN PROMO CARD) */}
      <section className="bestsellers-section-pixel">
        <div className="bestsellers-container-pixel">
          <div className="category-flex-header-pixel">
            <div>
              <span className="section-tag-gold-pixel">OUR BEST SELLERS</span>
              <h2 className="section-title-serif-pixel">Loved by Many, Made for You</h2>
              <p className="section-desc-pixel" style={{ margin: 0 }}>
                Discover our most popular skincare essentials for healthy, radiant skin.
              </p>
            </div>
            <Link to="/shop" className="link-view-all-pixel">
              View All Products <ChevronRight size={16} />
            </Link>
          </div>

          {/* Grid Layout: 4 Product Cards + 1 Tall Golden Promo Card */}
          <div className="bestseller-layout-grid-pixel">
            {BESTSELLER_PRODUCTS.map(item => (
              <div key={item.id} className="product-card-pixel">
                <div className="product-img-wrap-pixel">
                  <img src={item.image} alt={item.name} />
                </div>
                <div>
                  <span className="product-brand-pixel">{item.brand}</span>
                  <h3 className="product-title-pixel">{item.name}</h3>
                  <div className="product-stars-pixel">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#A67C52" color="#A67C52" />)}
                    <span>({item.reviews})</span>
                  </div>
                </div>

                <div className="product-bottom-row-pixel">
                  <span className="product-price-pixel">${Number(item.price).toFixed(2)}</span>
                  <button 
                    className="btn-icon-cart-pixel"
                    onClick={() => showToast(`Added "${item.name}" to your bag!`)}
                  >
                    <ShoppingBag size={15} />
                  </button>
                </div>
              </div>
            ))}

            {/* TALL GOLDEN PROMO CARD (EXACT MATCH TO REFERENCE IMAGE) */}
            <div className="tall-golden-promo-card-pixel">
              <img 
                src="/assets/leafora_golden_promo.jpg" 
                alt="Nature Meets Science Promo Background"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, zIndex: 1 }} 
              />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 className="promo-title-gold-pixel">
                  NATURE MEETS SCIENCE FOR HEALTHY RADIANT SKIN
                </h3>
              </div>

              <div style={{ position: 'relative', zIndex: 2 }}>
                <Link to="/shop" className="btn-gold-white-pixel">
                  Shop Collection <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITIONS BAR */}
      <section className="value-props-bar-pixel">
        <div className="value-props-row-pixel">
          <div className="value-prop-item-pixel">
            <div className="prop-icon-circle-pixel"><Leaf size={22} /></div>
            <div className="prop-info-pixel">
              <h4>Clean Ingredients</h4>
              <p>No harsh chemicals</p>
            </div>
          </div>

          <div className="value-prop-item-pixel">
            <div className="prop-icon-circle-pixel"><Heart size={22} /></div>
            <div className="prop-info-pixel">
              <h4>Cruelty Free</h4>
              <p>Kind to animals</p>
            </div>
          </div>

          <div className="value-prop-item-pixel">
            <div className="prop-icon-circle-pixel"><Sparkles size={22} /></div>
            <div className="prop-info-pixel">
              <h4>Sustainable</h4>
              <p>Better for tomorrow</p>
            </div>
          </div>

          <div className="value-prop-item-pixel">
            <div className="prop-icon-circle-pixel"><ShieldCheck size={22} /></div>
            <div className="prop-info-pixel">
              <h4>Trusted Quality</h4>
              <p>Dermatologist approved</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BRAND STORY BANNER ("Skincare That Cares") */}
      <section className="brand-story-section-pixel">
        <div className="brand-story-banner-pixel">
          <div className="story-left-pixel">
            <h2 className="section-title-serif-pixel">Skincare That Cares</h2>
            <p className="section-desc-pixel">
              Good for your skin. Good for the planet.
            </p>
            <Link to="/shop" className="btn-bronze-pill-pixel">
              Learn Our Story <ArrowRight size={16} />
            </Link>
          </div>

          {/* Center Product Pedestal Image */}
          <div>
            <img 
              src="/assets/leafora_golden_promo.jpg" 
              alt="Skincare That Cares Product Lineup" 
              className="story-center-img-pixel"
            />
          </div>

          {/* Right Brand Panel */}
          <div className="story-right-pixel">
            <div className="vertical-tags-pixel">
              PURE INGREDIENTS<br />
              REAL RESULTS<br />
              A BRIGHTER YOU
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#A67C52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Leaf size={16} />
              </div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1F2937' }}>
                LeafOra
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLEAN FOOTER MATCHING REFERENCE IMAGE */}
      <footer className="footer-pixel">
        <div className="footer-inner-pixel">
          <div className="footer-top-row-pixel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#A67C52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Leaf size={20} />
              </div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.45rem', fontWeight: 700, color: '#1F2937' }}>
                LeafOra <span style={{ fontSize: '0.65rem', display: 'block', textTransform: 'uppercase', letterSpacing: 1.2, color: '#A67C52' }}>LIFE SCIENCES</span>
              </span>
            </div>

            <ul className="footer-nav-list-pixel">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/shop">Skincare</Link></li>
              <li><Link to="/shop">About Us</Link></li>
              <li><Link to="/shop">Contact</Link></li>
            </ul>

            <div className="footer-social-row-pixel">
              <a href="https://instagram.com" className="social-circle-btn-pixel"><Globe size={16} /></a>
              <a href="https://facebook.com" className="social-circle-btn-pixel"><Share2 size={16} /></a>
              <a href="https://pinterest.com" className="social-circle-btn-pixel"><MessageCircle size={16} /></a>
            </div>
          </div>

          <div className="footer-bottom-copy-pixel">
            <div>
              © 2025 LeafOra Life Sciences. All rights reserved.
            </div>
            <div>
              Skincare for a Healthier You | Made with ♥ for a Better Tomorrow
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
