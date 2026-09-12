import React from 'react';

const DashboardOverviewPage = ({ setActiveFeature }) => {
  // All 10 Features mapped to their exact sidebar target names
  const allFeatures = [
    {
      category: 'Diagnostics & Assessment',
      items: [
        {
          title: 'Clinical Risk Assessment',
          desc: 'Multi-variable risk scoring combining demographic, cognitive, and health history metrics.',
          icon: '📋',
          badge: 'Predictive Engine',
          target: 'Clinical Risk Assessment'
        },
        {
          title: 'MRI Scan Detection',
          desc: 'Deep learning classification for early-stage Alzheimer’s and structural brain atrophy.',
          icon: '🧠',
          badge: 'Vision AI',
          target: 'MRI Scan Detection'
        },
        {
          title: 'Speech Detection',
          desc: 'Acoustic and phonetic analysis detecting subtle voice tremors and cognitive pauses.',
          icon: '🗣️',
          badge: 'Audio AI',
          target: 'Speech Detection'
        },
        {
          title: 'Patient Emotion',
          desc: 'Computer vision streaming via webcam to monitor affective states and facial expression dynamics.',
          icon: '🎭',
          badge: 'Live Stream',
          target: 'Patient Emotion'
        }
      ]
    },
    {
      category: 'Daily Assistance & Safety',
      items: [
        {
          title: 'Medication Reminders',
          desc: 'Automated dosage scheduling and adherence tracking for critical medications.',
          icon: '⏰',
          badge: 'Schedule',
          target: 'Reminder'
        },
        {
          title: 'Face Recognition',
          desc: 'Facial recognition helper assisting patients in identifying family, friends, and care providers.',
          icon: '👤',
          badge: 'Identity AI',
          target: 'Face Recognition'
        },
        {
          title: 'Location Tracking',
          desc: 'Real-time GPS tracking and geofencing safeguards for patient safety and wandering prevention.',
          icon: '📍',
          badge: 'GPS Safeguard',
          target: 'Location Tracking'
        }
      ]
    },
    {
      category: 'Care & Interaction',
      items: [
        {
          title: 'Doctor Appointment Booking',
          desc: 'Schedule consultations with specialists based on automated AI diagnostic risk reports.',
          icon: '📅',
          badge: 'Telehealth',
          target: 'Doctor Appointment Booking'
        },
        {
          title: 'Cognitive Memory Games',
          desc: 'Interactive neuro-rehabilitation games designed to stimulate cognitive function and memory retention.',
          icon: '🎮',
          badge: 'Cognitive Rehab',
          target: 'Memory Games'
        },
        {
          title: 'AI Companion Chatbot',
          desc: '24/7 conversational support agent answering medical questions and guiding patient tasks.',
          icon: '💬',
          badge: 'Conversational',
          target: 'Chatbot'
        }
      ]
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
            An integrated multi-modal AI platform empowering patients, caregivers, and clinicians with early detection, continuous affective monitoring, daily safeguards, and streamlined specialist care.
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
          { label: 'AI Diagnostic Precision', value: 'ML/DL models', icon: '🎯' },
          { label: 'Integrated Modules', value: '10 Features', icon: '⚡' },
          { label: 'Real-time Latency', value: '< efficient', icon: '⏱️' },
          { label: 'Database Status', value: 'Active', icon: '🛢️' },
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
              Integrated doctor scheduling backed by database enables rapid response transitions from diagnostic flags to professional medical consultation.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Complete Platform Modules (All 10 Features Categorized) */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">All NeuroCareX Modules</h2>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">10 Functional Modules</span>
        </div>

        {allFeatures.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              {section.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {section.items.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveFeature && setActiveFeature(item.target)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
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
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverviewPage;