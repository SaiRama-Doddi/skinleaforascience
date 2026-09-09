import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Phone, MapPin, Clock, Send, User, MessageSquare, 
  ChevronRight, CheckCircle2, AlertCircle, Leaf, Heart, PhoneCall,
  ExternalLink, Sparkles, HelpCircle, X
} from 'lucide-react';
import skincareStoryImg from '../assets/skincare_story_showcase.jpg';
import './ContactUs.css';

export default function ContactUs() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showFaqModal, setShowFaqModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAlert(null);

    if (!form.first_name || !form.email || !form.message) {
      setAlert({ type: 'error', text: 'Please fill in all required fields marked with *.' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAlert({ type: 'success', text: `Thank you ${form.first_name}! Your message has been sent successfully. We will get back to you within 24 hours.` });
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      });
    }, 800);
  };

  return (
    <div className="contact-us-page">

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO BANNER ("GET IN TOUCH ———") */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-hero-section">
        <div className="contact-hero-container">
          
          {/* Left Column Content */}
          <div className="contact-hero-left">
            <span className="contact-tag">GET IN TOUCH ———</span>

            <h1 className="contact-hero-title">
              We’re Here<br />
              For You
            </h1>

            <p className="contact-hero-sub">
              Have questions, need support, or simply want to know more about our products? We’d love to hear from you.
            </p>

            {/* 3 Pill Feature Items Row */}
            <div className="contact-hero-features-row">
              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <Leaf size={18} color="#9E6E38" />
                </div>
                <div className="hero-feature-text">
                  <strong>Real People</strong>
                  <span>Real Support</span>
                </div>
              </div>

              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <Heart size={18} color="#9E6E38" />
                </div>
                <div className="hero-feature-text">
                  <strong>Your Skin</strong>
                  <span>Our Priority</span>
                </div>
              </div>

              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <PhoneCall size={18} color="#9E6E38" />
                </div>
                <div className="hero-feature-text">
                  <strong>We’re Just</strong>
                  <span>a Message Away</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Showcase Card Frame */}
          <div className="contact-hero-right">
            <div className="contact-hero-img-card">
              <img src={skincareStoryImg} alt="Let's Connect - LeafOra Skincare" />
              
              <div className="hero-connect-overlay">
                <div className="connect-card-paper">
                  <span className="paper-title">Let’s</span>
                  <span className="paper-title-big">Connect ♡</span>
                </div>
              </div>

              <div className="contact-hero-cursive-badge">
                <span>Skincare</span>
                <small>for a Brighter Tomorrow</small>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MAIN TWO-COLUMN SECTION (FORM + INFO & MAP) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-main-section">
        <div className="contact-main-container">

          {/* LEFT COLUMN: FLOATING WHITE FORM CARD */}
          <div className="contact-form-card">
            <div className="form-card-header">
              <h2>Send Us a Message</h2>
              <p>Fill out the form below and our team will get back to you as soon as possible.</p>
            </div>

            {alert && (
              <div className={`contact-alert ${alert.type}`}>
                {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{alert.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              
              {/* Row 1: First Name & Last Name */}
              <div className="form-row-two">
                <div className="field-group">
                  <label>First Name *</label>
                  <div className="input-box">
                    <User size={18} className="box-icon" />
                    <input 
                      type="text" 
                      placeholder="Enter your first name" 
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Last Name *</label>
                  <div className="input-box">
                    <User size={18} className="box-icon" />
                    <input 
                      type="text" 
                      placeholder="Enter your last name" 
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email Address */}
              <div className="field-group">
                <label>Email Address *</label>
                <div className="input-box">
                  <Mail size={18} className="box-icon" />
                  <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Phone Number */}
              <div className="field-group">
                <label>Phone Number</label>
                <div className="input-box">
                  <Phone size={18} className="box-icon" />
                  <input 
                    type="tel" 
                    placeholder="Enter your phone number (optional)" 
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 4: Subject Dropdown */}
              <div className="field-group">
                <label>Subject *</label>
                <div className="input-box select-box">
                  <MessageSquare size={18} className="box-icon" />
                  <select 
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Support">Order Support & Status</option>
                    <option value="Product Advice">Product Recommendation & Advice</option>
                    <option value="Returns & Refunds">Returns & Refunds</option>
                    <option value="Partnerships">Partnerships & Wholesale</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Your Message */}
              <div className="field-group">
                <label>Your Message *</label>
                <div className="textarea-box">
                  <textarea 
                    rows={4}
                    placeholder="Type your message here..." 
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Submit Bronze Button */}
              <button type="submit" className="contact-btn-bronze" disabled={loading}>
                {loading ? 'Sending Message...' : <>Send Message <Send size={16} /></>}
              </button>

            </form>
          </div>

          {/* RIGHT COLUMN: CONTACT INFORMATION & FIND US HERE */}
          <div className="contact-info-column">
            
            {/* TOP CARD: Contact Information */}
            <div className="info-card-panel">
              <div className="info-card-header">
                <h2>Contact Information</h2>
                <p>Reach out to us through any of the following channels.</p>
              </div>

              <div className="info-items-list">
                
                {/* Call Us */}
                <div className="info-item-row">
                  <div className="info-icon-circle">
                    <Phone size={20} color="#9E6E38" />
                  </div>
                  <div className="info-text-box">
                    <strong>Call Us</strong>
                    <a href="tel:+12345678900" className="info-main-link">+1 234 567 8900</a>
                    <span className="info-subtext">Mon – Sat, 9:00 AM – 6:00 PM (EST)</span>
                  </div>
                </div>

                {/* Email Us */}
                <div className="info-item-row">
                  <div className="info-icon-circle">
                    <Mail size={20} color="#9E6E38" />
                  </div>
                  <div className="info-text-box">
                    <strong>Email Us</strong>
                    <a href="mailto:support@leafora.com" className="info-main-link">support@leafora.com</a>
                    <span className="info-subtext">We reply within 24 hours</span>
                  </div>
                </div>

                {/* Visit Us */}
                <div className="info-item-row">
                  <div className="info-icon-circle">
                    <MapPin size={20} color="#9E6E38" />
                  </div>
                  <div className="info-text-box">
                    <strong>Visit Us</strong>
                    <span className="info-main-text">123 Wellness Avenue,</span>
                    <span className="info-subtext">San Francisco, CA 94107, USA</span>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="info-item-row">
                  <div className="info-icon-circle">
                    <Clock size={20} color="#9E6E38" />
                  </div>
                  <div className="info-text-box">
                    <strong>Business Hours</strong>
                    <span className="info-main-text">Monday – Saturday: 9:00 AM – 6:00 PM</span>
                    <span className="info-subtext">Sunday: Closed</span>
                  </div>
                </div>

              </div>

              {/* Right Side Cursive Accent */}
              <div className="info-cursive-accent">
                <span>Good Skin</span>
                <small>Brighter Tomorrows</small>
              </div>
            </div>

            {/* BOTTOM CARD: Find Us Here (Interactive Styled Map) */}
            <div className="map-card-panel">
              <div className="map-card-header">
                <div>
                  <h2>Find Us Here</h2>
                  <span className="map-sublabel">Our Location</span>
                </div>
                
                <a 
                  href="https://maps.google.com/?q=San+Francisco+CA" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="map-view-link"
                >
                  View on Google Maps <ExternalLink size={14} />
                </a>
              </div>

              {/* STYLED INTERACTIVE GOOGLE MAP FRAME */}
              <div className="map-embed-wrapper">
                <iframe 
                  title="LeafOra Life Sciences San Francisco HQ Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.086488730906!2d-122.3986064234569!3d37.78168297198305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085807c4b0c7979%3A0x6b80d0d9703c1!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                  width="100%" 
                  height="180" 
                  style={{ border: 0, borderRadius: 14 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {/* Floating Pin Badge */}
                <div className="map-pin-badge">
                  <div className="pin-red-circle" />
                  <strong>LeafOra Life Sciences</strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. FAQ PROMO BANNER ("STILL HAVE QUESTIONS?") */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="contact-faq-banner">
        <div className="faq-banner-container">
          
          <div className="faq-banner-left">
            <span className="faq-tag">STILL HAVE QUESTIONS?</span>
            <h2>Check Our FAQs</h2>
            <p>Find quick answers to common questions about orders, shipping, returns and more.</p>
          </div>

          <div className="faq-banner-right">
            <button 
              className="faq-btn-outline" 
              onClick={() => setShowFaqModal(true)}
            >
              View FAQs <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. INTERACTIVE FAQ MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showFaqModal && (
        <div className="faq-modal-overlay" onClick={() => setShowFaqModal(false)}>
          <div className="faq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="faq-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HelpCircle size={22} color="#9E6E38" />
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: '#1A2E22' }}>
                  Frequently Asked Questions
                </h3>
              </div>
              <button className="faq-close-btn" onClick={() => setShowFaqModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="faq-modal-body">
              <div className="faq-item-box">
                <h4>🌿 Are LeafOra products 100% natural & cruelty-free?</h4>
                <p>Yes! All our skincare formulations use pure bio-botanical extracts and zero harsh chemicals or synthetic parabens. We are 100% cruelty-free.</p>
              </div>

              <div className="faq-item-box">
                <h4>🚚 What are your shipping times & delivery options?</h4>
                <p>We provide Free Express Delivery on orders above ₹999. Standard domestic orders deliver within 2-4 business days.</p>
              </div>

              <div className="faq-item-box">
                <h4>🔄 What is your Return & Refund policy?</h4>
                <p>We offer a 30-day money-back guarantee. If you are not satisfied with your purchase, contact our support team for a full refund.</p>
              </div>

              <div className="faq-item-box">
                <h4>✨ How do I choose the right skincare routine for my skin type?</h4>
                <p>You can send us a message through the contact form above specifying your skin concern, and our expert dermatological team will guide you!</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
