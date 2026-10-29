import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, FileText, CheckCircle2, Clock, MapPin, AlertTriangle, PackageX, Mail, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import './PolicyPages.css';

export default function ShippingPolicy() {
  const shippingPoints = [
    {
      icon: Clock,
      title: 'Order Processing',
      desc: 'Orders are processed after successful payment or order confirmation, as applicable.'
    },
    {
      icon: Truck,
      title: 'Estimated Delivery',
      desc: 'The estimated delivery date will be shown at checkout or communicated through the order confirmation. Actual delivery time may vary depending on the delivery location and courier service.'
    },
    {
      icon: CheckCircle2,
      title: 'Shipping Charges',
      desc: 'Applicable shipping charges, if any, will be displayed at checkout.'
    },
    {
      icon: MapPin,
      title: 'Order Tracking',
      desc: 'Where tracking is available, customers can use the tracking information shared after dispatch.'
    },
    {
      icon: AlertTriangle,
      title: 'Delivery Delays',
      desc: 'Delivery may be delayed due to weather, courier issues, public holidays or other circumstances beyond our control.'
    },
    {
      icon: MapPin,
      title: 'Incorrect Address',
      desc: 'Customers are responsible for providing a complete and accurate shipping address.'
    },
    {
      icon: PackageX,
      title: 'Damaged or Incorrect Orders',
      desc: 'Please contact our support team if an order arrives damaged or contains an incorrect item.'
    }
  ];

  return (
    <div className="policy-page-wrapper">
      <SEO 
        title="Shipping & Delivery Policy | LeafOra Life Sciences"
        description="Official Shipping and Delivery policy for LeafOra Life Sciences orders across India. Timelines, tracking, processing and courier policies."
        canonicalUrl="https://leaforalifescience.com/shipping-policy"
      />

      {/* Hero Banner */}
      <section className="policy-hero-banner">
        <div className="policy-hero-badge">
          <Truck size={14} /> Dispatch & Fulfilment
        </div>
        <h1 className="policy-hero-title">Shipping & Delivery Policy</h1>
        <p className="policy-hero-subtitle">
          At LeafOra, we aim to process and deliver orders as efficiently as possible. Learn about our packaging standards, shipping timelines and delivery guidelines.
        </p>
      </section>

      {/* Policy Navigation Tabs */}
      <div className="policy-tabs-bar">
        <Link to="/terms-and-conditions" className="policy-tab-link">
          <FileText size={15} /> Terms & Conditions
        </Link>
        <Link to="/shipping-policy" className="policy-tab-link active">
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
              <h2 className="policy-company-title">LeafOra Shipping & Fulfilment Service</h2>
              <p className="policy-company-sub">Fast & Safe Botanical Packaging • Pan-India Courier Network</p>
            </div>
            <span style={{ fontSize: '0.82rem', background: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
              Standard Delivery: 2–5 Business Days
            </span>
          </div>

          <div className="policy-intro-box">
            <strong>At LeafOra, we aim to process and deliver orders as efficiently as possible.</strong>
            <br />
            Every shipment is packed in eco-friendly protective materials to preserve the purity of botanical ingredients during transit.
          </div>

          <div className="policy-sections-list">
            {shippingPoints.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="policy-section-item">
                  <div className="policy-num-badge" style={{ background: '#C58A2A' }}>
                    <IconComp size={16} />
                  </div>
                  <div className="policy-item-content">
                    <h3 className="policy-item-title">{item.title}</h3>
                    <p className="policy-item-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="policy-legal-footnote">
            <Truck size={18} color="#1A3E2F" />
            <span>For assistance, use the contact details published on the LeafOra website.</span>
          </div>

          {/* Concierge Help Card */}
          <div className="policy-concierge-card">
            <div className="policy-concierge-info">
              <h4>Need to Track an Order or Update Address?</h4>
              <p>Contact our customer care concierge with your Order ID for real-time dispatch status.</p>
            </div>
            <div className="policy-concierge-btns">
              <a href="mailto:care@leaforalifescience.com" className="policy-btn-contact">
                <Mail size={15} /> care@leaforalifescience.com
              </a>
              <a href="https://wa.me/917984915600" target="_blank" rel="noreferrer" className="policy-btn-whatsapp">
                <MessageSquare size={15} /> WhatsApp Dispatch
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
