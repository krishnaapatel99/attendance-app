import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import api from '../../utils/api';
import 'react-toastify/dist/ReactToastify.css';
import {useAuth} from '../../contexts/AuthContext';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
const { refreshUser } = useAuth();

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();

  // 👇 PURPOSE-BASED DATA
  const purpose = state?.purpose; // 'EMAIL_VERIFICATION' | 'FORGOT_PASSWORD'
  const email = state?.email; // for EMAIL_VERIFICATION
  const role = state?.role; // for FORGOT_PASSWORD
  const identifier = state?.identifier; // rollno or email

  /* ----------------------------------
     ACCESS GUARD
  ---------------------------------- */
  useEffect(() => {
    if (
      !purpose ||
      (purpose === 'EMAIL_VERIFICATION' && !email) ||
      (purpose === 'FORGOT_PASSWORD' && (!role || !identifier))
    ) {
      toast.error('Invalid OTP access');
      navigate('/signin');
    }
  }, []);

  /* ----------------------------------
     AUTO VERIFY WHEN OTP COMPLETE
  ---------------------------------- */
  useEffect(() => {
    if (otp.every(d => d !== '') && otp.length === 6) {
      handleVerifyOtp();
    }
  }, [otp]);

  /* ----------------------------------
     RESEND COUNTDOWN
  ---------------------------------- */
  useEffect(() => {
    let timer;
    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(30);
    }
    return () => clearTimeout(timer);
  }, [resendDisabled, countdown]);

  /* ----------------------------------
     INPUT HANDLERS
  ---------------------------------- */
  const handleChange = (index, value) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  /* ----------------------------------
     VERIFY OTP (PURPOSE BASED)
  ---------------------------------- */
  const handleVerifyOtp = async () => {
    if (isLoading) return;

    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    try {
      setIsLoading(true);

      if (purpose === 'EMAIL_VERIFICATION') {
        await api.post('/student/verify-otp', {
          email,
          otp: otpCode
        });
        await refreshUser();
        toast.success('Email verified successfully');
        setTimeout(() => navigate('/change-password'), 1200);
      }

      if (purpose === 'FORGOT_PASSWORD') {
        await api.post('/otp/forgot/verify-otp', {
          role,
          identifier,
          otp: otpCode
        });

       
        toast.success('OTP verified');

        navigate('/otp/reset-password', {
          state: {
            purpose: 'FORGOT_PASSWORD',
            role,
            identifier,
            otp: otpCode
          }
        });
      }

    } catch (error) {
      const msg =
        error.response?.data?.message || 'Invalid OTP';
      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------------------
     RESEND OTP (PURPOSE BASED)
  ---------------------------------- */
  const handleResendOtp = async () => {
    try {
      setResendDisabled(true);

      if (purpose === 'EMAIL_VERIFICATION') {
        await api.post('/student/resend-otp', { email });
      }

      if (purpose === 'FORGOT_PASSWORD') {
        await api.post('/otp/forgot/resend-otp', {
          role,
          identifier
        });
      }

      toast.success('OTP resent successfully');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  /* ----------------------------------
     UI
  ---------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <ToastContainer
                    position="top-center"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                  />

      {/* Logo */}
      <div className="px-4 py-4">
        <img src="Upashit_logo.png" alt="Logo" className="h-12" />
      </div>

      <main className="flex-1 flex flex-col items-center pt-8">
        <div className="max-w-md w-full text-center px-4">

          <h1 className="text-3xl font-bold mb-2">Verify OTP</h1>

          <p className="text-gray-600 mb-8">
            {purpose === 'EMAIL_VERIFICATION'
              ? <>Enter the code sent to <b>{email}</b></>
              : <>Enter the code sent to your registered email</>}
          </p>

          {/* OTP INPUTS */}
          <div className="flex justify-center gap-3 mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl border-2 rounded-lg focus:border-blue-500"
              />
            ))}
          </div>

          {/* RESEND */}
          <button
            onClick={handleResendOtp}
            disabled={resendDisabled}
            className={`mb-6 ${
              resendDisabled ? 'text-gray-400' : 'text-blue-600'
            }`}
          >
            {resendDisabled
              ? `Resend OTP in ${countdown}s`
              : 'Resend OTP'}
          </button>

          {/* VERIFY BUTTON */}
          <button
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.some(d => !d)}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

        </div>
      </main>
    </div>
  );
};

export default OtpVerification;
