import React, { useState, useEffect } from 'react';

// Authentication Page
import AuthPage from './pages/AuthPage';

// Layout Components (All placed in src/components/)
import DashboardLayout from './components/DashboardLayout'; // Patient Layout
import CaregiverLayout from './components/CaregiverLayout'; // Caregiver Layout
import DoctorLayout from './components/DoctorLayout';       // Doctor Layout

export default function App() {
  const [user, setUser] = useState(null);

  // Load user session on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    setUser(null);
  };

  // 1. Show Auth Page if no user is logged in
  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Render Patient Portal (Your existing Dashboard Layout)
  if (user.role === 'patient') {
    return <DashboardLayout user={user} onLogout={handleLogout} />;
  }

  // 3. Render Caregiver Dashboard (Placeholder until you build it)
  if (user.role === 'caregiver') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-lg text-center shadow-xl">
          <span className="text-4xl mb-4 block">🤝</span>
          <h1 className="text-2xl font-bold mb-2">Caregiver Dashboard</h1>
          <p className="text-slate-400 text-sm mb-6">
            Welcome, <strong className="text-white">{user.name}</strong>! The Caregiver monitoring suite is currently under development.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // 4. Render Doctor Dashboard (Placeholder until you build it)
  if (user.role === 'doctor') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-lg text-center shadow-xl">
          <span className="text-4xl mb-4 block">👨‍⚕️</span>
          <h1 className="text-2xl font-bold mb-2">Doctor Portal</h1>
          <p className="text-slate-400 text-sm mb-6">
            Welcome, <strong className="text-white">{user.name}</strong>! The Doctor clinical management portal is currently under development.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return null;
}