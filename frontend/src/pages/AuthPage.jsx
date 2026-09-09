import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, CheckCircle2,
  AlertCircle, ArrowRight, Sparkles, Check, ChevronLeft, KeyRound,
  Leaf, RefreshCw, Award, Heart, Shield, Users
} from 'lucide-react';
import { userLogin, userRegister, userForgotPassword, userResetPassword } from '../services/api';
import loginProductImg from '../assets/login_botanical_products.jpg';
import './AuthPage.css';

export default function AuthPage({ initialMode = 'login', onAuthSuccess, isModal = false, onClose }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const modeParam = searchParams.get('mode');
  const [mode, setMode] = useState(modeParam || initialMode);
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // Form input states
  const [loginForm, setLoginForm] = useState({
    email: localStorage.getItem('leafora_remember_email') || '',
    password: '',
    remember_me: localStorage.getItem('leafora_remember_me') === 'true'
  });

  const [signupForm, setSignupForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
    confirm_password: '',
    terms_accepted: true
  });

  const [forgotForm, setForgotForm] = useState({
    email: '',
    otp: '',
    new_password: '',
    confirm_new_password: '',
    step: 1
  });

  // UI State Controls
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (modeParam && ['login', 'signup', 'forgot'].includes(modeParam)) {
      setMode(modeParam);
    }
  }, [modeParam]);

  // 1. HANDLE LOGIN SUBMIT
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!loginForm.email || !loginForm.password) {
      setAlert({ type: 'error', text: 'Please enter both your email address and password.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userLogin(loginForm);
      const data = res?.data || res;

      if (data && data.success) {
        if (loginForm.remember_me) {
          localStorage.setItem('leafora_remember_email', loginForm.email);
          localStorage.setItem('leafora_remember_me', 'true');
        } else {
          localStorage.removeItem('leafora_remember_email');
          localStorage.removeItem('leafora_remember_me');
        }

        if (data.token) {
          localStorage.setItem('leafora_user_token', data.token);
          localStorage.setItem('leafora_user_profile', JSON.stringify(data.user));
        }

        setAlert({ type: 'success', text: data.message || 'Login successful! Welcome back.' });

        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(data.user);
          if (onClose) onClose();
          if (!isModal) navigate(redirectUrl);
        }, 600);
      } else {
        setAlert({ type: 'error', text: data?.message || 'Invalid email or password.' });
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Login failed. Please check your credentials.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // 2. HANDLE SIGNUP SUBMIT
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!signupForm.first_name || !signupForm.email || !signupForm.password) {
      setAlert({ type: 'error', text: 'First name, email address, and password are required.' });
      return;
    }

    if (signupForm.password !== signupForm.confirm_password) {
      setAlert({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (signupForm.password.length < 6) {
      setAlert({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userRegister(signupForm);
      const data = res?.data || res;

      if (data && data.success) {
        if (data.token) {
          localStorage.setItem('leafora_user_token', data.token);
          localStorage.setItem('leafora_user_profile', JSON.stringify(data.user));
        }

        setAlert({ type: 'success', text: data.message || 'Account created successfully! Welcome to Leafora.' });

        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(data.user);
          if (onClose) onClose();
          if (!isModal) navigate(redirectUrl);
        }, 800);
      } else {
        setAlert({ type: 'error', text: data?.message || 'Registration failed. Try a different email.' });
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Error registering account. Please try again.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // 3. HANDLE FORGOT PASSWORD - REQUEST OTP
  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!forgotForm.email) {
      setAlert({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userForgotPassword({ email: forgotForm.email });
      const data = res?.data || res;

      if (data && data.success) {
        setAlert({ type: 'success', text: 'Password reset OTP sent to your email address.' });
        setForgotForm(prev => ({ ...prev, step: 2 }));
      } else {
        setAlert({ type: 'error', text: data?.message || 'Email not found.' });
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to send OTP.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // 4. HANDLE FORGOT PASSWORD - RESET WITH OTP
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!forgotForm.otp || !forgotForm.new_password) {
      setAlert({ type: 'error', text: 'Please enter the OTP and your new password.' });
      return;
    }

    if (forgotForm.new_password !== forgotForm.confirm_new_password) {
      setAlert({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await userResetPassword({
        email: forgotForm.email,
        otp: forgotForm.otp,
        new_password: forgotForm.new_password
      });
      const data = res?.data || res;

      if (data && data.success) {
        setAlert({ type: 'success', text: 'Password reset successful! Please sign in with your new password.' });
        setTimeout(() => {
          setMode('login');
          setLoginForm(prev => ({ ...prev, email: forgotForm.email }));
        }, 1000);
      } else {
        setAlert({ type: 'error', text: data?.message || 'Invalid OTP code.' });
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to reset password.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`leafora-auth-page-container ${isModal ? 'is-modal-view' : ''}`}>

      {/* ─── MAIN TWO-COLUMN LAYOUT ─── */}
      <div className="auth-hero-grid">

        {/* LEFT COLUMN: BOTANICAL HERITAGE BRANDING */}
        <div className="auth-left-editorial">
          <span className="editorial-label">NATURAL SKINCARE ———</span>

          <h1 className="editorial-title">
            Nature Nourishes<br />
            A Healthier You
          </h1>

          <p className="editorial-sub">
            Pure ingredients. Proven science.<br />
            Real results.
          </p>

          <div className="editorial-features-list">
            <div className="feature-item">
              <div className="feature-icon-circle">
                <Leaf size={18} color="#9E6E38" />
              </div>
              <span>Natural Ingredients</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon-circle">
                <Sparkles size={18} color="#9E6E38" />
              </div>
              <span>Dermatologist Tested</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon-circle">
                <Heart size={18} color="#9E6E38" />
              </div>
              <span>Safe for All Skin Types</span>
            </div>
          </div>

          {/* MAIN BOTANICAL PRODUCTS IMAGE SHOWCASE */}
          <div className="editorial-product-showcase">
            <img src={loginProductImg} alt="Leafora Botanical Skincare Products" />
          </div>

          <p className="editorial-quote">
            “Good for your skin. Good for the planet.”
          </p>
        </div>

          {/* RIGHT COLUMN: ELEGANT FLOATING SIGN-IN CARD */}
          <div className="auth-right-card-wrapper">
            <div className="auth-card-panel">

              {/* Top Accent Leaf Badge */}
              <div className="card-leaf-accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#657A43">
                  <path d="M17 8C8 10 59 16.17 3.82 21.34L5.71 22.56C10.74 17.5 17 8 17 8Z" opacity="0.4" />
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2C20 4 21 6.18 21 10C21 15.5 16.22 20 11 20Z" />
                </svg>
              </div>

              {/* ALERT NOTIFICATION BAR */}
              {alert && (
                <div className={`auth-card-alert ${alert.type}`}>
                  {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{alert.text}</span>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 1. SIGN IN FORM VIEW */}
              {/* ───────────────────────────────────────────────────────────── */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="auth-card-form">
                  <div className="card-form-head">
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account to continue your skincare journey with us.</p>
                  </div>

                  <div className="field-group">
                    <label>Email Address</label>
                    <div className="input-box">
                      <Mail size={18} className="box-icon" />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Password</label>
                    <div className="input-box">
                      <Lock size={18} className="box-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="eye-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div className="forgot-password-align">
                      <button
                        type="button"
                        className="forgot-link"
                        onClick={() => { setMode('forgot'); setAlert(null); }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-btn-bronze" disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="spin" /> Signing In...
                      </>
                    ) : (
                      <>
                        Sign In <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <div className="switch-auth-mode">
                    <span>Don’t have an account? </span>
                    <button
                      type="button"
                      className="switch-link"
                      onClick={() => { setMode('signup'); setAlert(null); }}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* TRUST BADGES ROW (BOTTOM OF CARD) */}
                  <div className="card-trust-grid">
                    <div className="trust-col">
                      <div className="trust-icon-circle">
                        <ShieldCheck size={18} color="#9E6E38" />
                      </div>
                      <strong>Secure Login</strong>
                      <small>100% Protected</small>
                    </div>

                    <div className="trust-col-divider" />

                    <div className="trust-col">
                      <div className="trust-icon-circle">
                        <Leaf size={18} color="#9E6E38" />
                      </div>
                      <strong>Your Data</strong>
                      <small>Stays Private</small>
                    </div>

                    <div className="trust-col-divider" />

                    <div className="trust-col">
                      <div className="trust-icon-circle">
                        <Users size={18} color="#9E6E38" />
                      </div>
                      <strong>A Better</strong>
                      <small>Skincare Journey</small>
                    </div>
                  </div>
                </form>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 2. SIGN UP / CREATE ACCOUNT FORM VIEW */}
              {/* ───────────────────────────────────────────────────────────── */}
              {mode === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="auth-card-form">
                  <div className="card-form-head">
                    <h2>Create Account</h2>
                    <p>Join Leafora to unlock member rewards and tracking.</p>
                  </div>

                  <div className="field-grid-row">
                    <div className="field-group">
                      <label>First Name *</label>
                      <div className="input-box">
                        <User size={18} className="box-icon" />
                        <input
                          type="text"
                          placeholder="First name"
                          value={signupForm.first_name}
                          onChange={(e) => setSignupForm({ ...signupForm, first_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label>Last Name</label>
                      <div className="input-box">
                        <User size={18} className="box-icon" />
                        <input
                          type="text"
                          placeholder="Last name"
                          value={signupForm.last_name}
                          onChange={(e) => setSignupForm({ ...signupForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Email Address *</label>
                    <div className="input-box">
                      <Mail size={18} className="box-icon" />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Mobile Number</label>
                    <div className="input-box">
                      <Phone size={18} className="box-icon" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={signupForm.mobile}
                        onChange={(e) => setSignupForm({ ...signupForm, mobile: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field-grid-row">
                    <div className="field-group">
                      <label>Password *</label>
                      <div className="input-box">
                        <Lock size={18} className="box-icon" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="eye-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="field-group">
                      <label>Confirm Password *</label>
                      <div className="input-box">
                        <Lock size={18} className="box-icon" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          value={signupForm.confirm_password}
                          onChange={(e) => setSignupForm({ ...signupForm, confirm_password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="eye-toggle-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="auth-btn-bronze" disabled={loading} style={{ marginTop: 12 }}>
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="spin" /> Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <div className="switch-auth-mode">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      className="switch-link"
                      onClick={() => { setMode('login'); setAlert(null); }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 3. FORGOT PASSWORD FORM VIEW */}
              {/* ───────────────────────────────────────────────────────────── */}
              {mode === 'forgot' && (
                <form onSubmit={forgotForm.step === 1 ? handleForgotRequestOtp : handleResetPasswordSubmit} className="auth-card-form">
                  <div className="card-form-head">
                    <h2>Reset Password</h2>
                    <p>{forgotForm.step === 1 ? 'Enter your email to receive a password reset OTP code.' : 'Enter the OTP sent to your email & choose a new password.'}</p>
                  </div>

                  {forgotForm.step === 1 ? (
                    <div className="field-group">
                      <label>Email Address *</label>
                      <div className="input-box">
                        <Mail size={18} className="box-icon" />
                        <input
                          type="email"
                          placeholder="Enter registered email address"
                          value={forgotForm.email}
                          onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="field-group">
                        <label>Verification OTP Code *</label>
                        <div className="input-box">
                          <KeyRound size={18} className="box-icon" />
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP code"
                            value={forgotForm.otp}
                            onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="field-group">
                        <label>New Password *</label>
                        <div className="input-box">
                          <Lock size={18} className="box-icon" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={forgotForm.new_password}
                            onChange={(e) => setForgotForm({ ...forgotForm, new_password: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="field-group">
                        <label>Confirm New Password *</label>
                        <div className="input-box">
                          <Lock size={18} className="box-icon" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={forgotForm.confirm_new_password}
                            onChange={(e) => setForgotForm({ ...forgotForm, confirm_new_password: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button type="submit" className="auth-btn-bronze" disabled={loading} style={{ marginTop: 12 }}>
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="spin" /> Processing...
                      </>
                    ) : (
                      <>
                        {forgotForm.step === 1 ? 'Send Reset OTP →' : 'Reset Password Now →'}
                      </>
                    )}
                  </button>

                  <div className="switch-auth-mode">
                    <button
                      type="button"
                      className="switch-link"
                      onClick={() => { setMode('login'); setAlert(null); setForgotForm({ email: '', otp: '', new_password: '', confirm_new_password: '', step: 1 }); }}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* BOTTOM RIGHT BOTANICAL CURSIVE ACCENT */}
            <div className="auth-footer-cursive-text">
              <span>Self Care</span>
              <small>Looks Good On You</small>
            </div>
          </div>

        </div>

      </div>
      );
}
