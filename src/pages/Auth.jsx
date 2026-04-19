import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const identifier = formData.username || formData.email;
        const body = identifier.includes('@') 
          ? { email: identifier, password: formData.password }
          : { username: identifier, password: formData.password };
        await login(body);
      } else {
        await register(formData);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center z-[100]">
      <div className="bg-bg2 border border-white/10 rounded-xl p-9 w-[380px]">
        <div className="flex items-center gap-3.5 mb-7">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent2 rounded-xl flex items-center justify-center text-xl font-bold text-bg">B</div>
          <div>
            <div className="text-[22px] font-semibold">BioBot Cloud</div>
            <div className="text-sm text-text3">IoT Monitoring Platform</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-sm p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isLogin ? (
            <>
              <Input
                label="Username or Email"
                name="username"
                placeholder="jane_doe"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </>
          ) : (
            <>
              <Input
                label="Username"
                name="username"
                placeholder="jane_doe"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </>
          )}

          <Button variant="primary" className="w-full py-2.5 mt-2" type="submit" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="text-center mt-4.5 text-[13px] text-text3">
          {isLogin ? "No account? " : "Already have an account? "}
          <span 
            className="text-accent cursor-pointer hover:underline"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
