import { useState } from 'react';
import { Lock, Mail, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // New: For signup
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 1. HANDLE LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the REAL backend route we just created
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Save the token securely
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userId', data.user.id);

      onLogin(); // Switch app view to Dashboard
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HANDLE SIGN UP ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Signup failed');

      alert('Account created successfully! Please log in.');
      setShowSignUp(false); // Switch back to login screen
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    alert("SSO Login requires additional university configuration.");
  };

  // --- 3. FORGOT PASSWORD SCREEN (unchanged) ---
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-amber-600 mb-2">Hive</h1>
            <h2 className="text-gray-700">Reset Password</h2>
            <p className="text-gray-600 mt-2">Enter your email to receive a password reset link</p>
          </div>

          {/* Error Message Display */}
          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setLoading(true);

            try {
              const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });

              const data = await res.json();

              if (!res.ok) throw new Error(data.error || 'Failed to send reset email');

              alert('Password reset link sent to ' + email + '. Please check your email.');
              setShowForgotPassword(false);
            } catch (err: any) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }}>
            <div className="mb-6">
              <label htmlFor="forgot-email" className="block text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors mb-4 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-amber-600 hover:text-amber-700">
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 4. SIGN UP SCREEN ---
  if (showSignUp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
                <div className="text-white">🐝</div>
              </div>
            </div>
            <h1 className="text-amber-600 mb-2">Welcome to Hive</h1>
            <p className="text-gray-600">Create your account</p>
          </div>

          {/* Error Message Display */}
          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

          <form onSubmit={handleSignUp} className="mb-6">
            {/* New Full Name Field */}
            <div className="mb-4">
              <label htmlFor="signup-fullname" className="block text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="signup-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="signup-email" className="block text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="signup-password" className="block text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="signup-confirm-password" className="block text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="text-center">
            <span className="text-gray-600">Already have an account? </span>
            <button
              type="button"
              onClick={() => setShowSignUp(false)}
              className="text-amber-600 hover:text-amber-700"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 5. LOGIN SCREEN (Default) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
              <div className="text-white">🐝</div>
            </div>
          </div>
          <h1 className="text-amber-600 mb-2">Welcome to Hive</h1>
          <p className="text-gray-600">Your Academic Hub</p>
        </div>

        {/* Error Message Display */}
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleLogin} className="mb-6">
          <div className="mb-4">
            <label htmlFor="login-email" className="block text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="block text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="text-right mb-6">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-amber-600 hover:text-amber-700"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors mb-4 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

        </form>

        <div className="text-center">
          <span className="text-gray-600">Don't have an account? </span>
          <button
            type="button"
            onClick={() => setShowSignUp(true)}
            className="text-amber-600 hover:text-amber-700"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}