import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, CheckCircle2, 
  AlertCircle, ArrowRight, Sparkles, Check, ChevronLeft, KeyRound, 
  Leaf, RefreshCw, Award, Star
} from 'lucide-react';
import { userLogin, userRegister, userForgotPassword, userResetPassword } from '../services/api';
import './AuthPage.css';

export default function AuthPage({ initialMode = 'login', onAuthSuccess, isModal = false, onClose }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Active screen mode: 'login' | 'signup' | 'forgot' | 'reset'
  const modeParam = searchParams.get('mode');
  const [mode, setMode] = useState(modeParam || initialMode);

  // Form input states
  const [loginForm, setLoginForm] = useState({
    email: localStorage.getItem('leafora_remember_email') || '',
    password: '',
    remember_me: localStorage.getItem('leafora_remember_me') === 'true'
  });

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    terms_accepted: false
  });

  const [forgotForm, setForgotForm] = useState({
    email: '',
    otp: '',
    new_password: '',
    confirm_new_password: '',
    step: 1 // 1: Request OTP, 2: Reset Password
  });

  // UI State Controls
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    if (modeParam && ['login', 'signup', 'forgot'].includes(modeParam)) {
      setMode(modeParam);
    }
  }, [modeParam]);

  // Password Strength Evaluation Engine
  const evaluatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#E2E8F0', percent: 0, checks: { length: false, uppercase: false, number: false, symbol: false } };
    
    const checks = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass),
      symbol: /[^A-Za-z0-9]/.test(pass)
    };

    let score = 0;
    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.symbol) score++;

    let label = 'Weak';
    let color = '#EF4444'; // Red
    let percent = 25;

    if (score === 2) {
      label = 'Fair';
      color = '#F59E0B'; // Amber/Orange
      percent = 50;
    } else if (score === 3) {
      label = 'Good';
      color = '#10B981'; // Emerald
      percent = 75;
    } else if (score === 4) {
      label = 'Excellent';
      color = '#059669'; // Forest Green
      percent = 100;
    }

    return { score, label, color, percent, checks };
  };

  const signupStrength = evaluatePasswordStrength(signupForm.password);
  const resetStrength = evaluatePasswordStrength(forgotForm.new_password);

  // 1. HANDLE LOGIN SUBMIT
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!loginForm.email || !loginForm.password) {
      setAlert({ type: 'error', text: 'Please fill in both email and password.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userLogin(loginForm);
      const data = res.data;

      if (data && data.success) {
        // Save remember me preference
        if (loginForm.remember_me) {
          localStorage.setItem('leafora_remember_email', loginForm.email);
          localStorage.setItem('leafora_remember_me', 'true');
        } else {
          localStorage.removeItem('leafora_remember_email');
          localStorage.removeItem('leafora_remember_me');
        }

        // Save Auth Session
        if (data.token) {
          localStorage.setItem('leafora_user_token', data.token);
          localStorage.setItem('leafora_user_profile', JSON.stringify(data.user));
        }

        setAlert({ type: 'success', text: data.message || 'Login successful! Welcome back.' });

        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(data.user);
          if (onClose) onClose();
          if (!isModal) navigate('/');
        }, 800);
      } else {
        setAlert({ type: 'error', text: data.message || 'Invalid email or password.' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your internet connection.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // 2. HANDLE SIGNUP SUBMIT
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setAlert({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    if (signupForm.password.length < 8) {
      setAlert({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (signupForm.password !== signupForm.confirm_password) {
      setAlert({ type: 'error', text: 'Passwords do not match. Please re-enter your password.' });
      return;
    }

    if (!signupForm.terms_accepted) {
      setAlert({ type: 'error', text: 'You must agree to the Terms of Service & Privacy Policy to register.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userRegister(signupForm);
      const data = res.data;

      if (data && data.success) {
        if (data.token) {
          localStorage.setItem('leafora_user_token', data.token);
          localStorage.setItem('leafora_user_profile', JSON.stringify(data.user));
        }

        setAlert({ type: 'success', text: data.message || 'Account created successfully!' });

        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(data.user);
          if (onClose) onClose();
          if (!isModal) navigate('/');
        }, 1000);
      } else {
        setAlert({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // 3. HANDLE FORGOT PASSWORD (REQUEST OTP)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!forgotForm.email) {
      setAlert({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userForgotPassword({ email: forgotForm.email });
      const data = res.data;

      if (data && data.success) {
        setAlert({ 
          type: 'success', 
          text: data.message || `An OTP code has been generated. Use OTP: ${data.demo_otp || '123456'}` 
        });
        setForgotForm(prev => ({ ...prev, step: 2, otp: data.demo_otp || '' }));
      } else {
        setAlert({ type: 'error', text: data.message || 'Email not found.' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error requesting password reset.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // 4. HANDLE RESET PASSWORD SUBMIT
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!forgotForm.otp || !forgotForm.new_password) {
      setAlert({ type: 'error', text: 'Please enter the OTP code and your new password.' });
      return;
    }

    if (forgotForm.new_password.length < 8) {
      setAlert({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (forgotForm.new_password !== forgotForm.confirm_new_password) {
      setAlert({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userResetPassword({
        email: forgotForm.email,
        otp: forgotForm.otp,
        new_password: forgotForm.new_password
      });
      const data = res.data;

      if (data && data.success) {
        setAlert({ type: 'success', text: 'Password reset successful! You can now log in.' });
        setTimeout(() => {
          setMode('login');
          setLoginForm(prev => ({ ...prev, email: forgotForm.email }));
        }, 1200);
      } else {
        setAlert({ type: 'error', text: data.message || 'Invalid OTP code.' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`leafora-auth-wrapper ${isModal ? 'is-modal' : ''}`}>
      {/* WHITE GLASSMORPHISM MAIN CARD */}
      <div className="leafora-auth-card">
        
        {/* LEFT AMBIENT BRANDING PANEL (DESKTOP) */}
        <div className="leafora-auth-banner">
          <div className="banner-overlay" />
          
          <div className="banner-header">
            <div className="banner-logo">
              <Leaf size={28} className="logo-icon" />
              <span>LEAFORA</span>
            </div>
            <span className="banner-badge">Botanical Science</span>
          </div>

          <div className="banner-content">
            <h2>Clinical Formulation Meets Organic Purity</h2>
            <p>Join over 120,000+ wellness enthusiasts accessing personalized skincare, exclusive rewards, and expert consultations.</p>

            <div className="banner-trust-pills">
              <div className="trust-pill">
                <ShieldCheck size={16} />
                <span>100% Dermatologist Approved</span>
              </div>
              <div className="trust-pill">
                <Sparkles size={16} />
                <span>Earn 100 Welcome Points</span>
              </div>
            </div>
          </div>

          <div className="banner-footer">
            <div className="review-badge">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>
              <span>4.9 / 5 Rating from 12k+ Verified Reviews</span>
            </div>
          </div>
        </div>

        {/* RIGHT FORM CONTAINER */}
        <div className="leafora-auth-form-panel">
          
          {/* TAB HEADER SWITCHER */}
          <div className="auth-tab-nav">
            <button
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setAlert(null); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setAlert(null); }}
            >
              Create Account
            </button>
          </div>

          {/* ALERT NOTIFICATION BAR */}
          {alert && (
            <div className={`auth-alert ${alert.type}`}>
              {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{alert.text}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 1. LOGIN FORM */}
          {/* ───────────────────────────────────────────────────────────── */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form-content">
              <div className="form-header">
                <h2>Welcome Back</h2>
                <p>Sign in to access your order history, wallet balance & rewards.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="input-field-wrapper">
                  <Mail size={18} className="field-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@domain.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-with-link">
                  <label className="form-label">Password *</label>
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => { setMode('forgot'); setAlert(null); }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-field-wrapper">
                  <Lock size={18} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={loginForm.remember_me}
                    onChange={(e) => setLoginForm({ ...loginForm, remember_me: e.target.checked })}
                  />
                  <span className="checkmark" />
                  <span className="checkbox-label">Remember me for 30 days</span>
                </label>
              </div>

              <button type="submit" className="submit-btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Account <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="social-auth-divider">
                <span>or continue with</span>
              </div>

              <div className="social-auth-grid">
                <button type="button" className="social-btn" onClick={() => setAlert({ type: 'success', text: 'Google Sign In connected!' })}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google
                </button>
                <button type="button" className="social-btn" onClick={() => setAlert({ type: 'success', text: 'Apple ID connected!' })}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.34c.67-.82 1.12-1.95.99-3.09-.97.04-2.14.65-2.83 1.46-.62.72-1.16 1.88-1.01 3 .09 0 2.18.04 2.85-1.37z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </form>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 2. SIGNUP FORM */}
          {/* ───────────────────────────────────────────────────────────── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="auth-form-content">
              <div className="form-header">
                <h2>Create Your Account</h2>
                <p>Join Leafora to get 100 Instant Bonus Points & exclusive perks.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-field-wrapper">
                  <User size={18} className="field-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Eleanor Vance"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div className="input-field-wrapper">
                    <Mail size={18} className="field-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@domain.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Phone (Optional)</label>
                  <div className="input-field-wrapper">
                    <Phone size={18} className="field-icon" />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 019-2834"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* PASSWORD WITH REAL-TIME STRENGTH INDICATOR */}
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-field-wrapper">
                  <Lock size={18} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Create a strong password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* PASSWORD STRENGTH METER BAR */}
                {signupForm.password && (
                  <div className="password-strength-box">
                    <div className="strength-bar-track">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: `${signupStrength.percent}%`,
                          backgroundColor: signupStrength.color
                        }}
                      />
                    </div>
                    
                    <div className="strength-info">
                      <span>Strength: <strong style={{ color: signupStrength.color }}>{signupStrength.label}</strong></span>
                      <span className="score-badge">{signupStrength.score} / 4</span>
                    </div>

                    {/* REQUIREMENT CHECKLIST */}
                    <div className="strength-checklist">
                      <div className={`check-item ${signupStrength.checks.length ? 'met' : ''}`}>
                        {signupStrength.checks.length ? <Check size={12} /> : <span className="dot" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`check-item ${signupStrength.checks.uppercase ? 'met' : ''}`}>
                        {signupStrength.checks.uppercase ? <Check size={12} /> : <span className="dot" />}
                        <span>One uppercase letter (A-Z)</span>
                      </div>
                      <div className={`check-item ${signupStrength.checks.number ? 'met' : ''}`}>
                        {signupStrength.checks.number ? <Check size={12} /> : <span className="dot" />}
                        <span>One number (0-9)</span>
                      </div>
                      <div className={`check-item ${signupStrength.checks.symbol ? 'met' : ''}`}>
                        {signupStrength.checks.symbol ? <Check size={12} /> : <span className="dot" />}
                        <span>One special symbol (@$!%*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="input-field-wrapper">
                  <Lock size={18} className="field-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat password"
                    value={signupForm.confirm_password}
                    onChange={(e) => setSignupForm({ ...signupForm, confirm_password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {signupForm.confirm_password && (
                  <div className={`password-match-indicator ${signupForm.password === signupForm.confirm_password ? 'match' : 'mismatch'}`}>
                    {signupForm.password === signupForm.confirm_password ? (
                      <>
                        <Check size={14} /> Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} /> Passwords do not match
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* TERMS & PRIVACY ACCEPTANCE */}
              <div className="form-options" style={{ marginTop: 12 }}>
                <label className="checkbox-container terms-checkbox">
                  <input
                    type="checkbox"
                    checked={signupForm.terms_accepted}
                    onChange={(e) => setSignupForm({ ...signupForm, terms_accepted: e.target.checked })}
                    required
                  />
                  <span className="checkmark" />
                  <span className="checkbox-label">
                    I agree to the <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Leafora Terms of Service: Premium organic formulations & buyer privacy protection guaranteed."); }}>Terms of Service</a> and <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Leafora Privacy Policy: Your data is encrypted and never sold to third parties."); }}>Privacy Policy</a>.
                  </span>
                </label>
              </div>

              <button type="submit" className="submit-btn-primary" disabled={loading} style={{ marginTop: 16 }}>
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    Create Free Account <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 3. FORGOT PASSWORD & RESET FLOW */}
          {/* ───────────────────────────────────────────────────────────── */}
          {mode === 'forgot' && (
            <div className="auth-form-content">
              <button className="back-btn" onClick={() => { setMode('login'); setAlert(null); }}>
                <ChevronLeft size={16} /> Back to Sign In
              </button>

              <div className="form-header">
                <h2>Reset Your Password</h2>
                <p>
                  {forgotForm.step === 1 
                    ? "Enter your registered email and we'll send a 6-digit OTP reset code."
                    : "Enter the 6-digit OTP code sent to your email and create a new password."}
                </p>
              </div>

              {forgotForm.step === 1 ? (
                <form onSubmit={handleForgotSubmit}>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <div className="input-field-wrapper">
                      <Mail size={18} className="field-icon" />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="name@domain.com"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn-primary" disabled={loading} style={{ marginTop: 12 }}>
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="spin" /> Sending OTP...
                      </>
                    ) : (
                      <>
                        Send Password Reset OTP <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit}>
                  <div className="form-group">
                    <label className="form-label">6-Digit OTP Code *</label>
                    <div className="input-field-wrapper">
                      <KeyRound size={18} className="field-icon" />
                      <input
                        type="text"
                        className="form-input otp-input"
                        placeholder="123456"
                        maxLength={6}
                        value={forgotForm.otp}
                        onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password *</label>
                    <div className="input-field-wrapper">
                      <Lock size={18} className="field-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter new password"
                        value={forgotForm.new_password}
                        onChange={(e) => setForgotForm({ ...forgotForm, new_password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* RESET PASSWORD STRENGTH */}
                    {forgotForm.new_password && (
                      <div className="password-strength-box">
                        <div className="strength-bar-track">
                          <div
                            className="strength-bar-fill"
                            style={{
                              width: `${resetStrength.percent}%`,
                              backgroundColor: resetStrength.color
                            }}
                          />
                        </div>
                        <div className="strength-info">
                          <span>Strength: <strong style={{ color: resetStrength.color }}>{resetStrength.label}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password *</label>
                    <div className="input-field-wrapper">
                      <Lock size={18} className="field-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Confirm new password"
                        value={forgotForm.confirm_new_password}
                        onChange={(e) => setForgotForm({ ...forgotForm, confirm_new_password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn-primary" disabled={loading} style={{ marginTop: 12 }}>
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="spin" /> Resetting Password...
                      </>
                    ) : (
                      <>
                        Update Password & Sign In <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* FOOTER PRIVACY NOTE */}
          <div className="auth-footer-note">
            <ShieldCheck size={14} />
            <span>256-Bit SSL Encryption • Your data is protected</span>
          </div>

        </div>
      </div>
    </div>
  );
}
