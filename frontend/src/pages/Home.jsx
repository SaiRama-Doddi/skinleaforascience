import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowRight, Leaf, ShieldCheck, Heart, ShoppingBag, Star, 
  ChevronRight, ChevronLeft, Sparkles, Globe, Share2, MessageCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getProducts } from '../services/api';
import heroImage from '../assets/heroimage.jpeg';
import './Home.css';

// Reference categories fallback if database has fewer items
const REFERENCE_CATEGORIES = [
  { id: 'c1', name: 'Cleansers', slug: 'cleansers', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80' },
  { id: 'c2', name: 'Moisturizers', slug: 'moisturizers', image_url: 'https://images.unsplash.com/photo-1608248597263-0057e57b4522?auto=format&fit=crop&w=300&q=80' },
  { id: 'c3', name: 'Serums', slug: 'serums', image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80' },
  { id: 'c4', name: 'Face Masks', slug: 'face-masks', image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=300&q=80' },
  { id: 'c5', name: 'Sunscreens', slug: 'sunscreens', image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80' },
  { id: 'c6', name: 'Eye Care', slug: 'eye-care', image_url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=300&q=80' },
  { id: 'c7', name: 'Body Care', slug: 'body-care', image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=300&q=80' },
  { id: 'c8', name: 'Face Oils', slug: 'face-oils', image_url: 'https://images.unsplash.com/photo-1608248597263-0057e57b4522?auto=format&fit=crop&w=300&q=80' }
];

export default function Home() {
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);

  // Category horizontal scroll ref for arrow navigation
  const categoryScrollRef = useRef(null);

  const scrollCategoryLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollCategoryRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Fetch categories dynamically from backend API / database
    getCategories()
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setCategories(res.data);
        } else {
          setCategories(REFERENCE_CATEGORIES);
        }
      })
      .catch(() => setCategories(REFERENCE_CATEGORIES))
      .finally(() => setLoadingCats(false));

    // Fetch products dynamically from backend API / database
    getProducts()
      .then((res) => {
        if (res && res.data) {
          setProducts(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProds(false));
  }, []);

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

      {/* 1. HERO BANNER SECTION (FEATURING HEROIMAGE.JPEG) */}
      <div className="hero-banner-container-pixel">
        <Link to="/products" className="hero-banner-link-pixel" aria-label="Shop LeafOra Skincare Range">
          <div className="hero-banner-image-box">
            <img 
              src={heroImage} 
              alt="LeafOra Life Sciences - Glow Naturally Live Beautifully" 
              className="hero-banner-img" 
            />
          </div>
        </Link>
      </div>

      {/* 2. SHOP BY CATEGORY (HORIZONTALLY SCROLLABLE WITH RIGHT-SIDE ARROWS) */}
      <section className="category-section-pixel">
        <div className="category-container-pixel">
          <div className="category-flex-header-pixel">
            <div>
              <span className="section-tag-gold-pixel">EXPLORE OUR RANGE</span>
              <h2 className="section-title-serif-pixel single-line-title" style={{ margin: 0 }}>
                Shop by Category
              </h2>
            </div>

            <Link to="/products" className="link-view-all-pixel">
              View All Categories <ChevronRight size={16} />
            </Link>
          </div>

          {loadingCats ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10, color: '#A67C52' }}>
              <Loader2 className="animate-spin" size={24} />
              <span>Loading categories from database...</span>
            </div>
          ) : (
            <div className="category-scroll-wrapper" ref={categoryScrollRef}>
              {(categories.length > 0 ? categories : REFERENCE_CATEGORIES).map(cat => (
                <Link key={cat.id} to={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`} className="category-pill-card-pixel">
                  <div className="category-circle-box-pixel">
                    <img 
                      src={cat.image_url || cat.icon_url || '/assets/face_wash.jpg'} 
                      alt={cat.name} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/face_wash.jpg';
                      }}
                    />
                  </div>
                  <span className="category-pill-name-pixel">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. BESTSELLERS GRID (DYNAMICALLY LOADED FROM DATABASE) */}
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
            <Link to="/products" className="link-view-all-pixel">
              View All Products <ChevronRight size={16} />
            </Link>
          </div>

          {loadingProds ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10, color: '#A67C52' }}>
              <Loader2 className="animate-spin" size={24} />
              <span>Loading products from database...</span>
            </div>
          ) : products.length > 0 ? (
            /* Grid Layout: Database Products + 1 Tall Golden Promo Card */
            <div className="bestseller-layout-grid-pixel">
              {products.slice(0, 4).map(item => (
                <div 
                  key={item.id} 
                  className="product-card-pixel"
                  onClick={() => navigate(`/products/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-img-wrap-pixel">
                    <img src={item.image_url || '/assets/face_wash.jpg'} alt={item.name} />
                  </div>
                  <div>
                    <span className="product-brand-pixel">{item.brand || 'Leafora'}</span>
                    <h3 className="product-title-pixel">{item.name}</h3>
                    <div className="product-stars-pixel">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#A67C52" color="#A67C52" />)}
                      <span>({item.reviews || 0})</span>
                    </div>
                  </div>

                  <div className="product-bottom-row-pixel">
                    <span className="product-price-pixel">₹{Number(item.price).toFixed(2)}</span>
                    <button 
                      className="btn-icon-cart-pixel"
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast(`Added "${item.name}" to your bag!`);
                      }}
                    >
                      <ShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {/* TALL GOLDEN PROMO CARD */}
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
                  <Link to="/products" className="btn-gold-white-pixel">
                    Shop Collection <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#78716C', fontSize: '0.95rem' }}>
              No products currently available in database.
            </div>
          )}
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
