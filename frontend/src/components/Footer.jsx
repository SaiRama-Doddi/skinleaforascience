import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import leaforaLogo from '../assets/leafora-logo.png';
import './Footer.css';

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
    <footer className="leafora-footer">
      <div className="footer-container">
        <div className="footer-main-grid">
          
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo-wrap" aria-label="Leafora Life Sciences Home">
              <img 
                src={leaforaLogo} 
                alt="Leafora Life Sciences Logo" 
                className="footer-logo-img"
              />
            </Link>

            <p className="footer-brand-tagline">
              Pure bio-botanical skincare engineered to nurture radiant, healthy skin with zero chemical compromises.
            </p>

            <div className="footer-social-row">
              {socialLinks.map((item) => (
                <a 
                  key={item.name}
                  href={item.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.name}
                  className="footer-social-btn"
                  style={{ background: item.bg, color: item.color }}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-col-title">Shop Collections</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/products" className="footer-link-item">All Essentials</Link>
              </li>
              <li>
                <Link to="/products?category=Face Wash" className="footer-link-item">Gentle Cleansers</Link>
              </li>
              <li>
                <Link to="/products?category=Face Serum" className="footer-link-item">Brightening Serums</Link>
              </li>
              <li>
                <Link to="/products?category=Sunscreen" className="footer-link-item">Sun Protection (SPF 50)</Link>
              </li>
              <li>
                <Link to="/about" className="footer-link-item">Our Story & Science</Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/shipping-policy" className="footer-link-item">Shipping & Delivery Policy</Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="footer-link-item">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="footer-link-item">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link-item">Help & Concierge Support</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="footer-col-title">Botanical Concierge</h4>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <Mail size={16} className="footer-contact-icon" />
                <a href="mailto:care@leaforalifescience.com" className="footer-contact-link">
                  care@leaforalifescience.com
                </a>
              </div>
              <div className="footer-contact-item">
                <Phone size={16} className="footer-contact-icon" /> 
                <a 
                  href="https://wa.me/917984915600" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="footer-contact-link"
                >
                  +91 79849 15600 (WhatsApp)
                </a>
              </div>
              <div className="footer-contact-item">
                <MapPin size={16} className="footer-contact-icon" /> 
                <span>
                  28 HARIKRISHNA SOCIETY, NEAR PASHWANATH TOWNSHEEP, Nikol, Ahmedabad - 382350, Gujarat
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-copy">
            © {new Date().getFullYear()} <strong>Leafora Life Sciences</strong>. All rights reserved. Premium Organic Skincare.
          </div>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy" className="footer-bottom-link">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="footer-bottom-link">Terms & Conditions</Link>
            <Link to="/shipping-policy" className="footer-bottom-link">Shipping & Delivery</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
