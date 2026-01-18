import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset form data when the active tab changes (optional but good UX)
  useEffect(() => {
    setFormData({
        email: '',
        password: ''
    });
    setError('');
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // NOTE: Your current logic doesn't explicitly check the activeTab
      // for the login request, but relies on the server to check credentials
      // and return the role. This is fine, but if 'login' needs the role, 
      // you'd pass 'activeTab' here: await login(..., activeTab).
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect based on user role returned from the server
        if (result.user.role === 'teacher') {
          navigate('/teacher');
        } else if (result.user.role === 'student') {
          navigate('/student');
        } else {
            // Handle unexpected role
            setError('Login successful, but user role is unknown.');
            setLoading(false);
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred during login. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fill demo credentials
  const fillDemoCredentials = () => {
    if (activeTab === 'student') {
      setFormData({
        email: 'krishnapatel_comp_2024@ltce.in',
        password: 'Password123'
      });
    } else {
      setFormData({
        email: 'dipika_matke@ltce.in',
        password: 'Teacher123'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
        {/* Logo container for responsiveness */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <img 
                src="Upashit_logo.png" 
                alt="Upasthit Logo" 
                className="h-10 w-auto object-contain sm:h-12"
            />
        </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Responsive adjustments: max-w-sm on mobile, max-w-lg on larger screens, reduced vertical padding on mobile */}
        <div className="w-full max-w-sm sm:max-w-lg bg-white rounded-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.55)] p-6 sm:p-8">
          
          {/* Welcome Text */}
          <h1 className="text-xl font-semibold text-center text-gray-800 mb-6 sm:text-2xl sm:mb-8">
            Welcome to Upasthit
          </h1>

          {/* Toggle Buttons: Use flex-col on small screens for stacking, then flex-row on medium screens and up */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6 sm:mb-8">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 px-4 py-2 sm:px-8 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'teacher'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-green-300 text-white hover:bg-green-400'
              }`}
            >
              Teacher Login
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 px-4 py-2 sm:px-8 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-green-300 text-white hover:bg-green-400'
              }`}
            >
              Student Login
            </button>
          </div>

          {/* Login Heading */}
          <h2 className="text-xl font-bold text-center text-gray-800 mb-5 sm:text-2xl sm:mb-6">
            Login as a {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>

          {/* Form */}
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm sm:text-base">
                {error}
              </div>
            )}
            
            {/* Email Input */}
           <div>
            <label className="block text-sm sm:text-base font-bold text-gray-700 mb-2">
             {activeTab === 'student' ? 'Roll Number' : 'Email Address'}
            </label>
            <input
                 type={activeTab === 'student' ? 'text' : 'email'}
                 name="email"
                 value={formData.email}
                 onChange={handleInputChange}
                 className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                 required
            />
           </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
            </div>

            {/* Forgot/Demo Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <button 
                type="button" 
                className="text-sm sm:text-base text-gray-600 hover:text-gray-800 transition-colors"
              >
                Forgot password?
              </button>
            
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            {/* Contact Admin Link */}
            <div className="text-center pt-3">
              <button type="button" className="text-sm sm:text-base text-gray-600 hover:text-gray-800 underline transition-colors">
                No account? Contact admin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;