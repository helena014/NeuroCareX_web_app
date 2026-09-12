// frontend/src/pages/doctor/DoctorProfile.jsx
import React, { useState, useEffect } from 'react';

const DoctorProfile = () => {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        specialty: 'Neurologist',
        experience: '5 Years',
        rating: 4.8,
        hospital: '',
        fee: '$100',
        available_slots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const email = storedUser.email || localStorage.getItem('userEmail') || '';
        const name = storedUser.name || '';
        
        setFormData(prev => ({ ...prev, email, name: prev.name || name }));

        if (email) {
            fetch(`http://localhost:8000/api/doctor/profile/${email}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data && data.doctor) {
                        setFormData(data.doctor);
                        localStorage.setItem('doctorId', data.doctor.id);
                    }
                })
                .catch(err => console.error("Error fetching doctor profile:", err));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ 
            ...formData, 
            [name]: name === 'rating' ? parseFloat(value) || 0 : value 
        });
    };

    const handleSlotChange = (index, value) => {
        const updatedSlots = [...formData.available_slots];
        updatedSlots[index] = value;
        setFormData({ ...formData, available_slots: updatedSlots });
    };

    const addSlot = () => {
        setFormData({ ...formData, available_slots: [...formData.available_slots, '05:00 PM'] });
    };

    const removeSlot = (index) => {
        const updatedSlots = formData.available_slots.filter((_, i) => i !== index);
        setFormData({ ...formData, available_slots: updatedSlots });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);
        try {
            const res = await fetch('http://localhost:8000/api/doctor/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.status === 'success') {
                localStorage.setItem('doctorId', data.doctor_id);
                setSaved(true);
                setTimeout(() => setSaved(false), 4000);
            }
        } catch (err) {
            console.error("Failed to save profile:", err);
            alert("Error saving profile details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Banner Dashboard */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                        Doctor Settings
                    </span>
                    <h1 className="text-3xl font-extrabold mt-3">{formData.name || 'Doctor Profile'}</h1>
                    <p className="text-slate-400 text-sm mt-1">{formData.hospital || 'Hospital details not set'} • {formData.specialty}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/80 px-6 py-4 rounded-2xl border border-slate-700">
                    <div className="text-center">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Rating</p>
                        <p className="text-xl font-bold text-amber-400 mt-0.5">⭐ {formData.rating}</p>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-700" />
                    <div className="text-center">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Fee</p>
                        <p className="text-xl font-bold text-emerald-400 mt-0.5">{formData.fee}</p>
                    </div>
                </div>
            </div>

            {saved && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
                    ✓ Doctor profile updated successfully!
                </div>
            )}

            {/* Main Form Dashboard Grid */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1 & 2: Main Info */}
                <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-4">Personal & Professional Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                            <input type="text" name="name" required placeholder="Dr. Jane Doe"
                                value={formData.name} onChange={handleChange}
                                className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                            <input type="email" name="email" required placeholder="doctor@clinic.com"
                                value={formData.email} onChange={handleChange}
                                className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium bg-slate-50" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Specialty</label>
                            <input type="text" name="specialty" required placeholder="Neurologist"
                                value={formData.specialty} onChange={handleChange}
                                className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Experience</label>
                            <input type="text" name="experience" required placeholder="8 Years"
                                value={formData.experience} onChange={handleChange}
                                className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hospital / Clinic</label>
                            <input type="text" name="hospital" required placeholder="St. Jude Medical Center"
                                value={formData.hospital} onChange={handleChange}
                                className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Consultation Fee</label>
                            <input type="text" name="fee" required placeholder="$120"
                                value={formData.fee} onChange={handleChange}
                                className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
                        </div>

                        {/* EDITABLE RATING FIELD */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Doctor Rating (1.0 - 5.0)</label>
                            <input type="number" step="0.1" min="1.0" max="5.0" name="rating" required placeholder="4.8"
                                value={formData.rating} onChange={handleChange}
                                className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button type="submit" disabled={loading} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition">
                            {loading ? "Saving Profile..." : "Save Profile Changes"}
                        </button>
                    </div>
                </div>

                {/* Column 3: Availability & Slots */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Available Slots</h3>
                            <button type="button" onClick={addSlot} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                + Add Slot
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Manage the standard consultation time slots offered to patients.</p>

                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                            {formData.available_slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input type="text" value={slot} onChange={(e) => handleSlotChange(idx, e.target.value)}
                                        className="flex-1 p-2.5 border rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <button type="button" onClick={() => removeSlot(idx)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg text-sm font-bold">
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
                            <strong>Note:</strong> Changes to slots will immediately update available booking options on the patient portal.
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DoctorProfile;