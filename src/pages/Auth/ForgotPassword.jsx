import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import api from '../../utils/api';

const ForgotPassword = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    rollNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setFormData({ email: '', rollNumber: '' });
    setError('');
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const identifier =
      activeTab === 'teacher'
        ? formData.email
        : formData.rollNumber;

    if (!identifier) {
      setError(
        activeTab === 'teacher'
          ? 'Please enter your email address'
          : 'Please enter your roll number'
      );
      setLoading(false);
      return;
    }

    if (
      activeTab === 'teacher' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await api.post('/otp/forgot/send-otp', {
        role: activeTab,
        identifier
      });

      toast.success('OTP sent to your registered email');

      navigate('/otp-verification', {
        state: {
          purpose: 'FORGOT_PASSWORD',
          role: activeTab,
          identifier
        }
      });

    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Failed to send OTP. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      {/* Logo container moved inside the flex flow or fixed */}
      <div className="absolute top-6 left-6">
        <img
          src="Upashit_logo.png"
          alt="Upasthit Logo"
          className="h-10 sm:h-12 w-auto object-contain"
        />
      </div>

      {/* Main Card - Matching the Login shadow and radius */}
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100 p-8 sm:p-16">
        
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-400 text-sm">Reset your access to Upasthit</p>
        </div>

        {/* Role toggle - Styled like the Login "Pill" tabs */}
        <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-10 border border-gray-100">
          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
              activeTab === 'teacher' 
                ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            TEACHER
          </button>

          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
              activeTab === 'student' 
                ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            STUDENT
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSendOtp} className="space-y-8">
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 py-3 rounded-xl border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          {/* Underlined Input Style */}
          <div className="relative border-b-2 border-gray-100 focus-within:border-blue-500 transition-colors py-2">
            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
              {activeTab === 'student' ? 'Roll Number' : 'Email Address'}
            </label>

            <input
              type={activeTab === 'student' ? 'text' : 'email'}
              name={activeTab === 'student' ? 'rollNumber' : 'email'}
              value={
                activeTab === 'student'
                  ? formData.rollNumber
                  : formData.email
              }
              onChange={handleInputChange}
              className="w-full py-2 outline-none bg-transparent text-gray-700 placeholder-gray-300 text-lg"
              placeholder={
                activeTab === 'student'
                  ? 'e.g. 2024CS101'
                  : 'name@example.com'
              }
              required
            />
          </div>

          <div className="flex flex-col items-center pt-4 space-y-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-[0.98] disabled:bg-gray-300"
            >
              {loading ? 'SENDING OTP...' : 'SEND OTP'}
            </button>

            <Link
              to="/login"
              className="text-sm font-bold text-gray-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>

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
    </div>
  );
};

export default ForgotPassword;