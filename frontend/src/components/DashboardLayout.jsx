import React, { useState } from 'react';
import DashboardOverviewPage from '../pages/DashboardOverviewPage';
import MriDetectionPage from '../pages/MriDetectionPage';
import ClinicalRiskPage from '../pages/ClinicalRiskPage';
import SpeechDetectionPage from '../pages/SpeechDetectionPage';
import EmotionDetectionPage from '../pages/EmotionDetectionPage'; 
import DoctorBookingPage from '../pages/DoctorBookingPage';

const DashboardLayout = () => {
    const [activeFeature, setActiveFeature] = useState('Dashboard');

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
            return <MriDetectionPage />;
        case 'Clinical Risk Assessment':
            return <ClinicalRiskPage />;
        case 'Speech Detection': 
            return <SpeechDetectionPage />;
        case 'Patient Emotion':
            return <EmotionDetectionPage />;
        case 'Doctor Appointment Booking': // Added for PostgreSQL Doctor Booking
            return <DoctorBookingPage />;
        default:
            return (
                <div className="text-gray-500 p-8 text-lg">
                    Feature <strong>{activeFeature}</strong> is under development.
                </div>
            );
    }
};

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-gray-100 flex flex-col p-6 shadow-xl shrink-0">
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
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">{activeFeature}</h2>
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
                        System Active
                    </span>
                </header>

                <div className="p-8 flex-1">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;