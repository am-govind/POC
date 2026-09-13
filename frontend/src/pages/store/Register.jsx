import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import StoreNav from '../../components/layout/StoreNav';
import { isOldEnough, MIN_AGE_YEARS } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', date_of_birth: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isOldEnough(form.date_of_birth)) {
      setError(`You must be at least ${MIN_AGE_YEARS} years old to register`);
      return;
    }
    try {
      await register(form);
      navigate(redirect);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-flipkart-bg">
      <StoreNav />
      <div className="max-w-md mx-auto px-4 py-12">
        <form onSubmit={submit} className="fk-card p-8">
          <h1 className="text-2xl font-semibold text-flipkart-text text-center mb-6">Create account</h1>
          {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-sm">{error}</p>}
          <label className="block text-sm text-flipkart-text mb-1">Full name</label>
          <input className="fk-input mb-4" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <label className="block text-sm text-flipkart-text mb-1">Email</label>
          <input type="email" required className="fk-input mb-4" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="block text-sm text-flipkart-text mb-1">Date of birth ({MIN_AGE_YEARS}+ required)</label>
          <input type="date" required className="fk-input mb-4" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          <label className="block text-sm text-flipkart-text mb-1">Password</label>
          <input type="password" required minLength={8} className="fk-input mb-6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="submit" className="fk-btn-primary w-full py-3">Sign up</button>
          <p className="text-center text-flipkart-muted text-sm mt-6">
            Already have an account? <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-flipkart-blue font-medium">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
