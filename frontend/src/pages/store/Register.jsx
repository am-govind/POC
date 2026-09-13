import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', date_of_birth: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="glass-card p-8 w-full max-w-md"
      >
        <h1 className="font-display text-3xl text-center mb-8">Join BottleShop</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <label className="block text-sm text-white/60 mb-2">Full name</label>
        <input className="input-field mb-4" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <label className="block text-sm text-white/60 mb-2">Email</label>
        <input type="email" required className="input-field mb-4" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="block text-sm text-white/60 mb-2">Date of birth (21+ required)</label>
        <input type="date" required className="input-field mb-4" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
        <label className="block text-sm text-white/60 mb-2">Password</label>
        <input type="password" required minLength={8} className="input-field mb-6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="btn-primary w-full">Create account</button>
        <p className="text-center text-white/50 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-gold">Sign in</Link>
        </p>
      </motion.form>
    </div>
  );
}
