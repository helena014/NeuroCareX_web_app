import React from 'react';

const DashboardOverviewPage = ({ setActiveFeature }) => {
  const capabilities = [
    {
      title: 'MRI Brain Scan AI',
      desc: 'Deep learning classification for early-stage Alzheimer’s and structural brain atrophy.',
      icon: '🧠',
      badge: 'Vision AI',
      target: 'MRI Scan Detection'
    },
    {
      title: 'Speech Biomarker Analysis',
      desc: 'Acoustic and phonetic analysis detecting subtle voice tremors and cognitive pauses.',
      icon: '🗣️',
      badge: 'Audio AI',
      target: 'Speech Detection'
    },
    {
      title: 'Real-Time Emotion Tracking',
      desc: 'Computer vision streaming via WebSocket to monitor affective states and facial expression.',
      icon: '🎭',
      badge: 'Live Stream',
      target: 'Patient Emotion'
    },
    {
      title: 'Clinical Risk Engine',
      desc: 'Multi-variable risk scoring combining demographic, cognitive, and health history metrics.',
      icon: '📋',
      badge: 'Predictive Engine',
      target: 'Clinical Risk Assessment'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center">
            <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-400/20 backdrop-blur-sm">
              Next-Gen Neuro-Diagnostic System
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome to NeuroCareX
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            An integrated multi-modal AI platform empowering patients, caregivers, and clinicians with early detection, continuous affective monitoring, and streamlined specialist care.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveFeature && setActiveFeature('MRI Scan Detection')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-md transition-all duration-200"
            >
              Start MRI Analysis
            </button>
            <button 
              onClick={() => setActiveFeature && setActiveFeature('Doctor Appointment Booking')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium text-sm rounded-lg transition-all duration-200"
            >
              Consult Specialist
            </button>
          </div>
        </div>
      </div>

      {/* 2. Platform Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'AI Diagnostic Precision', value: '94.2%', icon: '🎯' },
          { label: 'Multi-Modal Models', value: '4 Engines', icon: '⚡' },
          { label: 'Real-time Processing', value: '< 150ms', icon: '⏱️' },
          { label: 'Database Status', value: 'PostgreSQL Live', icon: '🛢️' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="text-3xl p-2 bg-blue-50 rounded-lg">{stat.icon}</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className="text-lg font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. About NeuroCareX Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>ℹ️</span> About NeuroCareX
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-base">Vision & Objective</h3>
            <p className="leading-relaxed">
              NeuroCareX bridges the gap between early neurodegenerative symptoms and clinical diagnosis using deep learning and non-invasive biomarker analysis.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-base">Multi-Modal Biomarkers</h3>
            <p className="leading-relaxed">
              By evaluating neuroimaging, voice pattern degradation, facial emotion dynamics, and clinical history, the system forms a comprehensive risk profile.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-base">Connected Care</h3>
            <p className="leading-relaxed">
              Integrated doctor scheduling backed by PostgreSQL enables rapid response transitions from diagnostic flags to professional medical consultation.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Core Features Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Core Diagnostic Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {capabilities.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveFeature && setActiveFeature(item.target)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition">{item.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Launch Module</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;