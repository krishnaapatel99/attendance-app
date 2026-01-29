import React, { useState } from 'react';
import {ToastContainer, toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, CircularProgress } from '@mui/material';
import api from '../../utils/api';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const handleGoogleSignIn = () => {
  if (!window.google) {
    toast.error('Google SDK not loaded');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        setIsLoading(true);

        // ✅ This is the ID TOKEN
        const idToken = response.credential;

        const verificationResponse = await api.post(
          '/verify-google-email',
          { idToken }
        );

        toast.success('Email verified successfully');

        setTimeout(() => {
          navigate('/student');
        }, 1000);

      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          'Failed to verify Google email'
        );
      } finally {
        setIsLoading(false);
      }
    }
  });

  // 🔐 Trigger Google popup
  window.google.accounts.id.prompt();
};

  const handleSendOtp = async (e) => {
  e.preventDefault();

  if (!email) {
    toast.error('Please enter your email address');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast.error('Please enter a valid email address');
    return;
  }

  try {
    setIsLoading(true);

    const response = await api.post('/otp/send-otp', { email });

    toast.success('OTP has been sent to your email');

    setTimeout(() => {
      navigate('/otp-verification', { state: { email, purpose: 'EMAIL_VERIFICATION' } });
    }, 800); // small delay so toast is visible

  } catch (error) {
    console.error('Error sending OTP:', error);

    const errorMessage =
      error.response?.data?.message ||
      'Failed to send OTP. Please try again.';

    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div>
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
<div className='px-4 py-4 md:px-8'>
  <img src="Upashit_logo.png" alt="Upashit Logo" className="h-12 w-auto object-contain sm:h-12" /></div>
    <Container component="main" maxWidth="xs">
      
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Enter Your Email
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          We'll send a verification code to your email address
        </Typography>

        <Box component="form" onSubmit={handleSendOtp} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Send OTP'}
          </Button>
        </Box>
      </Box>
      <div className='flex justify-center'><button  onClick={handleGoogleSignIn}
  disabled={isLoading} className='h-10 w-10 p-0 mr-5 rounded-full bg-black flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-shadow'>
        <img src="/google.jpg" alt="Google" className="h-7 w-7 object-contain rounded-full" />
      </button> 
      <Link to={"/student"} className='p-2 pl-4 text-blue-500 underline'>Skip for now</Link>
      </div>
    </Container>
    
   
          </div>
  );
};

export default EmailVerification;