import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };
      
      const res = await api.post(endpoint, payload);
      if (res.data.success) {
        setAuth(res.data.data.token, res.data.data);
        navigate('/');
      }
    } catch (error) {
      alert('Authentication failed');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-4">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        <form onSubmit={handleSubmit} className="grid">
          {isRegister && (
            <input 
              type="text" 
              placeholder="Name" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <button type="submit" className="btn btn-primary">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-4" style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
};
