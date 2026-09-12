import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Authentication Page
import AuthPage from './pages/AuthPage';

// Doctor Pages & Layout
import DoctorLayout from './components/DoctorLayout';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Layout Components
import DashboardLayout from './components/DashboardLayout'; // Patient Layout
import CaregiverLayout from './components/CaregiverLayout'; // Caregiver Layout

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
    localStorage.removeItem('doctorId');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* If not logged in, show AuthPage */}
        {!user ? (
          <Route path="*" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
        ) : (
          <>
            {/* PATIENT ROLE */}
            {user.role === 'patient' && (
              <Route path="*" element={<DashboardLayout user={user} onLogout={handleLogout} />} />
            )}

            {/* CAREGIVER ROLE */}
            {user.role === 'caregiver' && (
              <Route
                path="*"
                element={<CaregiverLayout user={user} onLogout={handleLogout} />}
              />
            )}

            {/* DOCTOR ROLE (Using react-router-dom routes) */}
            {user.role === 'doctor' && (
              <>
                <Route path="/doctor" element={<DoctorLayout onLogout={handleLogout} />}>
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="profile" element={<DoctorProfile />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
                {/* Fallback to /doctor/dashboard for any other route */}
                <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
              </>
            )}
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}