import React, { useState, useEffect } from 'react';

const ReminderPage = ({ user }) => {
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [frequency, setFrequency] = useState('Daily');
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState('');

    const getUserEmail = () => {
        if (user && user.email) return user.email;
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.email) return parsed.email;
            }
        } catch (e) {}
        return localStorage.getItem('userEmail') || 'guest@neurocarex.com';
    };

    const patientEmail = getUserEmail();

    // Fetch reminders from backend
    const fetchReminders = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/reminders/${encodeURIComponent(patientEmail)}`);
            if (!res.ok) throw new Error('Failed to fetch reminders');
            const data = await res.json();
            setReminders(data);
        } catch (err) {
            console.error('Error fetching reminders:', err);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReminders(true);
        const interval = setInterval(() => fetchReminders(false), 3000);

        const handleStatusChanged = () => fetchReminders(false);
        window.addEventListener('reminder-status-changed', handleStatusChanged);

        return () => {
            clearInterval(interval);
            window.removeEventListener('reminder-status-changed', handleStatusChanged);
        };
    }, [patientEmail]);

    const openAddModal = () => {
        setEditingReminder(null);
        setTitle('');
        setReminderDate(new Date().toISOString().split('T')[0]);
        setReminderTime('09:00');
        setFrequency('Daily');
        setNotes('');
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (rem) => {
        setEditingReminder(rem);
        setTitle(rem.title);
        setReminderDate(rem.reminder_date || new Date().toISOString().split('T')[0]);
        setReminderTime(rem.reminder_time || '09:00');
        setFrequency(rem.frequency || 'Daily');
        setNotes(rem.notes || '');
        setFormError('');
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setFormError('Please enter a reminder title.');
            return;
        }
        if (!reminderTime) {
            setFormError('Please select a reminder time.');
            return;
        }

        const payload = {
            patient_email: patientEmail,
            title: title.trim(),
            reminder_date: reminderDate || null,
            reminder_time: reminderTime,
            frequency: frequency,
            notes: notes.trim(),
            status: 'pending'
        };

        try {
            if (editingReminder) {
                // Update
                const res = await fetch(`http://localhost:8000/api/reminders/${editingReminder.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to update reminder');
            } else {
                // Create
                const res = await fetch('http://localhost:8000/api/reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to create reminder');
            }

            setIsModalOpen(false);
            fetchReminders();
        } catch (err) {
            setFormError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this reminder?')) return;
        try {
            const res = await fetch(`http://localhost:8000/api/reminders/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            fetchReminders();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleMarkStatus = async (id, status) => {
        try {
            const res = await fetch(`http://localhost:8000/api/reminders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed to update status');
            fetchReminders();
        } catch (err) {
            alert(err.message);
        }
    };

    // Filter reminders
    const filteredReminders = reminders.filter((rem) => {
        if (filterStatus === 'ALL') return true;
        return rem.status?.toUpperCase() === filterStatus;
    });

    const pendingCount = reminders.filter(r => r.status === 'pending').length;
    const takenCount = reminders.filter(r => r.status === 'taken').length;
    const missedCount = reminders.filter(r => r.status === 'missed').length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* HEADER TITLE & ACTION BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Patient Medication & Task Reminders</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Schedule daily medications, cognitive tasks, and care routines with voice-assisted alerts.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl text-sm shadow-md transition-all active:scale-95"
                >
                    <span className="text-lg">+</span>
                    <span>Add New Reminder</span>
                </button>
            </div>

            {/* METRICS SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reminders</p>
                        <p className="text-3xl font-extrabold text-slate-900 mt-1">{reminders.length}</p>
                    </div>
                    <span className="text-3xl p-3 bg-slate-100 rounded-xl">⏰</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Pending</p>
                        <p className="text-3xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
                    </div>
                    <span className="text-3xl p-3 bg-amber-50 rounded-xl">⏳</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Completed / Taken</p>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-1">{takenCount}</p>
                    </div>
                    <span className="text-3xl p-3 bg-emerald-50 rounded-xl">✅</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Missed</p>
                        <p className="text-3xl font-extrabold text-rose-600 mt-1">{missedCount}</p>
                    </div>
                    <span className="text-3xl p-3 bg-rose-50 rounded-xl">⚠️</span>
                </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex border-b border-slate-200 space-x-2">
                {['ALL', 'PENDING', 'TAKEN', 'MISSED'].map((st) => (
                    <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                            filterStatus === st
                                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                        }`}
                    >
                        {st}
                    </button>
                ))}
            </div>

            {/* REMINDERS LIST */}
            {isLoading ? (
                <div className="p-12 text-center text-slate-400">
                    <div className="inline-block animate-spin text-3xl mb-2">⏳</div>
                    <p className="text-sm font-medium">Loading reminders from database...</p>
                </div>
            ) : filteredReminders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <span className="text-4xl block mb-3">🔔</span>
                    <h4 className="text-lg font-bold text-slate-800">No Reminders Found</h4>
                    <p className="text-slate-500 text-sm mt-1 mb-6">
                        {filterStatus === 'ALL'
                            ? "You haven't scheduled any reminders yet."
                            : `No reminders matching status "${filterStatus}".`}
                    </p>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow transition"
                    >
                        + Create Your First Reminder
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReminders.map((rem) => {
                        let statusColor = 'bg-amber-100 text-amber-800 border-amber-300';
                        if (rem.status === 'taken') statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        if (rem.status === 'missed') statusColor = 'bg-rose-100 text-rose-800 border-rose-300';

                        return (
                            <div
                                key={rem.id}
                                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="p-2.5 bg-orange-50 text-orange-600 rounded-xl text-xl font-bold">
                                                💊
                                            </span>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-base">{rem.title}</h4>
                                                <span
                                                    className={`inline-block px-2.5 py-0.5 mt-1 text-[10px] font-bold rounded-full border uppercase ${statusColor}`}
                                                >
                                                    {rem.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {rem.notes && (
                                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {rem.notes}
                                        </p>
                                    )}

                                    <div className="text-xs text-slate-500 space-y-1 pt-2">
                                        <div className="flex items-center gap-2">
                                            <span>⏰</span>
                                            <strong className="text-slate-800 font-semibold">{rem.reminder_time}</strong>
                                            <span className="text-slate-400">({rem.frequency})</span>
                                        </div>
                                        {rem.reminder_date && (
                                            <div className="flex items-center gap-2">
                                                <span>📅</span>
                                                <span>{rem.reminder_date}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between gap-2">
                                    {rem.status === 'pending' ? (
                                        <button
                                            onClick={() => handleMarkStatus(rem.id, 'taken')}
                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition shadow-sm"
                                        >
                                            ✓ Mark as Taken
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleMarkStatus(rem.id, 'pending')}
                                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition"
                                        >
                                            Reset Pending
                                        </button>
                                    )}

                                    <button
                                        onClick={() => openEditModal(rem)}
                                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
                                        title="Edit Reminder"
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(rem.id)}
                                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                                        title="Delete Reminder"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ADD / EDIT REMINDER MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="text-lg font-bold text-slate-900">
                                {editingReminder ? 'Edit Reminder' : 'Add New Patient Reminder'}
                            </h4>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Reminder Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Take Donepezil 10mg Tablet"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                        Time (HH:MM) *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={reminderTime}
                                        onChange={(e) => setReminderTime(e.target.value)}
                                        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                        Frequency
                                    </label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    >
                                        <option value="Daily">Daily</option>
                                        <option value="Once">Once</option>
                                        <option value="Weekly">Weekly</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={reminderDate}
                                    onChange={(e) => setReminderDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Notes & Special Instructions
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="e.g., Take with a glass of water after breakfast."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition shadow-md"
                                >
                                    {editingReminder ? 'Update Reminder' : 'Save Reminder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReminderPage;
