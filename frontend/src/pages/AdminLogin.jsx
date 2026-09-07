import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminSendOtp, adminVerifyOtp } from '../services/api';
import { ShieldCheck, Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [email, setEmail] = useState('hkahir46@gmail.com');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await adminSendOtp(email);
      if (res.success) {
        setMessage(`OTP sent successfully to ${email}. Please check your inbox.`);
        if (res.devOtp) setDevOtp(res.devOtp);
        setStep(2);
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'Error sending OTP. Make sure server is online.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await adminVerifyOtp(email, otp);
      if (res.success) {
        localStorage.setItem('leafora_admin_token', res.token);
        localStorage.setItem('leafora_admin_user', JSON.stringify(res.user));
        setMessage('Login verified! Redirecting to Admin Control Dashboard...');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000);
      } else {
        setError(res.message || 'Invalid OTP code');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <ShieldCheck size={32} color="#10b981" />
          </div>
          <h2 style={styles.title}>Leafora Admin Portal</h2>
          <p style={styles.subtitle}>Secure Email & OTP Authentication</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={styles.successBox}>
            <CheckCircle2 size={18} /> <span>{message}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Admin Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@leaforalifescience.com"
                  required
                  style={styles.input}
                />
              </div>
              <small style={styles.hint}>Authorized email: <strong>hkahir46@gmail.com</strong></small>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? (
                <>
                  <RefreshCw className="spin" size={18} /> Sending OTP...
                </>
              ) : (
                <>
                  Send OTP Code <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter 6-Digit OTP</label>
              <div style={styles.inputWrapper}>
                <KeyRound size={20} color="#9ca3af" style={styles.inputIcon} />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 584920"
                  maxLength={6}
                  required
                  style={styles.otpInput}
                />
              </div>
              {devOtp && (
                <div style={styles.devOtpBadge}>
                  💡 Quick Dev OTP Code: <strong>{devOtp}</strong>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? (
                <>
                  <RefreshCw className="spin" size={18} /> Verifying Code...
                </>
              ) : (
                <>
                  Verify & Access Dashboard <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setError(null);
              }}
              style={styles.backButton}
            >
              ← Change Email Address
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    background: 'radial-gradient(circle at top, #064e3b 0%, #022c22 100%)',
    borderRadius: '16px',
    margin: '1rem 0',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '2.5rem 2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    color: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem auto',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
  },
  otpInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #10b981',
    borderRadius: '10px',
    color: '#10b981',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    letterSpacing: '6px',
    outline: 'none',
  },
  hint: {
    fontSize: '0.78rem',
    color: '#64748b',
    marginTop: '4px',
  },
  devOtpBadge: {
    fontSize: '0.82rem',
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: '8px 12px',
    borderRadius: '6px',
    marginTop: '6px',
    border: '1px dashed #10b981',
  },
  button: {
    padding: '0.85rem 1rem',
    backgroundColor: '#10b981',
    color: '#064e3b',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.85rem',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    color: '#f87171',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '10px',
    color: '#34d399',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
};
