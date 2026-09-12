import React, { useEffect, useState } from 'react';

const CaregiverAppointments = ({ selectedPatient }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedPatient) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetch(`http://localhost:8000/api/caregiver/appointments?patient_email=${encodeURIComponent(selectedPatient)}`)
      .then((res) => res.json())
      .then((data) => {
        setAppointments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching appointments:", err);
        setLoading(false);
      });
  }, [selectedPatient]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Booked Doctor Appointments</h2>
            <p className="text-slate-400 text-xs mt-1">
              Review upcoming specialist visits booked by or for the patient
            </p>
          </div>
          {selectedPatient && (
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-medium">
              Patient: {selectedPatient}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-semibold">Loading appointments...</div>
        ) : !selectedPatient ? (
          <div className="p-12 text-center text-xs text-amber-600 bg-amber-50 font-medium">
            ⚠️ Please select or connect a patient from the top bar to view their appointments.
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-semibold">
            No appointments found for this patient.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Patient Name</th>
                <th className="p-4">Patient Email</th>
                <th className="p-4">Date</th>
                <th className="p-4">Slot Time</th>
                <th className="p-4">Reason</th>
                <th className="p-4 pr-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 pl-6 font-bold text-slate-900">{apt.patient_name}</td>
                  <td className="p-4 font-mono text-slate-500">{apt.patient_email}</td>
                  <td className="p-4">{apt.appointment_date}</td>
                  <td className="p-4 font-bold text-blue-600">{apt.slot_time}</td>
                  <td className="p-4 text-slate-500">{apt.reason || 'General Checkup'}</td>
                  <td className="p-4 pr-6 text-center">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[11px] font-bold">
                      {apt.status || 'Confirmed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CaregiverAppointments;