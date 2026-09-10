import React, { useState } from 'react';

export default function CaregiverLayout({ user, onLogout }) {
  const [activeFeature, setActiveFeature] = useState('Dashboard');

  const featureLinks = [
    { name: 'Dashboard', icon: '📊' }
  ];

  const renderContent = () => {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white shadow-xl">
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Caregiver Portal
          </span>
          <h1 className="text-3xl font-extrabold mt-4">Welcome back, {user?.name || 'Caregiver'}</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Monitor patient progress, view diagnostic history logs, and track activity reminders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Patients</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">1 Active</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Recent Diagnostics</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">2 Pending Review</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Alert Status</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">Normal</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-gray-100 flex flex-col p-6 shadow-xl shrink-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">NeuroCareX</h1>
          <p className="text-xs text-blue-400 font-semibold mt-1">Caregiver Portal</p>
        </div>

        <nav className="flex-grow space-y-1 overflow-y-auto no-scrollbar">
          {featureLinks.map((feature) => (
            <button
              key={feature.name}
              onClick={() => setActiveFeature(feature.name)}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeFeature === feature.name
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">{feature.icon}</span>
              <span className="truncate">{feature.name}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-auto flex items-center space-x-3 text-xs text-slate-400">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
            CG
          </div>
          <div>
            <p className="font-semibold text-slate-200">Caregiver Access</p>
            <p className="text-slate-500">NeuroCareX</p>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">{activeFeature}</h2>
          
          <div className="flex items-center gap-4">
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200 hidden sm:inline-block">
              Caregiver Active
            </span>

            {user && (
              <div className="text-right border-l pl-4 border-gray-200">
                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-blue-600 font-medium capitalize">{user.role}</p>
              </div>
            )}

            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-8 flex-1">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}