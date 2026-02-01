import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EyeOff, Eye, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const tabContent = {
    student: {
      image: "https://illustrations.popsy.co/blue/studying.svg",
      title: "Student Portal",
      desc: "Access your assignments and join live classes."
    },
    teacher: {
      image: "https://illustrations.popsy.co/blue/presentation.svg",
      title: "Instructor Hub",
      desc: "Manage your classroom and track student progress."
    }
  };

  useEffect(() => {
    setFormData({ email: '', password: '' });
    setError('');
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(formData.email, formData.password, activeTab);
      if (result.success) {
        if (result.user.role === 'teacher') navigate('/teacher');
        else if (result.user.role === 'student') {
          result.user.email_verified ? navigate('/student') : navigate('/email');
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen md:min-h-screen flex items-center justify-center font-sans bg-white md:p-4 md:bg-[linear-gradient(to_right,#60a5fa_50%,#ffffff_50%)] overflow-hidden">
      
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white md:rounded-[2.5rem] overflow-hidden md:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] md:border md:border-gray-100 h-full md:h-auto">
        
        {/* MOBILE HEADER */}
        <div className="md:hidden w-full h-[35%] relative overflow-hidden  bg-blue-600 flex items-center justify-center">
          <div className="relative z-10 flex flex-col items-center">
            <img
              src="duplicate.png"
              alt="Logo"
              className="h-[400px] object-contain w-full"
            />
             

          </div>

          
        </div>

        {/* DESKTOP LEFT SECTION */}
        <div className="hidden md:flex md:w-1/2 bg-blue-400 p-12 flex-col items-center justify-center relative transition-colors duration-500">
          <div className="text-center">
            <div className="h-64 flex items-center justify-center mb-8">
                <img src={tabContent[activeTab].image} alt="Study" className="w-full max-w-sm scale-110" key={activeTab} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{tabContent[activeTab].title}</h2>
            <p className="text-blue-50 opacity-90 text-lg max-w-xs mx-auto">{tabContent[activeTab].desc}</p>
          </div>
        </div>

        {/* FORM SECTION */}
        <div className="w-full h-[68%] md:h-auto md:w-1/2 p-8 md:p-20 flex flex-col justify-start md:justify-center bg-white overflow-y-auto">
          
          <div className="flex flex-col items-center mb-0 md:mb-8">
            <img src="Upashit_logo.png" alt="Logo" className="hidden md:block h-12 mb-2" />
            <h2 className="hidden md:block text-sm md:text-2xl font-semibold text-gray-400">Welcome back to Upasthit</h2>
          </div>

          {/* ROLE TABS WITH MOBILE IMAGES */}
          <div className="flex p-1 bg-gray-50 rounded-2xl mb-0 md:mb-8 border border-gray-100 shadow-sm">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
                activeTab === 'teacher' ? 'bg-white shadow-md' : 'opacity-50 grayscale'
              }`}
            >
              <img 
                src="./Screenshot 2026-02-01 042434.png" 
                alt="Teacher" 
                className="md:hidden h-10 w-auto object-contain"
              />
              <span className={`text-[10px] md:text-xs font-bold tracking-widest ${
                activeTab === 'teacher' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                TEACHER
              </span>
            </button>

            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
                activeTab === 'student' ? 'bg-white shadow-md' : 'opacity-50 grayscale'
              }`}
            >
              <img 
                src="./Screenshot 2026-02-01 041955.png" 
                alt="Student" 
                className="md:hidden h-10 w-auto object-contain"
              />
              <span className={`text-[10px] md:text-xs font-bold tracking-widest ${
                activeTab === 'student' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                STUDENT
              </span>
            </button>
          </div>

          <form className="space-y-5 md:space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-500 text-[10px] text-center bg-red-50 py-2 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                    {activeTab === 'student' ? 'Roll Number' : 'Email Address'}
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-500 shadow-sm transition-all">
                    <Mail size={18} className="text-gray-300 mr-3" />
                    <input
                        type={activeTab === 'student' ? 'text' : 'email'}
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full outline-none bg-transparent text-gray-700 text-sm md:text-base"
                        placeholder={activeTab === 'student' ? "Enter your roll no." : "example@mail.com"}
                        required
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Password</label>
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-500 shadow-sm transition-all">
                    <Lock size={18} className="text-gray-300 mr-3" />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full outline-none bg-transparent text-gray-700 text-sm md:text-base"
                        placeholder="••••••••"
                        required
                    />
                    <button type="button" className="text-gray-300 ml-2" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>
                <div className="text-right mt-1">
                    <Link to="/forgot-password" size="sm" className="text-[10px] md:text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors">
                        Forgot password?
                    </Link>
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300"
            >
              {loading ? 'Logging in...' : 'LOGIN NOW'}
              {!loading && <span className="text-lg">→</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;