import React from 'react';
import { Leaf, ShieldCheck, Heart, Mail, Phone, MapPin, Globe, Share2, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#FAF7F2', borderTop: '1px solid #EFE8DE', paddingTop: 60, paddingBottom: 40, color: '#2D3748' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 48 }}>
          
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#A67C52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Leaf size={20} />
              </div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#2D3748' }}>
                Leafora
              </span>
            </div>

            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
              Pure bio-botanical skincare engineered to nurture radiant, healthy skin with zero chemical compromises.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://instagram.com" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EFE8DE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A67C52' }}>
                <Globe size={18} />
              </a>
              <a href="https://facebook.com" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EFE8DE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A67C52' }}>
                <Share2 size={18} />
              </a>
              <a href="https://twitter.com" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EFE8DE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A67C52' }}>
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: '#2D3748', marginBottom: 20 }}>
              Shop Collections
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', color: '#64748B' }}>
              <li><a href="#bestsellers" style={{ color: 'inherit', textDecoration: 'none' }}>Bestselling Serums</a></li>
              <li><a href="#creams" style={{ color: 'inherit', textDecoration: 'none' }}>Nourishing Creams</a></li>
              <li><a href="#cleansers" style={{ color: 'inherit', textDecoration: 'none' }}>Gentle Cleansers</a></li>
              <li><a href="#toners" style={{ color: 'inherit', textDecoration: 'none' }}>Hydrating Toners</a></li>
              <li><a href="#flash-sale" style={{ color: 'inherit', textDecoration: 'none' }}>Flash Sale Deals</a></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: '#2D3748', marginBottom: 20 }}>
              Customer Care
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', color: '#64748B' }}>
              <li><a href="#track" style={{ color: 'inherit', textDecoration: 'none' }}>Track Your Order</a></li>
              <li><a href="#returns" style={{ color: 'inherit', textDecoration: 'none' }}>30-Day Money Back Guarantee</a></li>
              <li><a href="#shipping" style={{ color: 'inherit', textDecoration: 'none' }}>Free Shipping Details</a></li>
              <li><a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Skincare FAQs</a></li>
              <li><a href="/admin" style={{ color: '#A67C52', fontWeight: 600, textDecoration: 'none' }}>Admin Console</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: '#2D3748', marginBottom: 20 }}>
              Botanical Care Concierge
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem', color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="#A67C52" /> care@leaforalifescience.com
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color="#A67C52" /> +1 (800) 532-3672
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={16} color="#A67C52" /> Leafora Botanical Labs, CA, USA
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid #EFE8DE', paddingTop: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: '0.85rem', color: '#64748B' }}>
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
