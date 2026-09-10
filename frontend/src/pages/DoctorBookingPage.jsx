import React, { useState, useEffect } from 'react';

const DoctorBookingPage = ({ user }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [reason, setReason] = useState('');
  const [attachAiHistory, setAttachAiHistory] = useState(true);

  const [loading, setLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto populate logged in patient details
  useEffect(() => {
    let uName = user?.name;
    let uEmail = user?.email;

    if (!uEmail) {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          uName = uName || parsed?.name;
          uEmail = uEmail || parsed?.email;
        }
      } catch (e) {}
    }

    if (uName) setPatientName(uName);
    if (uEmail) setPatientEmail(uEmail);
  }, [user]);

  // Fetch doctor list from PostgreSQL on component load
  useEffect(() => {
    fetch('http://localhost:8000/api/doctors')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch doctor network');
        return res.json();
      })
      .then((data) => setDoctors(data))
      .catch((err) => setErrorMessage('Unable to connect to doctor network: ' + err.message));
  }, []);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot || !selectedDate) {
      alert('Please select a doctor, date, and time slot.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const payload = {
      doctor_id: selectedDoctor.id,
      patient_name: patientName,
      patient_email: patientEmail,
      date: selectedDate,
      slot: selectedSlot,
      reason: reason,
      attach_ai_history: attachAiHistory
    };

    try {
      const response = await fetch('http://localhost:8000/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setConfirmedBooking(data.booking);
      } else {
        setErrorMessage(data.detail || 'Failed to complete appointment booking.');
      }
    } catch (err) {
      setErrorMessage('Network error while booking appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Doctor Appointment Booking</h1>
        <p className="text-gray-600">Connect with specialized neurologists and schedule consultations.</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>
      )}

      {confirmedBooking ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-bold text-green-800">Appointment Confirmed!</h2>
          <p className="text-gray-700 text-sm">
            Booking ID: <strong className="font-mono">{confirmedBooking.id}</strong>
          </p>
          <p className="text-gray-700 text-sm">
            Consultation with doctor ID <strong>#{confirmedBooking.doctor_id}</strong> on <strong>{confirmedBooking.date}</strong> at <strong>{confirmedBooking.slot}</strong>.
          </p>
          {confirmedBooking.attach_ai_history && (
            <p className="text-xs text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-200">
              🧠 NeuroCareX AI diagnostic history (MRI, Speech, Emotion) linked to appointment record.
            </p>
          )}
          <br />
          <button 
            onClick={() => {
              setConfirmedBooking(null);
              setSelectedDoctor(null);
              setSelectedSlot('');
            }}
            className="mt-4 px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Book Another Consultation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doctor List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">1. Select Specialist</h2>
            {doctors.map((doc) => (
              <div 
                key={doc.id} 
                onClick={() => {
                  setSelectedDoctor(doc);
                  setSelectedSlot('');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDoctor?.id === doc.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{doc.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold">{doc.specialty}</p>
                    <p className="text-xs text-gray-500 mt-1">{doc.hospital} • {doc.experience} exp</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">
                    ⭐ {doc.rating}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500 font-medium">
                  Consultation Fee: <span className="text-gray-800 font-bold">{doc.fee}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Form */}
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {selectedDoctor ? `2. Book with ${selectedDoctor.name}` : '2. Fill Appointment Details'}
            </h2>

            {selectedDoctor ? (
              <form onSubmit={handleBookingSubmit} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Patient Full Name</label>
                  <input 
                    type="text" 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Patient Email</label>
                  <input 
                    type="email" 
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Available Time Slots</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDoctor.available_slots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 text-xs rounded-lg border text-center font-medium ${
                          selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason for Visit</label>
                  <textarea 
                    rows="2" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe symptoms or clinical notes..." 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="attachAi" 
                    checked={attachAiHistory}
                    onChange={(e) => setAttachAiHistory(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="attachAi" className="text-xs text-gray-600">
                    Include NeuroCareX AI records (MRI, Speech, Emotion)
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors disabled:bg-blue-300"
                >
                  {loading ? 'Saving to Database...' : 'Confirm & Schedule Appointment'}
                </button>
              </form>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-lg">
                Select a doctor from the left panel to proceed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorBookingPage;