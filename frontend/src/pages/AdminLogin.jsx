import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminLogin.css';
import { adminSendOtp, adminVerifyOtp } from '../services/api';
import {
  ShieldCheck, Mail, KeyRound, ArrowRight, ArrowLeft,
  Package, ClipboardList, Users, BarChart2, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

export default function AdminLogin() {
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP
  const [email, setEmail] = useState('hkahir46@gmail.com');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await adminSendOtp(email);
      if (res && res.success) {
        setMessage(`OTP sent successfully to ${email}. Please check your inbox.`);
        setStep(2);
      } else {
        setError(res?.message || 'Failed to send OTP. Please check your admin email.');
      }
    } catch (err) {
      setError(err.message || 'Error sending OTP. Make sure backend server is online.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await adminVerifyOtp(email, otp);
      if (res && res.success) {
        localStorage.setItem('leafora_admin_token', res.token);
        if (res.user) {
          localStorage.setItem('leafora_admin_user', JSON.stringify(res.user));
        }
        setMessage('Verification successful! Redirecting to Admin Dashboard...');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 800);
      } else {
        setError(res?.message || 'Invalid OTP code. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leafora-login-page">
      {/* ─── LEFT PANEL (BRAND & PRODUCT SHOWCASE) ─── */}
      <div className="leafora-login-left">
        <div className="leafora-left-head">
          {/* Brand Logo Header */}
          <div className="leafora-brand-row">
            <svg className="leafora-brand-logo-icon" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="loginLeafGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#C5A059" />
                  <stop offset="100%" stopColor="#8C6A3C" />
                </linearGradient>
              </defs>
              <path d="M50 15C50 15 25 35 25 60C25 73.8 36.2 85 50 85C63.8 85 75 73.8 75 60C75 35 50 15 50 15Z" fill="url(#loginLeafGold)" />
              <path d="M50 15C50 15 38 40 38 60C38 70 43 78 50 85C57 78 62 70 62 60C62 40 50 15 50 15Z" fill="#FDFBF7" fillOpacity="0.25" />
              <path d="M50 15V85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="leafora-brand-title">LeafOra</span>
              <span className="leafora-brand-sub">LIFE SCIENCES</span>
            </div>
          </div>

          <div className="leafora-headline-group">
            <div className="leafora-headline-rule"></div>
            <h1 className="leafora-main-headline">
              Pure Care.<br />
              Stronger Tomorrows.
            </h1>
            <p className="leafora-main-subtext">
              Natural skincare, powered by science.<br />
              Now in your hands — and in better control<br />
              with our admin panel.
            </p>
          </div>

          {/* 4 Feature Icons Grid */}
          <div className="leafora-features-grid">
            <div className="leafora-feature-item">
              <div className="leafora-feature-icon-box">
                <Package size={18} />
              </div>
              <span className="leafora-feature-text">Manage Products</span>
            </div>

            <div className="leafora-feature-item">
              <div className="leafora-feature-icon-box">
                <ClipboardList size={18} />
              </div>
              <span className="leafora-feature-text">Track Orders</span>
            </div>

            <div className="leafora-feature-item">
              <div className="leafora-feature-icon-box">
                <Users size={18} />
              </div>
              <span className="leafora-feature-text">View Customers</span>
            </div>

            <div className="leafora-feature-item">
              <div className="leafora-feature-icon-box">
                <BarChart2 size={18} />
              </div>
              <span className="leafora-feature-text">Grow Your Business</span>
            </div>
          </div>
        </div>

        {/* Hero Skincare Product Display */}
        <div className="leafora-hero-img-wrap">
          <img 
            src="/assets/hydra_glow_moisturizer.jpg" 
            alt="LeafOra Skincare Products" 
            className="leafora-hero-img" 
          />
        </div>

        {/* Bottom Tagline */}
        <div className="leafora-left-footer">
          <span className="leafora-bottom-tagline">GOOD SKIN BRIGHTER TOMORROWS</span>
          <div className="leafora-bottom-rule"></div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (ADMIN LOGIN CARD) ─── */}
      <div className="leafora-login-right">
        {/* Back to Website Link */}
        <Link to="/" className="leafora-back-link">
          <ArrowLeft size={16} />
          <span>Back to Website</span>
        </Link>

        {/* Login White Card */}
        <div className="leafora-login-card">
          {/* Card Top Logo */}
          <div className="leafora-card-brand-logo">
            <svg viewBox="0 0 100 100" fill="none" style={{ width: 36, height: 36 }}>
              <path d="M50 15C50 15 25 35 25 60C25 73.8 36.2 85 50 85C63.8 85 75 73.8 75 60C75 35 50 15 50 15Z" fill="url(#loginLeafGold)" />
              <path d="M50 15V85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#A37F3F', lineHeight: 1.1 }}>LeafOra</span>
              <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.18em', color: '#8C8275' }}>LIFE SCIENCES</span>
            </div>
          </div>

          <h2 className="leafora-card-title">Admin Login</h2>
          <p className="leafora-card-subtitle">
            {step === 1 
              ? 'Enter your email to receive a secure OTP' 
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>

          {/* Feedback Alerts */}
          {error && (
            <div className="leafora-alert-box error">
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="leafora-alert-box success">
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{message}</span>
            </div>
          )}

          {/* STEP 1: EMAIL ADDRESS FORM */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="leafora-login-form">
              <div className="leafora-field-group">
                <label className="leafora-field-label">Email Address</label>
                <div className="leafora-field-input-wrap">
                  <Mail className="leafora-field-icon" />
                  <input
                    type="email"
                    className="leafora-input-text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@leafora.com"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="leafora-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP INPUT FORM (SHOWN AFTER OTP IS SENT) */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="leafora-login-form">
              <div className="leafora-field-group">
                <label className="leafora-field-label">Enter 6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="leafora-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                />
                
                <div className="leafora-resend-row">
                  <span style={{ color: '#6B7280' }}>Didn't receive code?</span>
                  <button 
                    type="button" 
                    className="leafora-resend-btn"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>

              <button type="submit" className="leafora-submit-btn" disabled={loading || otp.length < 6}>
                {loading ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP & Access Dashboard <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: 12,
                  cursor: 'pointer',
                  marginTop: 4,
                  textDecoration: 'underline'
                }}
                onClick={() => { setStep(1); setOtp(''); setError(null); setMessage(null); }}
              >
                Change email address
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="leafora-divider">or</div>

          {/* Secure Access Info Box */}
          <div className="leafora-secure-box">
            <ShieldCheck className="leafora-secure-icon" size={20} />
            <div>
              <div className="leafora-secure-title">Secure Access</div>
              <div className="leafora-secure-desc">
                We'll send a one-time password (OTP) to your email for secure and safe login.
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="leafora-card-footer">
            Need help? Contact <a href="mailto:support@leafora.com">support@leafora.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
