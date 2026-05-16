import React, { useEffect, useState } from 'react';
import { FaFacebook, FaGoogle, FaPhone, FaSpinner, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { signInWithGoogle, signInWithFacebook, sendPhoneOTP, verifyPhoneOTP, error, loading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPhoneNumber('');
      setOtp('');
      setOtpSent(false);
      setOtpCountdown(0);
      setShowPhoneForm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (otpCountdown <= 0) return undefined;
    const timer = setTimeout(() => setOtpCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const finishAuth = () => {
    onClose?.();
    onSuccess?.();
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalLoading(true);
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        toast.success('Google login successful!', { position: 'top-right', autoClose: 3000 });
        finishAuth();
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        toast.error(error || err.message || 'Google login failed', { position: 'top-right', autoClose: 3000 });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLocalLoading(true);
      const signedInUser = await signInWithFacebook();
      if (signedInUser) {
        toast.success('Facebook login successful!', { position: 'top-right', autoClose: 3000 });
        finishAuth();
      }
    } catch (err) {
      toast.error(error || err.message || 'Facebook login failed', { position: 'top-right', autoClose: 3000 });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendOTP = async (event) => {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter a valid phone number', { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      setLocalLoading(true);
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      await sendPhoneOTP(formattedPhone);
      setOtpSent(true);
      setOtpCountdown(60);
      toast.success('OTP sent successfully!', { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      toast.error(error || err.message || 'Failed to send OTP', { position: 'top-right', autoClose: 3000 });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    if (!otp.trim() || otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP', { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      setLocalLoading(true);
      await verifyPhoneOTP(otp);
      toast.success('Phone verification successful!', { position: 'top-right', autoClose: 3000 });
      finishAuth();
    } catch (err) {
      toast.error(error || err.message || 'Invalid OTP. Please try again.', { position: 'top-right', autoClose: 3000 });
    } finally {
      setLocalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 18, 0.84)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 27, 75, 0.68))',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          color: '#fff',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#94a3b8',
          }}
        >
          <FaTimes />
        </button>

        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#fff' }}>Welcome to DuoTalk</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '30px' }}>Sign in to your account</p>

        {!showPhoneForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={handleGoogleLogin}
              disabled={localLoading}
              style={buttonStyle('#ffffff', '#0f172a', '1px solid rgba(255,255,255,0.12)')}
            >
              <FaGoogle /> Continue with Google
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={localLoading}
              style={buttonStyle('#1877f2', '#ffffff', 'none')}
            >
              <FaFacebook /> Continue with Facebook
            </button>

            <button
              onClick={() => setShowPhoneForm(true)}
              disabled={localLoading}
              style={buttonStyle('linear-gradient(135deg, #2563eb, #8b5cf6)', '#ffffff', 'none')}
            >
              <FaPhone /> Continue with Phone
            </button>
          </div>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              type="button"
              onClick={() => {
                setShowPhoneForm(false);
                setPhoneNumber('');
                setOtp('');
                setOtpSent(false);
                setOtpCountdown(0);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
                textAlign: 'left',
                marginBottom: '10px',
                padding: 0,
              }}
            >
              Back
            </button>

            {!otpSent ? (
              <>
                <label style={labelStyle}>
                  Phone Number
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    disabled={localLoading || loading}
                    style={inputStyle}
                  />
                </label>

                <div id="recaptcha-container" style={{ margin: '10px 0' }} />

                <button type="submit" disabled={localLoading || loading} style={buttonStyle('linear-gradient(135deg, #2563eb, #8b5cf6)', '#ffffff', 'none')}>
                  {localLoading ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...</> : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <label style={labelStyle}>
                  Enter OTP Code
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength="6"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    disabled={localLoading || loading}
                    style={{ ...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '20px' }}
                  />
                </label>

                <button type="submit" disabled={localLoading || loading || otp.length < 6} style={buttonStyle('linear-gradient(135deg, #2563eb, #8b5cf6)', '#ffffff', 'none')}>
                  {localLoading ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setOtpCountdown(0);
                  }}
                  disabled={otpCountdown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: otpCountdown > 0 ? '#64748b' : '#60a5fa',
                    fontSize: '14px',
                    cursor: otpCountdown > 0 ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
                </button>
              </>
            )}
          </form>
        )}

        {error && (
          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: 'rgba(239,68,68,0.16)',
              border: '1px solid rgba(248,113,113,0.35)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '20px' }}>
          By signing in, you agree to our Terms and Privacy Policy
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const buttonStyle = (background, color, border) => ({
  padding: '14px',
  background,
  color,
  border,
  borderRadius: '14px',
  fontSize: '16px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
});

const labelStyle = {
  display: 'block',
  color: '#e2e8f0',
  fontSize: '14px',
  fontWeight: '700',
};

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  fontSize: '16px',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
};

export default LoginModal;
