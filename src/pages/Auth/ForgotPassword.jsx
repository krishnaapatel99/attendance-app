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

      // ✅ Navigate to OTP page with PURPOSE
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
    <div className="min-h-screen bg-gray-200 flex flex-col">
      {/* Logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <img
          src="Upashit_logo.png"
          alt="Upasthit Logo"
          className="h-10 w-auto object-contain sm:h-12"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm sm:max-w-lg bg-white rounded-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.55)] p-6 sm:p-8">

          <h1 className="text-xl font-semibold text-center text-gray-800 mb-6 sm:text-2xl sm:mb-8">
            Forgot Password
          </h1>

          {/* Role toggle */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6 sm:mb-8">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 px-4 py-2 sm:px-8 sm:py-3 rounded-full font-medium ${
                activeTab === 'teacher'
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-300 text-white'
              }`}
            >
              Teacher
            </button>

            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 px-4 py-2 sm:px-8 sm:py-3 rounded-full font-medium ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-300 text-white'
              }`}
            >
              Student
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSendOtp} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-700 mb-2">
                {activeTab === 'student'
                  ? 'Roll Number'
                  : 'Email Address'}
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={
                  activeTab === 'student'
                    ? 'Enter your roll number'
                    : 'Enter your email address'
                }
                required
              />
            </div>

            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>

            <div className="text-center pt-3">
              <Link
                to="/login"
                className="text-gray-600 underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
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
