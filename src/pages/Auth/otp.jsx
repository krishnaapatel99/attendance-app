import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../utils/api';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || 'your email';

  // Auto-submit when all OTP digits are entered
  useEffect(() => {
    if (otp.every(digit => digit !== '') && otp.length === 6) {
      handleVerifyOtp();
    }
  }, [otp]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(30);
    }
    return () => clearTimeout(timer);
  }, [countdown, resendDisabled]);

  const handleChange = (index, value) => {
    // Only allow numbers
    const char = value.slice(-1); 
    if (!/^\d*$/.test(char)) return;

    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Move to next input
    if (char !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (pasteData.length === 6 && !isNaN(pasteData)) {
      const otpArray = pasteData.split('').slice(0, 6);
      setOtp(otpArray);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendDisabled(true);
      await api.post('/otp/resend-otp',);
      toast.success('OTP has been resent');
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

const handleVerifyOtp = async () => {
  if (isLoading) return;

  const otpCode = otp.join('');
  if (otpCode.length !== 6) {
    toast.error('Please enter a valid 6-digit OTP');
    return;
  }

  try {
    setIsLoading(true);
    await api.post('/otp/verify-otp', { otp: otpCode });
    toast.success('OTP verified successfully');

    setTimeout(() => navigate('/student'), 1200);
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      'Invalid OTP. Please try again.';

    toast.error(msg);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
      {/* Header/Logo */}
      <div className="px-4 py-4 md:px-8">
        <img 
          src="Upashit_logo.png" 
          alt="Upashit Logo" 
          className="h-12 w-auto object-contain" 
        />
      </div>
      
      <main className="flex-1 flex flex-col items-center px-4 pt-8 sm:pt-12">
        <div className="max-w-md w-full text-center">
          
          {/* OTP Illustration/Circle */}
          <div className="flex justify-center mb-8">
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-2xl font-bold">OTP</span>
            </div>
          </div>

          {/* Title and Subtitle */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verify OTP
          </h1>
          <p className="text-gray-600 mb-8">
            Enter the 6-digit code sent to <span className="font-medium text-gray-800">{email}</span>
          </p>

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-2 sm:gap-4 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold border-2 rounded-lg 
                           bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                           outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            ))}
          </div>

          {/* Resend OTP Link */}
          <div className="mb-8">
            <button
              onClick={handleResendOtp}
              disabled={resendDisabled}
              className={`text-sm font-medium transition-colors ${
                resendDisabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {resendDisabled 
                ? `Resend OTP in ${countdown}s` 
                : "Didn't receive code? Resend OTP"}
            </button>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.some(digit => digit === '')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold 
                       shadow-lg shadow-blue-200 transition-all active:scale-[0.98] 
                       disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : 'Verify OTP'}
          </button>
        </div>
        
      </main>
    </div>
  );
};

export default OtpVerification;