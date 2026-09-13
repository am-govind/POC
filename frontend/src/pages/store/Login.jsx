import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-ink-light animate-pulse" />
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="glass-card p-8 w-full max-w-md relative z-10"
      >
        <h1 className="font-display text-3xl text-center mb-2">Welcome back</h1>
        <p className="text-white/50 text-center text-sm mb-8">Sign in to your BottleShop account</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <label className="block text-sm text-white/60 mb-2">Email</label>
        <input type="email" required className="input-field mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-sm text-white/60 mb-2">Password</label>
        <input type="password" required className="input-field mb-6" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn-primary w-full">Sign in</button>
        <p className="text-center text-white/50 text-sm mt-6">
          New here? <Link to="/register" className="text-gold hover:underline">Create account</Link>
        </p>
      </motion.form>
    </div>
  );
}
