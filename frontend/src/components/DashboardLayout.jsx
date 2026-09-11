import React, { useState, useEffect, useRef } from 'react';
import DashboardOverviewPage from '../pages/DashboardOverviewPage';
import MriDetectionPage from '../pages/MriDetectionPage';
import ClinicalRiskPage from '../pages/ClinicalRiskPage';
import SpeechDetectionPage from '../pages/SpeechDetectionPage';
import EmotionDetectionPage from '../pages/EmotionDetectionPage'; 
import DoctorBookingPage from '../pages/DoctorBookingPage';
import ReminderPage from '../pages/ReminderPage';
import DueReminderModal from './DueReminderModal';

const DashboardLayout = ({ user, onLogout }) => {
    const [activeFeature, setActiveFeature] = useState('Dashboard');
    const [dueReminder, setDueReminder] = useState(null);
    const alertedIdsRef = useRef(new Set());

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

    // Global user interaction listener to unpause speech synthesis engine
    useEffect(() => {
        const unlockAudio = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.resume();
            }
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    // Global background interval checking for due reminders
    useEffect(() => {
        const checkReminders = async () => {
            if (dueReminder) return; // If alert modal is currently open, don't trigger another one

            try {
                const res = await fetch(`http://localhost:8000/api/reminders/${encodeURIComponent(patientEmail)}`);
                if (!res.ok) return;
                const list = await res.json();

                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                const currentHours = String(now.getHours()).padStart(2, '0');
                const currentMinutes = String(now.getMinutes()).padStart(2, '0');
                const currentTimeStr = `${currentHours}:${currentMinutes}`;

                const due = list.find((rem) => {
                    if (rem.status !== 'pending') return false;
                    
                    const remTime = rem.reminder_time; // "HH:MM"
                    if (!remTime) return false;

                    // Date check: if specific date is set and not today, skip
                    if (rem.reminder_date && rem.reminder_date !== todayStr) {
                        return false;
                    }

                    // Format remTime HH:MM
                    const parts = remTime.split(':');
                    const paddedRemTime = `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;

                    // Composite key includes time so editing time allows alert to fire again at new time
                    const reminderKey = `${rem.id}_${paddedRemTime}_${rem.reminder_date || 'daily'}_${todayStr}`;
                    if (alertedIdsRef.current.has(reminderKey)) return false;

                    return paddedRemTime <= currentTimeStr;
                });

                if (due) {
                    const parts = due.reminder_time.split(':');
                    const paddedRemTime = `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
                    const dueKey = `${due.id}_${paddedRemTime}_${due.reminder_date || 'daily'}_${todayStr}`;
                    alertedIdsRef.current.add(dueKey);
                    setDueReminder(due);
                }
            } catch (err) {
                console.error('Error checking due reminders:', err);
            }
        };

        checkReminders();
        const interval = setInterval(checkReminders, 3000); // Poll every 3 seconds for fast reaction
        return () => clearInterval(interval);
    }, [patientEmail, dueReminder]);

    const handleMarkTaken = async (id) => {
        try {
            await fetch(`http://localhost:8000/api/reminders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'taken' })
            });
            window.dispatchEvent(new CustomEvent('reminder-status-changed', { detail: { id, status: 'taken' } }));
        } catch (err) {
            console.error('Error marking reminder taken:', err);
        } finally {
            setDueReminder(null);
        }
    };

    const handleTimeoutMissed = async (id) => {
        try {
            await fetch(`http://localhost:8000/api/reminders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'missed' })
            });
            window.dispatchEvent(new CustomEvent('reminder-status-changed', { detail: { id, status: 'missed' } }));
        } catch (err) {
            console.error('Error marking reminder missed:', err);
        } finally {
            setDueReminder(null);
        }
    };

    const featureLinks = [
        { name: 'Dashboard', icon: '📊' },
        { name: 'Clinical Risk Assessment', icon: '📋' },
        { name: 'MRI Scan Detection', icon: '🧠' },
        { name: 'Speech Detection', icon: '🗣️' },
        { name: 'Patient Emotion', icon: '🎭' }, 
        { name: 'Reminder', icon: '⏰' },
        { name: 'Face Recognition', icon: '👤' },
        { name: 'Location Tracking', icon: '📍' },
        { name: 'Doctor Appointment Booking', icon: '📅' },
        { name: 'Memory Games', icon: '🎮' },
        { name: 'Chatbot', icon: '💬' }
    ];

    const renderContent = () => {
        switch (activeFeature) {
            case 'Dashboard':
                return <DashboardOverviewPage setActiveFeature={setActiveFeature} />;
            case 'MRI Scan Detection':
                return <MriDetectionPage user={user} />;
            case 'Clinical Risk Assessment':
                return <ClinicalRiskPage />;
            case 'Speech Detection': 
                return <SpeechDetectionPage user={user} />;
            case 'Patient Emotion':
                return <EmotionDetectionPage />;
            case 'Reminder':
                return <ReminderPage user={user} />;
            case 'Doctor Appointment Booking':
                return <DoctorBookingPage user={user} />;
            default:
                return (
                    <div className="text-gray-500 p-8 text-lg">
                        Feature <strong>{activeFeature}</strong> is under development.
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans relative">
            {/* REAL-TIME DUE REMINDER POPUP MODAL */}
            {dueReminder && (
                <DueReminderModal
                    reminder={dueReminder}
                    onMarkTaken={handleMarkTaken}
                    onTimeoutMissed={handleTimeoutMissed}
                />
            )}

            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-gray-100 flex flex-col p-6 shadow-xl shrink-0 z-20">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-wide">NeuroCareX</h1>
                    <p className="text-xs text-slate-400 mt-1">Alzheimer's Support System</p>
                </div>

                <nav className="flex-grow space-y-1 overflow-y-auto no-scrollbar">
                    {featureLinks.map((feature) => (
                        <button
                            key={feature.name}
                            onClick={() => setActiveFeature(feature.name)}
                            className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                activeFeature === feature.name
                                    ? 'bg-orange-500 text-white shadow-md font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <span className="mr-3 text-lg">{feature.icon}</span>
                            <span className="truncate">{feature.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="border-t border-slate-800 pt-4 mt-auto flex items-center space-x-3 text-xs text-slate-400">
                    <div className="w-8 h-8 rounded-full bg-orange-600/20 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400">
                        NC
                    </div>
                    <div>
                        <p className="font-semibold text-slate-200">Final Year Project</p>
                        <p className="text-slate-500">NeuroCareX </p>
                    </div>
                </div>
            </aside>

            {/* RIGHT MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col overflow-y-auto z-10">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                    <h2 className="text-xl font-bold text-slate-800">{activeFeature}</h2>
                    
                    <div className="flex items-center gap-4">
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 hidden sm:inline-block">
                            System Active
                        </span>

                        {user && (
                            <div className="text-right border-l pl-4 border-gray-200">
                                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
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

                <div className={`p-8 flex-1 transition-all duration-300 ${dueReminder ? 'blur-md pointer-events-none' : ''}`}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;