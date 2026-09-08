import React, { useState } from 'react';
import { Package, ArrowRight, Tag, Image as ImageIcon } from 'lucide-react';

export default function ProductCard({ product }) {
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image_url || '/assets/vitamin_c_serum.jpg'];

  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const currentImg = images[selectedImgIndex] || images[0] || '/assets/vitamin_c_serum.jpg';

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: 20, 
        transition: 'all 0.3s ease', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        height: '100%'
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-mint)', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
            {product.category || 'Biotech'}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag size={12} /> ID: #{product.id}
          </span>
        </div>

        {/* Product Image Display & Gallery Selector */}
        <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 10, overflow: 'hidden', marginBottom: 14, background: '#111827' }}>
          <img 
            src={currentImg} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }} 
          />
          {images.length > 1 && (
            <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ImageIcon size={10} /> {images.length} Images
            </span>
          )}
        </div>

        {/* 4 to 5 Thumbnails Bar */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Thumb ${idx + 1}`}
                onClick={() => setSelectedImgIndex(idx)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: selectedImgIndex === idx ? '2px solid #34D399' : '1px solid rgba(255,255,255,0.2)',
                  opacity: selectedImgIndex === idx ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        )}

        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>{product.name}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          {product.description || 'Pharma grade formulation produced under high precision laboratory environments.'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Unit Price</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-emerald)' }}>
            ₹{Number(product.price).toFixed(2)}
          </span>
        </div>

        <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          Details <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
