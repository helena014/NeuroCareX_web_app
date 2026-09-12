import React, { useEffect, useState } from 'react';

// Make sure selectedPatient is inside the props object here:
const CaregiverDashboard = ({ selectedPatient, setActiveTab }) => {
  const [stats, setStats] = useState({
    totalReminders: 0,
    missedReminders: 0,
    upcomingAppointments: 0,
    patientStatus: 'Safe (Home Zone)',
  });

  useEffect(() => {
    if (!selectedPatient) return;

    fetch(`http://localhost:8000/api/caregiver/dashboard-stats?patient_email=${encodeURIComponent(selectedPatient)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setStats((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error("Error loading stats:", err));
  }, [selectedPatient]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-2xl text-white shadow-lg border border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
          Caregiver Portal
        </span>
        <h1 className="text-3xl font-extrabold mt-3">Patient Monitoring Dashboard</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          {selectedPatient 
            ? `Currently viewing active telemetry & schedules for: ${selectedPatient}` 
            : 'No patient connected. Use the top bar "+ Connect" field to attach a patient.'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-3xl p-3 bg-blue-50 rounded-xl">⏰</div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Active Reminders</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalReminders}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-3xl p-3 bg-rose-50 rounded-xl">🚨</div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Missed Doses</p>
            <p className="text-2xl font-black text-rose-600">{stats.missedReminders}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-3xl p-3 bg-indigo-50 rounded-xl">📅</div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Appointments</p>
            <p className="text-2xl font-black text-slate-800">{stats.upcomingAppointments}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-3xl p-3 bg-emerald-50 rounded-xl">📍</div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Geofence Status</p>
            <p className="text-sm font-bold text-emerald-600 mt-1">{stats.patientStatus}</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div 
          onClick={() => setActiveTab('Reminder')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-3xl p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition">⏰</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Manage Schedule</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-4">Medication Reminders</h3>
          <p className="text-xs text-slate-500 mt-1">
            Add or review daily medication timers. Created reminders automatically sync to the patient's device.
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('Doctor Appointment')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-3xl p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition">📅</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">View Bookings</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-4">Patient Appointments</h3>
          <p className="text-xs text-slate-500 mt-1">
            Monitor upcoming clinical appointments and specialist visits.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaregiverDashboard;