import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Leaf, ShieldCheck, Heart, Sparkles, Globe, 
  FlaskConical, RefreshCw, Target, Eye, Gem, Award, CheckCircle2 
} from 'lucide-react';
import skincareStoryImg from '../assets/skincare_story_showcase.jpg';
import loginProductImg from '../assets/login_botanical_products.jpg';
import heroImg from '../assets/heroimage.jpeg';
import './AboutUs.css';

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-us-page">

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO BANNER ("OUR STORY") */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-hero-section">
        <div className="about-hero-container">
          
          {/* Left Column Content */}
          <div className="about-hero-left">
            <span className="about-tag">OUR STORY</span>
            
            <h1 className="about-hero-title">
              Nature Inspires.<br />
              Science Delivers.
            </h1>
            
            <p className="about-hero-sub">
              At LeafOra Life Sciences, we believe in the power of nature and the precision of science to bring out your most radiant, healthy skin.
            </p>

            <Link to="/products" className="about-btn-bronze">
              Our Journey <ArrowRight size={16} />
            </Link>

            <div className="about-hero-bottom-tag">
              — PURE CARE A BRIGHTER TOMORROW
            </div>
          </div>

          {/* Right Column Image Frame */}
          <div className="about-hero-right">
            <div className="about-hero-img-box">
              <img src={skincareStoryImg} alt="LeafOra Skincare Natural Beauty Real Results" />
              <div className="about-hero-cursive-badge">
                <span>Good Skin</span>
                <small>Brighter Tomorrow</small>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. "WHO WE ARE" SECTION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-who-section">
        <div className="about-who-container">
          
          {/* Left Column Image */}
          <div className="about-who-img-wrap">
            <img src={loginProductImg} alt="LeafOra Model Skin Care" />
            <div className="about-who-badge">
              <span>SKINCARE THAT CARES —</span>
            </div>
          </div>

          {/* Right Column Content */}
          <div className="about-who-content">
            <span className="about-tag">WHO WE ARE</span>
            
            <h2 className="about-section-title">
              More Than Skincare,<br />
              A Commitment to You
            </h2>

            <p className="about-description">
              LeafOra Life Sciences is a skincare brand dedicated to creating safe, effective and nature-inspired skincare solutions for every skin type. Our formulations combine the goodness of natural ingredients with advanced dermatological science — because your skin deserves the best of both worlds.
            </p>

            {/* 4 Circle Icon Badges */}
            <div className="about-who-features-grid">
              <div className="who-feature-card">
                <div className="who-icon-circle">
                  <FlaskConical size={20} color="#9E6E38" />
                </div>
                <span>Science Backed Formulas</span>
              </div>

              <div className="who-feature-card">
                <div className="who-icon-circle">
                  <ShieldCheck size={20} color="#9E6E38" />
                </div>
                <span>Dermatologist Tested</span>
              </div>

              <div className="who-feature-card">
                <div className="who-icon-circle">
                  <Heart size={20} color="#9E6E38" />
                </div>
                <span>Safe & Gentle for All Skin Types</span>
              </div>

              <div className="who-feature-card">
                <div className="who-icon-circle">
                  <Leaf size={20} color="#9E6E38" />
                </div>
                <span>Sustainably Sourced</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. "OUR PURPOSE" SECTION (MISSION, VISION, VALUES) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-purpose-section">
        <div className="about-purpose-container">
          
          {/* Left Title Column */}
          <div className="about-purpose-left">
            <span className="about-tag">OUR PURPOSE</span>
            <h2 className="about-section-title">
              Healthy Skin.<br />
              Happier Lives.
            </h2>
          </div>

          {/* Right 3 Cards Grid */}
          <div className="about-purpose-right-grid">
            <div className="purpose-card">
              <div className="purpose-icon-box">
                <Target size={24} color="#9E6E38" />
              </div>
              <h3>Our Mission</h3>
              <p>
                To make high-quality, nature-inspired skincare accessible to everyone for healthier, brighter and more confident skin.
              </p>
            </div>

            <div className="purpose-card">
              <div className="purpose-icon-box">
                <Eye size={24} color="#9E6E38" />
              </div>
              <h3>Our Vision</h3>
              <p>
                To be a globally trusted skincare brand, known for ethical practices, innovative formulations and a positive impact on people and the planet.
              </p>
            </div>

            <div className="purpose-card">
              <div className="purpose-icon-box">
                <Gem size={24} color="#9E6E38" />
              </div>
              <h3>Our Values</h3>
              <p>
                Purity, Safety, Innovation, Sustainability and a deep commitment to our customers' well-being.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. "OUR IMPACT" SECTION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-impact-section">
        <div className="about-impact-container">
          
          {/* Left Column Image */}
          <div className="about-impact-img-wrap">
            <img src={heroImg} alt="LeafOra Botanical Leaf Dew" />
          </div>

          {/* Right Column Stats */}
          <div className="about-impact-content">
            <span className="about-tag">OUR IMPACT</span>
            <h2 className="about-section-title">
              Small Steps. A Bigger Difference.
            </h2>

            <div className="about-stats-grid">
              <div className="stat-box">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>

              <div className="stat-box">
                <div className="stat-number">50+</div>
                <div className="stat-label">Skincare Products</div>
              </div>

              <div className="stat-box">
                <div className="stat-number">5+</div>
                <div className="stat-label">Countries</div>
              </div>

              <div className="stat-box">
                <div className="stat-number">100%</div>
                <div className="stat-label">Commitment to Clean Beauty</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. "OUR COMMITMENT" (BEAUTY WITH RESPONSIBILITY) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-commitment-section">
        <div className="about-commitment-container">
          
          {/* Left Column */}
          <div className="about-commitment-left">
            <span className="about-tag">OUR COMMITMENT</span>
            <h2 className="about-section-title">
              Beauty with Responsibility
            </h2>
            <p className="about-description">
              We care for your skin and the planet. From ethically sourced ingredients to eco-friendly packaging, we're committed to a more sustainable tomorrow.
            </p>
            <Link to="/products" className="about-btn-bronze">
              Our Sustainability <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right Column 4 Badges */}
          <div className="about-commitment-badges-grid">
            <div className="commitment-badge">
              <div className="commitment-icon-circle">
                <Leaf size={22} color="#9E6E38" />
              </div>
              <span>Clean Ingredients</span>
            </div>

            <div className="commitment-badge">
              <div className="commitment-icon-circle">
                <RefreshCw size={22} color="#9E6E38" />
              </div>
              <span>Eco-Friendly Packaging</span>
            </div>

            <div className="commitment-badge">
              <div className="commitment-icon-circle">
                <Heart size={22} color="#9E6E38" />
              </div>
              <span>Cruelty Free</span>
            </div>

            <div className="commitment-badge">
              <div className="commitment-icon-circle">
                <Globe size={22} color="#9E6E38" />
              </div>
              <span>A Greener Tomorrow</span>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. BOTTOM CALL-TO-ACTION (CTA) BANNER */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="about-cta-banner">
        <div className="about-cta-overlay" />
        
        <div className="about-cta-content">
          <h2>Let's Build a Healthier, Brighter Tomorrow</h2>
          <p>Join us in our journey to natural, effective and conscious skincare.</p>
          <Link to="/products" className="about-btn-gold">
            Shop Our Collection <ArrowRight size={16} />
          </Link>
        </div>

        <div className="about-cta-cursive-text">
          <span>Skincare for a Better Tomorrow</span>
        </div>
      </section>

    </div>
  );
}
