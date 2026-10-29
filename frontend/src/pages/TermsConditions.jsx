import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, Truck, Scale, Mail, Phone, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import './PolicyPages.css';

export default function TermsConditions() {
  const termsList = [
    {
      num: 1,
      title: 'Product Information',
      desc: 'We make reasonable efforts to display accurate product descriptions, prices, images and ingredients. Actual packaging and appearance may vary slightly.'
    },
    {
      num: 2,
      title: 'Pricing and Orders',
      desc: 'All prices are displayed in Indian Rupees (INR). Orders are subject to product availability and confirmation.'
    },
    {
      num: 3,
      title: 'Payments',
      desc: 'Payments must be completed using the payment methods available on our website.'
    },
    {
      num: 4,
      title: 'Shipping and Delivery',
      desc: 'Delivery estimates depend on the delivery address, courier service and product availability.'
    },
    {
      num: 5,
      title: 'Returns and Refunds',
      desc: 'Returns, refunds and cancellations are governed by our published Return and Refund Policy.'
    },
    {
      num: 6,
      title: 'Product Use',
      desc: 'Please read the product label, ingredients, directions and warnings before use. Discontinue use if irritation occurs.'
    },
    {
      num: 7,
      title: 'Intellectual Property',
      desc: 'The LeafOra name, logo, product images and website content may not be copied or used without authorisation.'
    },
    {
      num: 8,
      title: 'Changes to Terms',
      desc: 'We may update these terms from time to time.'
    },
    {
      num: 9,
      title: 'Contact',
      desc: 'For assistance, contact us using the official contact details published on our website.'
    }
  ];

  return (
    <div className="policy-page-wrapper">
      <SEO 
        title="Terms & Conditions | LeafOra Life Sciences"
        description="Official Terms and Conditions for purchasing and accessing products on LeafOra Life Sciences Private Limited website."
        canonicalUrl="https://leaforalifescience.com/terms-and-conditions"
      />

      {/* Hero Banner */}
      <section className="policy-hero-banner">
        <div className="policy-hero-badge">
          <Scale size={14} /> Legal & Compliance
        </div>
        <h1 className="policy-hero-title">Terms & Conditions</h1>
        <p className="policy-hero-subtitle">
          Welcome to LEAFORA LIFE SCIENCES PRIVATE LIMITED. Please review our standard terms of service governing your purchase and use of our platform.
        </p>
      </section>

      {/* Policy Navigation Tabs */}
      <div className="policy-tabs-bar">
        <Link to="/terms-and-conditions" className="policy-tab-link active">
          <FileText size={15} /> Terms & Conditions
        </Link>
        <Link to="/shipping-policy" className="policy-tab-link">
          <Truck size={15} /> Shipping & Delivery
        </Link>
        <Link to="/privacy-policy" className="policy-tab-link">
          <ShieldCheck size={15} /> Privacy Policy
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="policy-content-container">
        <div className="policy-card">
          <div className="policy-header-row">
            <div>
              <h2 className="policy-company-title">LEAFORA LIFE SCIENCES PRIVATE LIMITED</h2>
              <p className="policy-company-sub">CIN / Registered Legal Entity • Ahmedabad, Gujarat, India</p>
            </div>
            <span style={{ fontSize: '0.82rem', background: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
              Last Updated: October 2026
            </span>
          </div>

          <div className="policy-intro-box">
            <strong>Welcome to LEAFORA LIFE SCIENCES PRIVATE LIMITED.</strong>
            <br />
            By accessing or purchasing from our website, you agree to the following terms and conditions.
          </div>

          <div className="policy-sections-list">
            {termsList.map((item) => (
              <div key={item.num} className="policy-section-item">
                <div className="policy-num-badge">{item.num}</div>
                <div className="policy-item-content">
                  <h3 className="policy-item-title">{item.title}</h3>
                  <p className="policy-item-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="policy-legal-footnote">
            <Scale size={18} color="#1A3E2F" />
            <span>These terms are subject to applicable laws of India.</span>
          </div>

          {/* Concierge Help Card */}
          <div className="policy-concierge-card">
            <div className="policy-concierge-info">
              <h4>Questions About Our Terms?</h4>
              <p>Our Botanical Care Concierge is available to help resolve any query.</p>
            </div>
            <div className="policy-concierge-btns">
              <a href="mailto:care@leaforalifescience.com" className="policy-btn-contact">
                <Mail size={15} /> Email Support
              </a>
              <a href="https://wa.me/917984915600" target="_blank" rel="noreferrer" className="policy-btn-whatsapp">
                <MessageSquare size={15} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
