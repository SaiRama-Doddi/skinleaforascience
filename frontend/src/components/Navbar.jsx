import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Activity, Database, Server } from 'lucide-react';
import { checkHealth } from '../services/api';

export default function Navbar() {
  const [apiStatus, setApiStatus] = useState('checking');
  const location = useLocation();

  useEffect(() => {
    checkHealth()
      .then((res) => {
        if (res?.success) {
          setApiStatus('connected');
        } else {
          setApiStatus('offline');
        }
      })
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', padding: 8, borderRadius: 10, display: 'flex' }}>
            <Leaf size={24} color="#042f2e" />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            Leafora <span className="gradient-text">Life Science</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link 
            to="/" 
            style={{ 
              color: location.pathname === '/' ? '#34d399' : '#94a3b8', 
              textDecoration: 'none', 
              fontWeight: 500 
            }}
          >
            Home
          </Link>
          <Link 
            to="/products" 
            style={{ 
              color: location.pathname === '/products' ? '#34d399' : '#94a3b8', 
              textDecoration: 'none', 
              fontWeight: 500 
            }}
          >
            Products
          </Link>

          <Link 
            to="/admin/login" 
            style={{ 
              color: location.pathname.startsWith('/admin') ? '#34d399' : '#38bdf8', 
              textDecoration: 'none', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            Admin Portal
          </Link>

          {/* Backend Connection Indicator */}
          <div className="status-pill">
            <span className="status-dot" style={{ backgroundColor: apiStatus === 'connected' ? '#10b981' : '#f43f5e' }}></span>
            <span>API {apiStatus === 'connected' ? 'Connected' : 'Offline'}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
