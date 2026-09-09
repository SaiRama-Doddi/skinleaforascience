import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowRight, Leaf, ShieldCheck, Heart, ShoppingBag, Star, 
  ChevronRight, ChevronLeft, Sparkles, Globe, Share2, MessageCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getProducts } from '../services/api';
import { addToCart } from '../services/cartService';
import heroImage from '../assets/heroimage.jpeg';
import skincareStoryImg from '../assets/skincare_story_showcase.jpg';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Category horizontal scroll ref for arrow navigation
  const categoryScrollRef = useRef(null);

  const scrollCategoryLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollCategoryRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Fetch categories dynamically from backend API / database
    getCategories()
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setCategories(res.data);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]))
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

  const allCategories = categories;
  const visibleCategories = (isMobile && !showAllCategories) ? allCategories.slice(0, 3) : allCategories;

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

      {/* 2. SHOP BY CATEGORY (HORIZONTALLY SCROLLABLE WITH RIGHT-SIDE ARROWS & VIEW ALL) */}
      <section className="category-section-pixel">
        <div className="category-container-pixel">
          <div className="category-flex-header-pixel">
            <div>
              <span className="section-tag-gold-pixel single-line-title" style={{ whiteSpace: 'nowrap', display: 'block' }}>
                EXPLORE OUR RANGE
              </span>
              <h2 className="section-title-serif-pixel single-line-title" style={{ margin: 0 }}>
                Shop by Category
              </h2>
            </div>

            <div className="category-header-right-controls">
              {/* Left & Right Scroll Arrow Buttons */}
              <div className="category-arrow-btns">
                <button className="btn-cat-scroll" onClick={scrollCategoryLeft} aria-label="Scroll Categories Left">
                  <ChevronLeft size={16} />
                </button>
                <button className="btn-cat-scroll" onClick={scrollCategoryRight} aria-label="Scroll Categories Right">
                  <ChevronRight size={16} />
                </button>
              </div>

              <Link to="/products" className="link-view-all-pixel">
                View All Categories <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {loadingCats ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10, color: '#A67C52' }}>
              <Loader2 className="animate-spin" size={24} />
              <span>Loading categories from database...</span>
            </div>
          ) : (
            <div className="category-scroll-wrapper" ref={categoryScrollRef}>
              {allCategories.map(cat => (
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
                    <img src={item.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNNTAgMjAgQzMwIDIwIDIwIDQwIDIwIDYwIEMyMCA4MCAzMCA5MCA1MCA5MCBDNzAgOTAgODAgODAgODAgNjAgQzgwIDQwIDcwIDIwIDUwIDIwIFoiIGZpbGw9IiNBNjdDNTIiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg=='} alt={item.name} />
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
                        addToCart(item, 1);
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
                  src={skincareStoryImg} 
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
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1F2937' }}>
                LeafOra
              </span>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
