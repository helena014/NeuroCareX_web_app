import React, { useState, useEffect } from 'react';
import CaregiverDashboard from '../pages/caregiver/CaregiverDashboard';
import CaregiverReminders from '../pages/caregiver/CaregiverReminders';
import CaregiverAppointments from '../pages/caregiver/CaregiverAppointments';

const CaregiverLayout = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const caregiverEmail = storedUser.email || '';

  const loadPatients = async () => {
    if (!caregiverEmail) return;
    try {
      const res = await fetch(`http://localhost:8000/api/caregiver/linked-patients?caregiver_email=${encodeURIComponent(caregiverEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0 && !selectedPatient) {
          setSelectedPatient(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching linked patients:", err);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [caregiverEmail]);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    if (!newPatientEmail.trim()) return;

    try {
      const res = await fetch('http://localhost:8000/api/caregiver/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiver_email: caregiverEmail,
          patient_email: newPatientEmail.trim(),
        }),
      });

      if (res.ok) {
        const addedEmail = newPatientEmail.trim();
        setNewPatientEmail('');
        await loadPatients();
        setSelectedPatient(addedEmail);
      }
    } catch (err) {
      console.error("Failed to link patient:", err);
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Reminder', icon: '⏰' },
    { name: 'Doctor Appointment', icon: '📅' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shadow-xl z-20">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-2">
              <span className="text-blue-500">NeuroCareX</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Caregiver Portal</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === item.name
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">CG</div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{storedUser.name || 'Caregiver User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{caregiverEmail}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Dynamic Patient Linking & Switcher */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10 gap-4">
          <h2 className="text-lg font-bold text-slate-800">{activeTab}</h2>

          <div className="flex items-center gap-3">
            {/* Link New Patient Form */}
            <form onSubmit={handleLinkPatient} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Connect patient email..."
                value={newPatientEmail}
                onChange={(e) => setNewPatientEmail(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
              >
                + Connect
              </button>
            </form>

            {/* Select Active Patient Dropdown */}
            {patients.length > 0 && (
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {patients.map((pat) => (
                  <option key={pat} value={pat}>
                    👤 Patient: {pat}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onLogout || (() => { localStorage.clear(); window.location.href = '/'; })}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* View Pages */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'Dashboard' && (
            <CaregiverDashboard selectedPatient={selectedPatient} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'Reminder' && (
            <CaregiverReminders selectedPatient={selectedPatient} />
          )}
          {activeTab === 'Doctor Appointment' && (
            <CaregiverAppointments selectedPatient={selectedPatient} />
          )}
        </main>
      </div>
    </div>
  );
};

export default CaregiverLayout;