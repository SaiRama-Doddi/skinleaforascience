import React from 'react';
import { 
  ArrowRight, Leaf, ShieldCheck, Heart, Users, Award, 
  Sparkles, Globe, Share2, MessageCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-page-3rd">

      {/* 1. HERO SECTION ("ABOUT US / Nature's Care Backed by Science") */}
      <section className="hero-section-3rd">
        <div className="hero-left-col">
          <span className="section-tag-gold">ABOUT US</span>
          <h1 className="section-title-serif">
            Nature’s Care <br />
            Backed by Science
          </h1>
          <p className="section-desc">
            We believe in skincare that is pure, effective and kind to you — and to the planet.
          </p>
          <a href="#our-story" className="btn-bronze-pill">
            Our Story <ArrowRight size={16} />
          </a>
        </div>

        <div className="hero-right-col">
          <img 
            src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80" 
            alt="Leafora Skincare Pedestal" 
            className="hero-pedestal-img-main"
          />
          <div className="hero-side-text-italic">
            Pure Skincare Brighter Tomorrows
          </div>
        </div>
      </section>

      {/* 2. SECTION 2 ("OUR STORY / A Healthier Tomorrow Starts Today") */}
      <section className="story-section-3rd" id="our-story">
        <div className="story-container">
          
          {/* Left Model Photo with Handwriting Overlay */}
          <div className="story-model-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" 
              alt="Healthy Skin Happier You Model" 
              className="story-model-img"
            />
            <div className="script-overlay-badge">
              Healthy Skin <br />
              Happier You
            </div>
          </div>

          {/* Right Narrative Content & 4 Value Icons */}
          <div className="story-right-grid">
            <div>
              <span className="section-tag-gold">OUR STORY</span>
              <h2 className="section-title-serif">
                A Healthier Tomorrow Starts Today
              </h2>
              <p className="section-desc">
                <strong>Leafora Life Sciences</strong> was born from a simple belief — that <em>nature</em> and science together can create healthier, radiant skin for everyone.
              </p>
              <p className="section-desc">
                We are passionate about formulating skincare essentials using pure, high-quality ingredients, backed by dermatological science. Our mission is to make clean, effective and safe skincare accessible to all, so you can feel confident in your skin, every single day.
              </p>
            </div>

            {/* 4 Vertical Pillar Cards */}
            <div className="story-pillars-col">
              <div className="story-pillar-card">
                <div className="pillar-icon-box"><Leaf size={20} /></div>
                <div className="pillar-info">
                  <h5>100%</h5>
                  <p>Clean Ingredients</p>
                </div>
              </div>

              <div className="story-pillar-card">
                <div className="pillar-icon-box"><ShieldCheck size={20} /></div>
                <div className="pillar-info">
                  <h5>Dermatologist</h5>
                  <p>Tested & Approved</p>
                </div>
              </div>

              <div className="story-pillar-card">
                <div className="pillar-icon-box"><Heart size={20} /></div>
                <div className="pillar-info">
                  <h5>Trusted by</h5>
                  <p>50K+ Customers</p>
                </div>
              </div>

              <div className="story-pillar-card">
                <div className="pillar-icon-box"><Users size={20} /></div>
                <div className="pillar-info">
                  <h5>A Greener</h5>
                  <p>Tomorrow</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SECTION 3 ("OUR VALUES / What We Stand For") */}
      <section className="values-section-3rd">
        <div className="values-container">
          <div className="values-header">
            <span className="section-tag-gold">OUR VALUES</span>
            <h2 className="section-title-serif">What We Stand For</h2>
          </div>

          <div className="values-main-layout">
            {/* 4 Column Value Cards */}
            <div className="values-cards-grid">
              <div className="value-item-card">
                <div className="value-icon-circle-lg"><Leaf size={24} /></div>
                <h4>Purity</h4>
                <p>Clean, natural ingredients with no harsh chemicals.</p>
              </div>

              <div className="value-item-card">
                <div className="value-icon-circle-lg"><ShieldCheck size={24} /></div>
                <h4>Science</h4>
                <p>Formulations backed by research and dermatology.</p>
              </div>

              <div className="value-item-card">
                <div className="value-icon-circle-lg"><Heart size={24} /></div>
                <h4>Care</h4>
                <p>Safe, gentle and effective for every skin type.</p>
              </div>

              <div className="value-item-card">
                <div className="value-icon-circle-lg"><Sparkles size={24} /></div>
                <h4>Sustainability</h4>
                <p>Kind to your skin and the planet.</p>
              </div>
            </div>

            {/* Right Side Leaf Banner */}
            <div className="values-right-banner">
              <img 
                src="https://images.unsplash.com/photo-1608248597263-0057e57b4522?auto=format&fit=crop&w=700&q=80" 
                alt="Good for You Good for the Planet" 
                className="values-leaf-img"
              />
              <div className="values-leaf-callout">
                Good for You.<br />Good for the Planet.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 4 ("A More Sustainable Future") */}
      <section className="sustainability-section-3rd">
        <div className="sustainability-grid">
          <div>
            <h2 className="section-title-serif">
              A More Sustainable Future
            </h2>
            <p className="section-desc">
              We are committed to reducing our environmental footprint with eco-friendly packaging, responsibly sourced ingredients and sustainable practices. Because beautiful skin should never come at the cost of our planet.
            </p>
            <Link to="/shop" className="btn-bronze-pill">
              Our Sustainability <ArrowRight size={16} />
            </Link>
          </div>

          {/* Center Visual: Plant seedling in hands */}
          <div className="sustain-center-img-wrap">
            <img 
              src="https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80" 
              alt="Hands holding young plant seedling" 
            />
          </div>

          {/* Right 3 Eco Pillars */}
          <div className="sustain-right-pillars">
            <div className="eco-pillar-row">
              <div className="pillar-icon-box"><Globe size={20} /></div>
              <div>
                <h5>Eco-Friendly Packaging</h5>
                <p>Thoughtful, minimal, recyclable.</p>
              </div>
            </div>

            <div className="eco-pillar-row">
              <div className="pillar-icon-box"><Leaf size={20} /></div>
              <div>
                <h5>Sustainably Sourced</h5>
                <p>Ingredients you can trust.</p>
              </div>
            </div>

            <div className="eco-pillar-row">
              <div className="pillar-icon-box"><Sparkles size={20} /></div>
              <div>
                <h5>A Cleaner Tomorrow</h5>
                <p>Skincare for a brighter, greener future.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 5 ("JOIN OUR JOURNEY / Let's Create a Healthier, More Radiant World Together") */}
      <section className="journey-banner-section">
        <div className="journey-container">
          <div className="journey-left-content">
            <span className="journey-tag">JOIN OUR JOURNEY</span>
            <h2 className="journey-title">
              Let's Create a Healthier, More Radiant World Together
            </h2>
            <Link to="/shop" className="btn-bronze-pill">
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right 3 Pillars */}
          <div className="journey-pillars-row">
            <div className="journey-pillar-item">
              <div className="journey-pillar-icon"><Leaf size={24} /></div>
              <span>Better Skin</span>
            </div>

            <div className="journey-pillar-item">
              <div className="journey-pillar-icon"><Heart size={24} /></div>
              <span>Happier People</span>
            </div>

            <div className="journey-pillar-item">
              <div className="journey-pillar-icon"><Globe size={24} /></div>
              <span>A Greener Planet</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLEAN WHITE FOOTER MATCHING 3RD REFERENCE IMAGE */}
      <footer className="footer-3rd">
        <div className="footer-top-row">
          <div className="footer-brand-logo">
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#A67C52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Leaf size={20} />
            </div>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#1F2937' }}>
              LeafOra <span style={{ fontSize: '0.65rem', display: 'block', textTransform: 'uppercase', letterSpacing: 1, color: '#A67C52' }}>Life Sciences</span>
            </span>
          </div>

          <ul className="footer-nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/shop">Skincare</Link></li>
            <li><a href="#our-story">About Us</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="footer-social-row">
            <a href="https://instagram.com" className="social-circle-btn"><Globe size={16} /></a>
            <a href="https://facebook.com" className="social-circle-btn"><Share2 size={16} /></a>
            <a href="https://pinterest.com" className="social-circle-btn"><MessageCircle size={16} /></a>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
            Pure Ingredients | Real Results | A Brighter Tomorrow
          </div>
        </div>

        <div className="footer-bottom-row">
          <div>
            © {new Date().getFullYear()} Leafora Life Sciences. All rights reserved.
          </div>
          <div>
            Skincare for a Healthier You | Made with ♥ for a Better Tomorrow
          </div>
        </div>
      </footer>

    </div>
  );
}
