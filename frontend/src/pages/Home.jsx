import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, Leaf, ShieldCheck, FlaskConical, Heart, ShoppingBag, Star, 
  ChevronRight, Sparkles, CheckCircle2, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, getBanners } from '../services/api';
import { addToCart } from '../services/cartService';
import SEO from '../components/SEO';
import skincareStoryImg from '../assets/skincare_story_showcase.jpg';
import homepageDesktop from '../assets/hero_section/homepage.jpg';
import homepageMobile from '../assets/hero_section/homepage-mobile.jpg';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(null);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fallbackHomeProducts = [
    {
      id: 1,
      name: 'LEAFORA Salicylic Acid Face Wash',
      brand: 'Leafora Life Sciences',
      net_quantity: '100ml',
      price: 499,
      reviews: 0,
      image_url: '/assets/login_botanical_products.jpg'
    },
    {
      id: 2,
      name: 'LeafExtract Pharma Grades',
      brand: 'Leafora Life Sciences',
      net_quantity: '100g',
      price: 49.99,
      reviews: 12,
      image_url: '/assets/skincare_story_showcase.jpg'
    },
    {
      id: 3,
      name: 'BioVital Nutraceutical Solution',
      brand: 'Leafora Life Sciences',
      net_quantity: '100ml',
      price: 29.50,
      reviews: 8,
      image_url: '/assets/login_botanical_products.jpg'
    }
  ];

  useEffect(() => {
    // Fetch products dynamically from backend API / database
    getProducts()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        } else {
          setProducts(fallbackHomeProducts);
        }
      })
      .catch(() => {
        setProducts(fallbackHomeProducts);
      })
      .finally(() => setLoadingProds(false));

    // Fetch active banners dynamically from database table homepage_banners
    getBanners({ active_only: 'true' })
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setBanners(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };



  return (
    <div className="home-page-pixel">
      <SEO 
        title="LeafOra Life Sciences | Pure Organic Botanical Skincare & Formulations"
        description="Discover LeafOra Life Sciences - Premium organic botanical skincare, herbal extracts, natural face serums, moisturizers & creams crafted in Nikol, Ahmedabad, Gujarat."
        keywords="LeafOra Life Sciences, LeafOra skincare, organic skincare India, natural botanical formulations, herbal extracts, face wash Ahmedabad, moisturizer Gujarat, natural serum, SPF 50 sunscreen"
        canonicalUrl="https://leaforalifescience.com/"
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="toast-banner" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section 
        className="hero-leafora-section"
        aria-label="LeafOra Featured Skincare Collection"
      >
        <div className="hero-leafora-bg-layer">
          <picture className="hero-leafora-picture">
            <source media="(max-width: 768px)" srcSet={homepageMobile} />
            <img
              src={homepageDesktop}
              alt="LeafOra Life Sciences - A Healthier, Brighter You Naturally"
              className="hero-leafora-bg-img"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
        </div>

        <div className="hero-leafora-content-wrap">
          <div className="hero-leafora-card">
            <span className="hero-leafora-eyebrow">
              NATURAL SCIENCE FOR RADIANT SKIN
            </span>
            
            <h1 className="hero-leafora-title">
              <span className="hero-leafora-title-green">A Healthier,</span>
              <span className="hero-leafora-title-green">Brighter You</span>
              <span className="hero-leafora-title-gold">Naturally</span>
            </h1>

            <p className="hero-leafora-desc">
              Clean skincare essentials with powerful natural ingredients for clear, glowing and healthy skin.
            </p>

            <div className="hero-leafora-btn-wrap">
              <Link to="/products" className="hero-leafora-shop-btn">
                <span>Shop Our Essentials</span>
                <ArrowRight size={18} strokeWidth={2.2} />
              </Link>
            </div>

            <div className="hero-leafora-badges-row">
              <div className="hero-leafora-badge-item">
                <div className="hero-leafora-icon-circle">
                  <Leaf size={22} strokeWidth={1.8} />
                </div>
                <div className="hero-leafora-badge-heading">100%</div>
                <div className="hero-leafora-badge-sub">Natural Ingredients</div>
              </div>

              <div className="hero-leafora-badge-item">
                <div className="hero-leafora-icon-circle">
                  <FlaskConical size={22} strokeWidth={1.8} />
                </div>
                <div className="hero-leafora-badge-heading">No Harmful</div>
                <div className="hero-leafora-badge-sub">Chemicals</div>
              </div>

              <div className="hero-leafora-badge-item">
                <div className="hero-leafora-icon-circle">
                  <ShieldCheck size={22} strokeWidth={1.8} />
                </div>
                <div className="hero-leafora-badge-heading">Dermatologically</div>
                <div className="hero-leafora-badge-sub">Tested</div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Dynamic Offer / Flash Sale Banner if configured in Admin */}
      {(() => {
        const promoBanners = banners.filter(b => b.banner_type === 'offer' || b.banner_type === 'flash_sale');
        if (promoBanners.length === 0) return null;
        const promo = promoBanners[0];
        return (
          <section style={{ maxWidth: 1280, margin: '0 auto 36px auto', padding: '0 20px' }}>
            <Link
              to={promo.link_url || '/products'}
              style={{
                textDecoration: 'none',
                display: 'block',
                borderRadius: 16,
                overflow: 'hidden',
                position: 'relative',
                minHeight: 180,
                boxShadow: '0 8px 24px rgba(166,124,82,0.15)',
                border: '1px solid #E5D5C0'
              }}
            >
              <img
                src={isMobile && promo.mobile_image_url ? promo.mobile_image_url : promo.desktop_image_url}
                alt={promo.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,20,20,0.85) 0%, rgba(20,20,20,0.5) 60%, rgba(20,20,20,0.1) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '24px 20px' : '36px 40px', maxWidth: isMobile ? '100%' : '65%', color: '#FFF' }}>
                {promo.subtitle && (
                  <span style={{ fontSize: '0.8rem', letterSpacing: 1.5, color: '#C5A059', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    {promo.subtitle}
                  </span>
                )}
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: isMobile ? '1.3rem' : '1.9rem', fontWeight: 700, margin: '0 0 12px 0', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                  {promo.title}
                </h3>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#9E7B3B', color: '#FFF', padding: '8px 20px', borderRadius: 24, fontSize: '0.85rem', fontWeight: 600 }}>
                  {promo.button_text || 'Claim Offer'} <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </section>
        );
      })()}

      {/* 3. BESTSELLERS GRID (DYNAMICALLY LOADED FROM DATABASE) */}
      <section className="bestsellers-section-pixel">
        <div className="bestsellers-container-pixel">
          <div className="category-flex-header-pixel">
            <div>
              <span className="section-tag-gold-pixel single-line-title" style={{ whiteSpace: 'nowrap', display: 'block' }}>
                OUR BEST SELLERS
              </span>
              <h2 className="section-title-serif-pixel single-line-title" style={{ margin: 0 }}>
                Loved by Many, Made for You
              </h2>
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
            /* Grid Layout: 3 Bestseller Database Products */
            <div className="bestseller-layout-grid-pixel">
              {products.slice(0, 3).map(item => (
                <div 
                  key={item.id} 
                  className="product-card-pixel"
                  onClick={() => navigate(`/products/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-img-wrap-pixel">
                    <img 
                      src={item.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNNTAgMjAgQzMwIDIwIDIwIDQwIDIwIDYwIEMyMCA4MCAzMCA5MCA1MCA5MCBDNzAgOTAgODAgODAgODAgNjAgQzgwIDQwIDcwIDIwIDUwIDIwIFoiIGZpbGw9IiNBNjdDNTIiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg=='} 
                      alt={item.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNNTAgMjAgQzMwIDIwIDIwIDQwIDIwIDYwIEMyMCA4MCAzMCA5MCA1MCA5MCBDNzAgOTAgODAgODAgODAgNjAgQzgwIDQwIDcwIDIwIDUwIDIwIFoiIGZpbGw9IiNBNjdDNTIiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==';
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                      <span className="product-brand-pixel">{item.brand || 'Leafora Life Sciences'}</span>
                      <span className="product-net-qty-badge">{item.net_quantity || '100g'}</span>
                    </div>
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
                        addToCart(item, 1);
                        showToast(`Added "${item.name}" to your bag!`);
                      }}
                    >
                      <ShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              ))}
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
            <Link to="/products" className="btn-bronze-pill-pixel">
              Learn Our Story <ArrowRight size={16} />
            </Link>
          </div>

          {/* Center Product Pedestal Image */}
          <div className="story-center-box">
            <img 
              src={skincareStoryImg} 
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
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#1F2937' }}>
                LeafOra
              </span>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
