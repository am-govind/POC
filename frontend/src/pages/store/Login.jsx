import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import StoreNav from '../../components/layout/StoreNav';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : redirect);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-flipkart-bg">
      <StoreNav />
      <div className="max-w-md mx-auto px-4 py-12">
        <form onSubmit={submit} className="fk-card p-8">
          <h1 className="text-2xl font-semibold text-flipkart-text text-center mb-2">Login</h1>
          <p className="text-flipkart-muted text-center text-sm mb-6">Get access to your orders, wishlist and more</p>
          {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-sm">{error}</p>}
          <label className="block text-sm text-flipkart-text mb-1">Email</label>
          <input type="email" required className="fk-input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="block text-sm text-flipkart-text mb-1">Password</label>
          <input type="password" required className="fk-input mb-6" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="fk-btn-primary w-full py-3">Login</button>
          <p className="text-center text-flipkart-muted text-sm mt-6">
            New to BottleShop? <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-flipkart-blue font-medium">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
