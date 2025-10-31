import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import logo from '../logo.jpeg'; // Import your logo

const API_BASE = "http://localhost:5000";

function Login({ onLogin, switchToSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, formData);
      
      // Save token and user info to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('email', response.data.email);
      
      // Call parent function to update auth state
      onLogin(response.data);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="icon-container">
          <div className="icon"><img src={logo} alt="Budget Tracker Logo" className="auth-logo" /></div>
        </div>
        <h2>Login to Budget Tracker</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="switch-auth">
          Don't have an account? 
          <span onClick={switchToSignup}> Sign up</span>
        </p>
      </div>
    </div>
  );
}

export default Login;
