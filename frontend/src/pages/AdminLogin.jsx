import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Mail, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, RefreshCw, KeyRound
} from 'lucide-react';
import leaforaLogo from '../assets/leafora-logo.png';
import { adminSendOtp, adminVerifyOtp } from '../services/api';
import './AdminLogin.css';

export default function AdminLogin() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
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
    <div className="admin-login-wrapper">
      {/* Top Back Link */}
      <Link to="/" className="admin-back-btn">
        <ArrowLeft size={16} />
        <span>Back to Store</span>
      </Link>

      {/* Centered Luxury Login Card */}
      <div className="admin-login-card">
        {/* Brand Logo */}
        <div className="admin-logo-box">
          <img src={leaforaLogo} alt="LeafOra Life Sciences" className="admin-logo-img" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="admin-card-title">Admin Login</h1>
        <p className="admin-card-subtitle">
          {step === 1 
            ? 'Enter your email to receive a secure OTP' 
            : `Enter the 6-digit OTP code sent to ${email}`}
        </p>

        {/* Feedback Alerts */}
        {error && (
          <div className="admin-alert-box error" role="alert">
            <AlertCircle size={18} className="admin-alert-icon" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="admin-alert-box success" role="status">
            <CheckCircle2 size={18} className="admin-alert-icon" />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="admin-login-form">
            <div className="admin-form-group">
              <label htmlFor="adminEmail" className="admin-form-label">Email Address</label>
              <div className="admin-input-wrap">
                <Mail className="admin-input-icon" size={18} />
                <input
                  id="adminEmail"
                  type="email"
                  className="admin-input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@leaforalifescience.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button type="submit" className="admin-primary-btn" disabled={loading || !email}>
              {loading ? (
                <>
                  <RefreshCw className="spin-icon" size={16} />
                  <span>Sending Secure OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight size={17} strokeWidth={2.2} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="admin-login-form">
            <div className="admin-form-group">
              <label htmlFor="adminOtp" className="admin-form-label">Enter 6-Digit OTP Code</label>
              <div className="admin-input-wrap">
                <KeyRound className="admin-input-icon" size={18} />
                <input
                  id="adminOtp"
                  type="text"
                  maxLength={6}
                  className="admin-input-field admin-otp-field"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              <div className="admin-resend-row">
                <span className="admin-resend-text">Didn't receive code?</span>
                <button 
                  type="button" 
                  className="admin-resend-link"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </div>

            <button type="submit" className="admin-primary-btn" disabled={loading || otp.length < 6}>
              {loading ? (
                <>
                  <RefreshCw className="spin-icon" size={16} />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Sign In</span>
                  <ArrowRight size={17} strokeWidth={2.2} />
                </>
              )}
            </button>

            <button
              type="button"
              className="admin-change-email-btn"
              onClick={() => { setStep(1); setOtp(''); setError(null); setMessage(null); }}
            >
              Use a different email address
            </button>
          </form>
        )}

        {/* Security Note */}
        <div className="admin-security-note">
          <ShieldCheck size={18} className="admin-security-icon" />
          <span>Protected with Two-Factor OTP Verification</span>
        </div>

        {/* Card Footer */}
        <div className="admin-card-footer">
          Need help? Contact <a href="mailto:care@leaforalifescience.com">care@leaforalifescience.com</a>
        </div>
      </div>
    </div>
  );
}
