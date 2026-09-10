import React, { useState } from 'react';

export default function AuthPage({ onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('patient'); // 'patient' | 'caregiver' | 'doctor'
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const payload = {
      ...(isSignup && { name: formData.name }),
      email: formData.email,
      password: formData.password,
      role: activeRole,
    };

    const endpoint = isSignup 
      ? 'http://localhost:8000/api/auth/signup' 
      : 'http://localhost:8000/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Save logged in user details to localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Callback to parent component to transition into Dashboard
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl text-white">
        
        {/* Header Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">NeuroCareX Access</h2>
          <p className="text-slate-400 text-sm mt-1">Select your role to continue</p>
        </div>

        {/* Role Tab Switcher */}
        <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6 border border-slate-700/50">
          {['patient', 'caregiver', 'doctor'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setActiveRole(role);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                activeRole === role
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Login / Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder={`${activeRole}@neurocarex.com`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition shadow-lg mt-2"
          >
            {loading ? 'Processing...' : isSignup ? `Register as ${activeRole}` : `Login as ${activeRole}`}
          </button>
        </form>

        {/* Toggle between Login and Signup */}
        <div className="text-center mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setErrorMsg('');
            }}
            className="text-xs text-blue-400 hover:underline"
          >
            {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}