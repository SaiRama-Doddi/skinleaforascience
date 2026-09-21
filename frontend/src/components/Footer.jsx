import React from 'react';
import { ShieldCheck, Heart, Mail, Phone, MapPin } from 'lucide-react';
import leaforaLogo from '../assets/leafora-logo.png';

const socialLinks = [
  {
    name: 'Instagram',
    url: 'https://instagram.com',
    bg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    color: '#FFFFFF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    )
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com',
    bg: '#1877F2',
    color: '#FFFFFF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  },
  {
    name: 'X (Twitter)',
    url: 'https://twitter.com',
    bg: '#000000',
    color: '#FFFFFF',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com',
    bg: '#FF0000',
    color: '#FFFFFF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    bg: '#0077B5',
    color: '#FFFFFF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.64a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
      </svg>
    )
  }
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0F3B2E', borderTop: '1px solid rgba(197, 138, 42, 0.25)', paddingTop: 60, paddingBottom: 40, color: '#FFFFFF' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 48 }}>
          
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img 
                src={leaforaLogo} 
                alt="Leafora Life Sciences Logo" 
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
              />
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF' }}>
                Leafora
              </span>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
              Pure bio-botanical skincare engineered to nurture radiant, healthy skin with zero chemical compromises.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {socialLinks.map((item) => (
                <a 
                  key={item.name}
                  href={item.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.name}
                  style={{ 
                    width: 38, 
                    height: 38, 
                    borderRadius: '50%', 
                    background: item.bg, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: item.color,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.08)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                  }}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 20 }}>
              Shop Collections
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <li><a href="#bestsellers" style={{ color: 'inherit', textDecoration: 'none' }}>Bestselling Serums</a></li>
              <li><a href="#creams" style={{ color: 'inherit', textDecoration: 'none' }}>Nourishing Creams</a></li>
              <li><a href="#cleansers" style={{ color: 'inherit', textDecoration: 'none' }}>Gentle Cleansers</a></li>
              <li><a href="#toners" style={{ color: 'inherit', textDecoration: 'none' }}>Hydrating Toners</a></li>
              <li><a href="#flash-sale" style={{ color: 'inherit', textDecoration: 'none' }}>Flash Sale Deals</a></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 20 }}>
              Customer Care
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <li><a href="#track" style={{ color: 'inherit', textDecoration: 'none' }}>Track Your Order</a></li>
              <li><a href="#returns" style={{ color: 'inherit', textDecoration: 'none' }}>30-Day Money Back Guarantee</a></li>
              <li><a href="#shipping" style={{ color: 'inherit', textDecoration: 'none' }}>Free Shipping Details</a></li>
              <li><a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Skincare FAQs</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 20 }}>
              Botanical Care Concierge
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="#C58A2A" /> care@leaforalifescience.com
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color="#C58A2A" /> 
                <a href="https://wa.me/917984915600" target="_blank" rel="noreferrer" style={{ color: '#FFFFFF', textDecoration: 'none' }}>
                  +91 79849 15600 (WhatsApp)
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={16} color="#C58A2A" style={{ marginTop: 3, flexShrink: 0 }} /> 
                <span style={{ lineHeight: 1.5 }}>
                  28 HARIKRISHNA SOCIETY, NEAR PASHWANATH TOWNSHEEP, Nikol, Ahmedabad- 382350, Gujarat
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)' }}>
          <div>
            © {new Date().getFullYear()} <strong>Leafora Life Science</strong>. All rights reserved. Premium Organic Skincare.
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookies Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
