import React, { useState, useEffect } from 'react';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Key fix: track expanded state by appointment ID (apt.id) instead of email
    const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
    const [patientHistoryMap, setPatientHistoryMap] = useState({});
    const [loadingHistoryId, setLoadingHistoryId] = useState(null);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const email = storedUser.email || localStorage.getItem('userEmail') || '';
            
            const res = await fetch(`http://localhost:8000/api/doctor/appointments?email=${encodeURIComponent(email)}`);
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (err) {
            console.error("Error fetching appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleDeleteAppointment = async (id, patientName) => {
        if (!window.confirm(`Are you sure you want to delete the appointment for ${patientName}?`)) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:8000/api/doctor/appointments/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                // Remove deleted row immediately from state
                setAppointments(prev => prev.filter(apt => String(apt.id) !== String(id)));
                if (expandedAppointmentId === id) {
                    setExpandedAppointmentId(null);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to delete appointment: ${errData.detail || res.statusText}`);
            }
        } catch (err) {
            console.error("Error deleting appointment:", err);
            alert("Server error occurred while deleting.");
        }
    };

    const toggleHealthHistory = async (aptId, patientEmail) => {
        // Toggle close if clicking the currently open row
        if (expandedAppointmentId === aptId) {
            setExpandedAppointmentId(null);
            return;
        }

        setExpandedAppointmentId(aptId);

        // Fetch history if not already cached for this email
        if (!patientHistoryMap[patientEmail]) {
            setLoadingHistoryId(aptId);
            try {
                const res = await fetch(`http://localhost:8000/api/doctor/patient-history?patient_email=${encodeURIComponent(patientEmail)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPatientHistoryMap(prev => ({ ...prev, [patientEmail]: data }));
                }
            } catch (err) {
                console.error("Error fetching patient history:", err);
            } finally {
                setLoadingHistoryId(null);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Booked Patient Appointments</h1>
                    <p className="text-slate-400 text-xs mt-1">Review upcoming patient visits and analyze AI health history</p>
                </div>
                <button 
                    onClick={fetchAppointments}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs font-bold text-slate-600 transition"
                >
                    🔄 Refresh List
                </button>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-medium text-sm">Loading appointments...</div>
                ) : appointments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium text-sm">No appointments scheduled.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="p-4 pl-6">Patient Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Slot Time</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {appointments.map((apt) => {
                                const isExpanded = expandedAppointmentId === apt.id;
                                const historyData = patientHistoryMap[apt.patient_email];
                                const isLoadingThisHistory = loadingHistoryId === apt.id;

                                return (
                                    <React.Fragment key={apt.id}>
                                        {/* PATIENT ROW WITH HOVER DUSTBIN */}
                                        <tr className={`group hover:bg-slate-50/80 transition duration-150 ${isExpanded ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="p-4 pl-6 font-bold text-slate-900">{apt.patient_name}</td>
                                            <td className="p-4 font-mono text-xs text-slate-500">{apt.patient_email}</td>
                                            <td className="p-4">{apt.appointment_date}</td>
                                            <td className="p-4 font-semibold text-indigo-600">{apt.slot_time}</td>
                                            <td className="p-4 text-slate-500">{apt.reason || 'N/A'}</td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold">
                                                    {apt.status || 'Confirmed'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => toggleHealthHistory(apt.id, apt.patient_email)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                                                            isExpanded 
                                                                ? 'bg-slate-800 text-white hover:bg-slate-900' 
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                        }`}
                                                    >
                                                        {isExpanded ? 'Hide Health History' : 'View Health History'}
                                                    </button>

                                                    {/* TRASH / DUSTBIN BUTTON (HOVER VISIBILITY) */}
                                                    <button
                                                        onClick={() => handleDeleteAppointment(apt.id, apt.patient_name)}
                                                        title="Delete Appointment"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* EXPANDABLE HEALTH HISTORY ROW - TARGETED ONLY TO ACTIVE APPOINTMENT ID */}
                                        {isExpanded && (
                                            <tr className="bg-slate-50/80 border-b-2 border-indigo-100">
                                                <td colSpan="7" className="p-6">
                                                    {isLoadingThisHistory ? (
                                                        <div className="py-6 text-center text-slate-400 text-xs font-semibold animate-pulse">
                                                            Fetching medical history for {apt.patient_email}...
                                                        </div>
                                                    ) : historyData ? (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between border-b pb-2">
                                                                <span className="text-xs font-extrabold uppercase text-indigo-600 tracking-wider">
                                                                    📋 Clinical Diagnostics & History Overview
                                                                </span>
                                                                <span className="text-xs text-slate-400 font-mono">
                                                                    Patient: {apt.patient_email}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {/* 🧠 LAST MRI SCAN */}
                                                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                                                                🧠 Last Scanned MRI
                                                                            </span>
                                                                            {historyData.latest_mri?.date && (
                                                                                <span className="text-[10px] text-slate-400 font-mono">
                                                                                    {historyData.latest_mri.date.split('T')[0]}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {historyData.latest_mri ? (
                                                                            <div>
                                                                                {historyData.latest_mri.image_path && (
                                                                                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-900 h-32 flex items-center justify-center">
                                                                                        <img 
                                                                                            src={`http://localhost:8000/${historyData.latest_mri.image_path}`} 
                                                                                            alt="MRI Scan" 
                                                                                            className="h-full object-contain"
                                                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=MRI+Scan'; }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                                <p className="text-sm font-bold text-slate-800">{historyData.latest_mri.result}</p>
                                                                                <p className="text-xs font-semibold text-emerald-600 mt-1">
                                                                                    Confidence: {historyData.latest_mri.confidence}%
                                                                                </p>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400 italic py-4">No MRI scan records found for this patient.</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* 🗣️ LAST SPEECH BIOMARKER */}
                                                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                                                                                🗣️ Speech Biomarker
                                                                            </span>
                                                                            {historyData.latest_speech?.date && (
                                                                                <span className="text-[10px] text-slate-400 font-mono">
                                                                                    {historyData.latest_speech.date.split('T')[0]}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {historyData.latest_speech ? (
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-800 mt-2">{historyData.latest_speech.result}</p>
                                                                                <p className="text-xs font-semibold text-indigo-600 mt-1">
                                                                                    Confidence: {historyData.latest_speech.confidence}%
                                                                                </p>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400 italic py-4">No speech assessments recorded.</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* ⏰ MISSED REMINDERS */}
                                                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                                                                                ⏰ Missed Reminders
                                                                            </span>
                                                                        </div>

                                                                        {(!historyData.missed_reminders || historyData.missed_reminders.length === 0) ? (
                                                                            <p className="text-xs text-slate-400 italic py-4">No missed medication reminders.</p>
                                                                        ) : (
                                                                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                                                                {historyData.missed_reminders.map((rem, idx) => (
                                                                                    <div key={idx} className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 flex justify-between items-center text-xs">
                                                                                        <div>
                                                                                            <p className="font-bold text-slate-800">{rem.title}</p>
                                                                                            <p className="text-[10px] text-slate-400 font-mono">{rem.time}</p>
                                                                                        </div>
                                                                                        <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded text-[10px] font-bold">
                                                                                            Missed
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-4 text-center text-rose-500 text-xs font-semibold">
                                                            Failed to load health records.
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DoctorDashboard;