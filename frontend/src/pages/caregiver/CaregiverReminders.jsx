import React, { useState, useEffect } from 'react';

const CaregiverReminders = ({ selectedPatient }) => {
  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [dosage, setDosage] = useState('');

  const fetchReminders = async () => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`http://localhost:8000/api/caregiver/reminders?patient_email=${encodeURIComponent(selectedPatient)}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [selectedPatient]);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!title || !time || !selectedPatient) return;

    try {
      const res = await fetch('http://localhost:8000/api/caregiver/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          time,
          dosage: dosage || '1 dose',
          created_by: 'Caregiver',
          patient_email: selectedPatient,
        }),
      });

      if (res.ok) {
        setTitle('');
        setTime('');
        setDosage('');
        fetchReminders();
      }
    } catch (err) {
      console.error("Error creating reminder:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Create Reminder Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <span>➕</span> Set Reminder for Patient
        </h2>
        {!selectedPatient && (
          <p className="text-xs text-amber-600 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            ⚠️ Please select or connect a patient in the top navigation bar to create reminders.
          </p>
        )}
        <form onSubmit={handleAddReminder} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Medication Name / Task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            required
            disabled={!selectedPatient}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            required
            disabled={!selectedPatient}
          />
          <input
            type="text"
            placeholder="Dosage (e.g. 500mg)"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={!selectedPatient}
          />
          <button
            type="submit"
            disabled={!selectedPatient}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl px-4 py-2.5 shadow-sm transition"
          >
            Add to Patient Ring System
          </button>
        </form>
      </div>

      {/* Reminders List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">Active Patient Schedules</h3>
          <span className="text-xs text-slate-400 font-medium">Syncing live with patient portal</span>
        </div>

        <div className="divide-y divide-slate-100">
          {reminders.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No active medication reminders found.</p>
          ) : (
            reminders.map((rem) => (
              <div key={rem.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <div className="text-2xl p-2.5 bg-blue-50 text-blue-600 rounded-xl">⏰</div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{rem.title}</h4>
                    <p className="text-xs text-slate-400">Dosage: {rem.dosage || 'Standard'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    {rem.time}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      rem.created_by === 'Caregiver'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    Set by {rem.created_by || 'Patient'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CaregiverReminders;