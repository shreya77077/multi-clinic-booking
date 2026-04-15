"use client";
import { useEffect, useState } from 'react';
import { getUser, logout } from '@/lib/auth';
import { clinicAPI, doctorAPI, schedulingAPI, appointmentAPI } from '@/lib/api';

export default function PatientDashboard() {
  const user = getUser();
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tab, setTab] = useState<'book' | 'my'>('book');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) { window.location.href = '/login'; return; }
    clinicAPI.getAll().then(r => setClinics(r.clinics || []));
    appointmentAPI.getMine().then(r => setAppointments(r.appointments || []));
  }, []);

  const handleClinicSelect = async (clinic: any) => {
    setSelectedClinic(clinic);
    setSelectedDoctor(null);
    setSlots([]);
    const res = await doctorAPI.getByClinic(clinic.id);
    setDoctors(res.doctors || []);
  };

  const handleGetSlots = async () => {
    if (!selectedDoctor || !date) return;
    const res = await schedulingAPI.getSlots(selectedDoctor.doctor_profiles.id, selectedClinic.id, date);
    setSlots(res.slots || []);
  };

  const handleBook = async (slot: any) => {
    const res = await appointmentAPI.book({
      doctor_id: selectedDoctor.doctor_profiles.id,
      clinic_id: selectedClinic.id,
      appointment_date: date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
    if (res.appointment) {
      setMessage('✅ Appointment booked successfully!');
      appointmentAPI.getMine().then(r => setAppointments(r.appointments || []));
      setSlots(slots.map(s => s.start_time === slot.start_time ? { ...s, available: false } : s));
    } else {
      setMessage(`❌ ${res.error}`);
    }
  };

  const handleCancel = async (id: string) => {
    await appointmentAPI.cancel(id, 'Patient cancelled');
    appointmentAPI.getMine().then(r => setAppointments(r.appointments || []));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🏥 Patient Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-indigo-200">{user?.email}</span>
          <button onClick={logout} className="bg-indigo-500 px-4 py-1 rounded hover:bg-indigo-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('book')}
            className={`px-6 py-2 rounded-lg font-semibold ${tab === 'book' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-600'}`}>
            Book Appointment
          </button>
          <button onClick={() => setTab('my')}
            className={`px-6 py-2 rounded-lg font-semibold ${tab === 'my' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-600'}`}>
            My Appointments ({appointments.length})
          </button>
        </div>

        {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">{message}</div>}

        {tab === 'book' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">1. Select a Clinic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clinics.map(clinic => (
                  <div key={clinic.id} onClick={() => handleClinicSelect(clinic)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedClinic?.id === clinic.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
                    <h3 className="font-semibold text-gray-800">{clinic.name}</h3>
                    <p className="text-sm text-gray-500">{clinic.address}, {clinic.city}</p>
                  </div>
                ))}
                {clinics.length === 0 && <p className="text-gray-400">No clinics available yet.</p>}
              </div>
            </div>

            {selectedClinic && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">2. Select a Doctor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map(d => (
                    <div key={d.id} onClick={() => setSelectedDoctor(d)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedDoctor?.id === d.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
                      <h3 className="font-semibold text-gray-800">Dr. {d.doctor_profiles?.full_name}</h3>
                      <p className="text-sm text-gray-500">{d.doctor_profiles?.specialization}</p>
                      <p className="text-sm text-indigo-600 font-semibold">₹{d.consultation_fee}</p>
                    </div>
                  ))}
                  {doctors.length === 0 && <p className="text-gray-400">No doctors at this clinic yet.</p>}
                </div>
              </div>
            )}

            {selectedDoctor && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">3. Pick a Date</h2>
                <div className="flex gap-3 items-center">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={handleGetSlots}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                    Get Available Slots
                  </button>
                </div>
              </div>
            )}

            {slots.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">4. Select a Slot</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {slots.map(slot => (
                    <button key={slot.start_time} onClick={() => slot.available && handleBook(slot)}
                      disabled={!slot.available}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${slot.available ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`}>
                      {slot.start_time.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'my' && (
          <div className="space-y-4">
            {appointments.length === 0 && <p className="text-gray-400">No appointments yet.</p>}
            {appointments.map((appt: any) => (
              <div key={appt.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">Dr. {appt.doctor_profiles?.full_name}</h3>
                    <p className="text-sm text-gray-500">{appt.doctor_profiles?.specialization}</p>
                    <p className="text-sm text-gray-600 mt-1">📅 {appt.appointment_date} at {appt.start_time?.slice(0, 5)}</p>
                    <p className="text-sm text-gray-500">🏥 {appt.clinics?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appt.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                      appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                      appt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {appt.status}
                    </span>
                    {appt.status === 'booked' && (
                      <button onClick={() => handleCancel(appt.id)}
                        className="text-xs text-red-500 hover:text-red-700 underline">Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
