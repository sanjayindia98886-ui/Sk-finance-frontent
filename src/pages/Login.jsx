import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/Config';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await API.post('/auth/login', formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('name', response.data.user?.name || ''); 
      
      const userRole = response.data.user?.role || 'user';
      localStorage.setItem('role', userRole);
      
      alert('Login Successful!');
      
      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid email or password.';
      setError(errorMsg);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Enter password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                style={styles.input} 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button type="submit" style={styles.button}>Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          <span onClick={() => navigate('/forgot-password')} style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>
            Forgot Password?
          </span>
        </p>

        <p style={styles.footerText}>
          Don't have an account? <span onClick={() => navigate('/register')} style={styles.link}>Register here</span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'sans-serif' },
  card: { background: 'rgba(255, 255, 255, 0.05)', padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: '1px solid #334155' },
  title: { marginBottom: '20px' },
  form: { textAlign: 'left' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontSize: '14px', color: '#94a3b8' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#1e293b', color: '#fff', boxSizing: 'border-box' },
  passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  eyeButton: { position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' },
  button: { width: '100%', padding: '10px', marginTop: '10px', borderRadius: '5px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  error: { color: '#f87171', fontSize: '12px', marginBottom: '10px' },
  footerText: { marginTop: '20px', fontSize: '14px', color: '#94a3b8' },
  link: { color: '#60a5fa', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline' }
};

export default Login;