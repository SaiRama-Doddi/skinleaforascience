import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Truck, Lock, Mail, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import './PolicyPages.css';

export default function PrivacyPolicy() {
  const privacyPoints = [
    {
      num: 1,
      title: 'Information We Collect',
      desc: 'We may collect your name, phone number, email address, billing and shipping address, order details and information necessary to process payments.'
    },
    {
      num: 2,
      title: 'How We Use Your Information',
      desc: 'We use personal information to process orders, arrange delivery, send order updates, respond to enquiries, improve our services and comply with applicable laws.'
    },
    {
      num: 3,
      title: 'Payments',
      desc: 'Payments may be processed by third-party payment providers. We do not intend to store complete payment card details on our own systems.'
    },
    {
      num: 4,
      title: 'Sharing of Information',
      desc: 'We may share necessary information with delivery partners, payment providers and service providers to fulfil orders or comply with legal obligations.'
    },
    {
      num: 5,
      title: 'Cookies',
      desc: 'Our website may use cookies or similar technologies to maintain website functionality and improve the customer experience.'
    },
    {
      num: 6,
      title: 'Data Security',
      desc: 'We take reasonable measures to protect personal information. However, no electronic storage or internet transmission system can be guaranteed to be completely secure.'
    },
    {
      num: 7,
      title: 'Data Retention',
      desc: 'We retain information for as long as necessary for order fulfilment, customer support, legal compliance and legitimate business purposes.'
    },
    {
      num: 8,
      title: 'Your Rights',
      desc: 'Subject to applicable law, you may request access to, correction of or deletion of your personal information, where applicable.'
    },
    {
      num: 9,
      title: 'Third-Party Services',
      desc: 'Third-party payment, analytics and delivery services may process information under their own privacy policies.'
    },
    {
      num: 10,
      title: 'Policy Updates',
      desc: 'We may update this policy when our practices or legal requirements change.'
    },
    {
      num: 11,
      title: 'Contact',
      desc: 'For privacy-related requests, contact LEAFORA LIFE SCIENCES PRIVATE LIMITED using the official contact details published on our website.'
    }
  ];

  return (
    <div className="policy-page-wrapper">
      <SEO 
        title="Privacy Policy | LeafOra Life Sciences"
        description="Official Privacy Policy of LeafOra Life Sciences Private Limited. Understand how we collect, protect, and handle your data and payments."
        canonicalUrl="https://leaforalifescience.com/privacy-policy"
      />

      {/* Hero Banner */}
      <section className="policy-hero-banner">
        <div className="policy-hero-badge">
          <ShieldCheck size={14} /> Data Protection & Privacy
        </div>
        <h1 className="policy-hero-title">Privacy Policy</h1>
        <p className="policy-hero-subtitle">
          LEAFORA LIFE SCIENCES PRIVATE LIMITED respects your privacy and is committed to protecting the personal information you provide through our website.
        </p>
      </section>

      {/* Policy Navigation Tabs */}
      <div className="policy-tabs-bar">
        <Link to="/terms-and-conditions" className="policy-tab-link">
          <FileText size={15} /> Terms & Conditions
        </Link>
        <Link to="/shipping-policy" className="policy-tab-link">
          <Truck size={15} /> Shipping & Delivery
        </Link>
        <Link to="/privacy-policy" className="policy-tab-link active">
          <ShieldCheck size={15} /> Privacy Policy
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="policy-content-container">
        <div className="policy-card">
          <div className="policy-header-row">
            <div>
              <h2 className="policy-company-title">Privacy Policy</h2>
              <p className="policy-company-sub">LEAFORA LIFE SCIENCES PRIVATE LIMITED • Customer Data Privacy Protection</p>
            </div>
            <span style={{ fontSize: '0.82rem', background: '#ECFDF5', color: '#065F46', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Lock size={12} /> 256-Bit SSL Encrypted
            </span>
          </div>

          <div className="policy-intro-box">
            <strong>LEAFORA LIFE SCIENCES PRIVATE LIMITED respects your privacy</strong> and is committed to protecting the personal information you provide through our website.
          </div>

          <div className="policy-sections-list">
            {privacyPoints.map((item) => (
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
            <ShieldCheck size={18} color="#1A3E2F" />
            <span>For privacy-related requests, contact LEAFORA LIFE SCIENCES PRIVATE LIMITED using the official contact details published on our website.</span>
          </div>

          {/* Concierge Help Card */}
          <div className="policy-concierge-card">
            <div className="policy-concierge-info">
              <h4>Privacy Officer & Data Grievance</h4>
              <p>For data inquiries, access requests, or privacy concerns, write to our compliance team.</p>
            </div>
            <div className="policy-concierge-btns">
              <a href="mailto:care@leaforalifescience.com" className="policy-btn-contact">
                <Mail size={15} /> care@leaforalifescience.com
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
