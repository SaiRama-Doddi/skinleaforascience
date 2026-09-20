import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Droplets, FlaskConical, Heart, Award, ShieldCheck, 
  Leaf, Lightbulb, Users, CheckCircle2, ChevronRight, ArrowRight,
  Shield, Check, UserCheck, Globe, Star
} from 'lucide-react';

import aboutHeroImg from '../assets/about_hero_showcase.jpg';
import aboutLabScientistImg from '../assets/about_lab_scientist.jpg';
import aboutWomanGlowImg from '../assets/about_woman_glow.jpg';
import aboutLeafDishImg from '../assets/about_leaf_dish.jpg';
import aboutFounderPlantImg from '../assets/about_founder_plant.jpg';

import ingAloeImg from '../assets/ing_aloe.jpg';
import ingNiacinamideImg from '../assets/ing_niacinamide.jpg';
import ingDropperImg from '../assets/ing_dropper.jpg';
import ingPowderImg from '../assets/ing_powder.jpg';
import ingVitEImg from '../assets/ing_vit_e.jpg';
import ingLicoriceImg from '../assets/ing_licorice.jpg';

import './AboutUs.css';

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const ingredients = [
    { name: 'Aloe Vera', desc: 'Soothes & hydrates', img: ingAloeImg },
    { name: 'Niacinamide', desc: 'Brightens & improves tone', img: ingNiacinamideImg },
    { name: 'Salicylic Acid', desc: 'Deep cleanses & controls oil', img: ingDropperImg },
    { name: 'Kojic Acid', desc: 'Reduces dark spots & pigmentation', img: ingPowderImg },
    { name: 'Vitamin E', desc: 'Nourishes & protects', img: ingVitEImg },
    { name: 'Zinc PCA', desc: 'Balances oil & prevents acne', img: ingNiacinamideImg },
    { name: 'Licorice Extract', desc: 'Calms & evens skin tone', img: ingLicoriceImg },
  ];

  const values = [
    {
      icon: <Award size={26} color="#A67C52" />,
      title: 'Premium Quality',
      desc: 'We never compromise on quality.'
    },
    {
      icon: <FlaskConical size={26} color="#A67C52" />,
      title: 'Honest Formulations',
      desc: 'Transparent ingredients, real results.'
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.39.58 1.2 3.82-.42 6 .34.65.5 1.33.5 2 0 4.42-3.82 8-8.5 8S3.5 15.42 3.5 11c0-.67.16-1.35.5-2C2.38 6.82 2.19 3.58 3.58 3c1.39-.58 4.64.26 6.42 2.26.65-.17 1.33-.26 2-.26z" />
          <path d="M9 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM15 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      ),
      title: 'Cruelty Free',
      desc: 'Kind to animals, kind to skin.'
    },
    {
      icon: <Leaf size={26} color="#A67C52" />,
      title: 'Sustainability',
      desc: 'Responsible choices for a better tomorrow.'
    },
    {
      icon: <Lightbulb size={26} color="#A67C52" />,
      title: 'Innovation',
      desc: 'Always evolving, always improving.'
    },
    {
      icon: <Heart size={26} color="#A67C52" />,
      title: 'Customer Trust',
      desc: 'Your trust is our biggest strength.'
    }
  ];

  const milestones = [
    { year: '2024', label: 'Brand Established' },
    { year: '2024', label: 'First Product Launch' },
    { year: '2024–25', label: '1000+ Happy Customers' },
    { year: '2025', label: 'Expanding Across India' },
    { year: 'Future', label: 'Many more milestones ahead' }
  ];

  return (
    <div className="about-exact-container">
      
      {/* ─── BREADCRUMBS ─── */}
      <div className="about-breadcrumbs-bar">
        <Link to="/" className="crumb-link">Home</Link>
        <span className="crumb-sep">&gt;</span>
        <span className="crumb-active">About Us</span>
      </div>

      {/* ─── 1. HERO SECTION ─── */}
      <section className="about-hero-block">
        <div className="about-hero-grid">
          
          <div className="about-hero-text">
            <h1 className="about-hero-brand-title">
              About <span className="brand-gold">LeafOra</span>
            </h1>

            <div className="about-leaf-flourish">
              <span className="flourish-line"></span>
              <Leaf size={16} className="flourish-icon" />
              <span className="flourish-line"></span>
            </div>

            <div className="about-hero-headlines">
              <h2 className="headline-dark">Inspired by Nature.</h2>
              <h2 className="headline-gold">Backed by Science.</h2>
            </div>

            <p className="about-hero-para">
              We blend the purity of natural ingredients with advanced science to create safe, effective and high performance skincare for every skin type.
            </p>
          </div>

          <div className="about-hero-media">
            <div className="hero-showcase-frame">
              <img src={aboutHeroImg} alt="LeafOra Skincare Collection" />
            </div>
          </div>

        </div>
      </section>

      {/* ─── 2. OUR STORY / OUR MISSION / OUR VISION (3 PILLARS) ─── */}
      <section className="about-pillars-block">
        <div className="pillars-three-grid">
          
          {/* Card 1: Our Story */}
          <div className="pillar-card story-card">
            <div className="story-media-left">
              <img src={aboutLeafDishImg} alt="Natural Organic Leaf and Serum" />
            </div>
            <div className="story-content-right">
              <h3 className="pillar-heading">
                Our Story
                <span className="heading-subline"></span>
              </h3>
              <p>
                <strong>LeafOra Life Sciences</strong> was founded with one simple vision — to create effective skincare powered by nature and perfected through science.
              </p>
              <p>
                Every formula is thoughtfully developed using the finest ingredients to help people achieve healthier, radiant skin with confidence.
              </p>
            </div>
          </div>

          {/* Card 2: Our Mission */}
          <div className="pillar-card mission-card">
            <h3 className="pillar-heading">
              Our Mission
              <span className="heading-subline"></span>
            </h3>
            <ul className="mission-list">
              <li>
                <span className="mission-icon-circle"><Droplets size={16} /></span>
                <span>To provide safe and effective skincare solutions</span>
              </li>
              <li>
                <span className="mission-icon-circle"><FlaskConical size={16} /></span>
                <span>Science-backed, result-driven formulations</span>
              </li>
              <li>
                <span className="mission-icon-circle"><Sparkles size={16} /></span>
                <span>Deliver visible results with honesty and transparency</span>
              </li>
              <li>
                <span className="mission-icon-circle"><Users size={16} /></span>
                <span>Put our customers' trust and satisfaction first</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Our Vision */}
          <div className="pillar-card vision-card">
            <h3 className="pillar-heading">
              Our Vision
              <span className="heading-subline"></span>
            </h3>
            <p>
              To become one of India's most trusted premium skincare brands and make science-backed skincare accessible to every home.
            </p>
            <div className="vision-dish-graphic">
              <div className="glass-dish-accent"></div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. OUR VALUES (6 PILLARS IN 1 ROW) ─── */}
      <section className="about-values-block">
        <div className="values-header-line">
          <span className="v-line"></span>
          <h2 className="values-title">Our Values</h2>
          <span className="v-line"></span>
        </div>

        <div className="values-six-grid">
          {values.map((val, idx) => (
            <div key={idx} className="value-mini-card">
              <div className="value-icon-wrap">{val.icon}</div>
              <h4>{val.title}</h4>
              <p>{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. NATURE MEETS SCIENCE & 7 INGREDIENTS ─── */}
      <section className="about-ingredients-block">
        <div className="nature-science-row">
          
          {/* Left Dark Green Box */}
          <div className="nature-left-dark-box">
            <div className="dark-box-leaf-icon">
              <Leaf size={18} color="#D4AF37" />
            </div>
            <h3>Nature Meets Science</h3>
            <p>
              At LeafOra, we believe nature provides the best, and science makes it better. Our products combine natural actives with advanced scientific research to deliver safe, effective and long-lasting results for your skin.
            </p>
            <Link to="/products" className="explore-ing-btn">
              EXPLORE INGREDIENTS
            </Link>
          </div>

          {/* Right 7 Ingredients Circular Row */}
          <div className="ingredients-seven-row">
            {ingredients.map((ing, i) => (
              <div key={i} className="ingredient-circle-item">
                <div className="ing-circle-img">
                  <img src={ing.img} alt={ing.name} />
                </div>
                <h5>{ing.name}</h5>
                <p>{ing.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── 5. WHY CHOOSE LEAFORA & MANUFACTURING/QUALITY ─── */}
      <section className="about-dual-features-block">
        <div className="dual-features-grid">
          
          {/* Left Card: Why Choose LeafOra? */}
          <div className="feature-card-half why-choose-card">
            <div className="why-choose-left-img">
              <img src={aboutWomanGlowImg} alt="Radiant healthy skin woman" />
            </div>
            <div className="why-choose-right-content">
              <h3 className="dual-heading">Why Choose LeafOra?</h3>
              
              <div className="badges-six-grid">
                <div className="badge-unit">
                  <div className="badge-icon-c"><UserCheck size={18} /></div>
                  <span>Dermatologist Inspired</span>
                </div>
                <div className="badge-unit">
                  <div className="badge-icon-c">
                    <span style={{ fontSize: '1.1rem' }}>🇮🇳</span>
                  </div>
                  <span>Made in India</span>
                </div>
                <div className="badge-unit">
                  <div className="badge-icon-c"><FlaskConical size={18} /></div>
                  <span>Science Backed</span>
                </div>
                <div className="badge-unit">
                  <div className="badge-icon-c"><Leaf size={18} /></div>
                  <span>Premium Ingredients</span>
                </div>
                <div className="badge-unit">
                  <div className="badge-icon-c"><ShieldCheck size={18} /></div>
                  <span>Safe & Effective Formulas</span>
                </div>
                <div className="badge-unit">
                  <div className="badge-icon-c"><CheckCircle2 size={18} /></div>
                  <span>Quality Tested</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Manufacturing & Quality */}
          <div className="feature-card-half manufacturing-card">
            <div className="mfg-left-content">
              <h3 className="dual-heading">Manufacturing & Quality</h3>
              <p>
                Our products are manufactured in GMP certified facilities that follow strict quality control and hygiene standards.
              </p>
              <p>
                From raw material sourcing to final packaging, every step is carefully monitored to ensure safety, consistency and effectiveness.
              </p>

              <div className="cert-badges-row">
                <div className="cert-badge">
                  <div className="cert-circle">GMP</div>
                  <span>GMP Certified</span>
                </div>
                <div className="cert-badge">
                  <div className="cert-circle"><FlaskConical size={14} /></div>
                  <span>Clinically Tested</span>
                </div>
                <div className="cert-badge">
                  <div className="cert-circle">pH</div>
                  <span>pH Balanced</span>
                </div>
                <div className="cert-badge">
                  <div className="cert-circle"><ShieldCheck size={14} /></div>
                  <span>Dermatologically Tested</span>
                </div>
              </div>
            </div>

            <div className="mfg-right-img">
              <img src={aboutLabScientistImg} alt="Dermatology Research Scientist" />
            </div>
          </div>

        </div>
      </section>

      {/* ─── 6. FROM OUR FOUNDER & OUR JOURNEY ─── */}
      <section className="about-founder-journey-block">
        <div className="founder-journey-grid">
          
          {/* Left: From Our Founder */}
          <div className="founder-card-box">
            <div className="founder-quote-symbol">“</div>
            <div className="founder-text-part">
              <h3 className="founder-title">From Our Founder</h3>
              <p className="founder-quote-text">
                LeafOra is more than skincare—it's our promise to bring together nature, science, and trust in every product.
              </p>
              <div className="founder-sign">
                — Team LeafOra
              </div>
            </div>
            <div className="founder-plant-frame">
              <img src={aboutFounderPlantImg} alt="LeafOra Botanical Philosophy" />
            </div>
          </div>

          {/* Right: Our Journey */}
          <div className="journey-card-box">
            <h3 className="journey-title">Our Journey</h3>
            
            <div className="timeline-horizontal-wrap">
              <div className="timeline-connect-line"></div>
              
              <div className="timeline-nodes-row">
                {milestones.map((ms, mIdx) => (
                  <div key={mIdx} className="timeline-node-unit">
                    <div className="node-dot"></div>
                    <div className="node-year">{ms.year}</div>
                    <div className="node-label">{ms.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 7. READY TO EXPERIENCE CTA BANNER ─── */}
      <section className="about-cta-banner-block">
        <div className="cta-banner-inner">
          <div className="cta-leaf-left">🌿</div>
          <div className="cta-text-group">
            <h3>Ready to Experience Healthy, Radiant Skin?</h3>
            <p>Discover our science-backed skincare products.</p>
          </div>
          <Link to="/products" className="cta-shop-collection-btn">
            SHOP COLLECTION <ArrowRight size={16} />
          </Link>
          <div className="cta-leaf-right">🌿</div>
        </div>
      </section>

    </div>
  );
}
