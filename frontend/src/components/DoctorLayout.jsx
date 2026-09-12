import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const DoctorLayout = ({ onLogout }) => {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        if (onLogout) {
            onLogout();
        } else {
            localStorage.clear();
        }
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md">👨‍⚕️</div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">NeuroCareX Doctor Portal</h1>
                        <p className="text-xs text-slate-400">Clinical Dashboard & Patient Insights</p>
                    </div>
                </div>

                <nav className="flex items-center gap-6">
                    <Link to="/doctor/dashboard" className="text-slate-600 hover:text-indigo-600 font-semibold text-sm transition">Appointments</Link>
                    <Link to="/doctor/profile" className="text-slate-600 hover:text-indigo-600 font-semibold text-sm transition">Profile Management</Link>
                    <button onClick={handleLogoutClick} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-sm rounded-xl transition">
                        Logout
                    </button>
                </nav>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default DoctorLayout;