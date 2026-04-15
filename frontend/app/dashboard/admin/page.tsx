"use client";
import { useEffect, useState } from 'react';
import { getUser, logout } from '@/lib/auth';
import { clinicAPI, appointmentAPI } from '@/lib/api';

export default function AdminDashboard() {
  const user = getUser();
  const [clinics, setClinics] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tab, setTab] = useState<'clinics' | 'appointments'>('clinics');
  const [newClinic, setNewClinic] = useState({ name: '', address: '', city: '', phone: '', email: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) { window.location.href = '/login'; return; }
    clinicAPI.getAll().then(r => setClinics(r.clinics || []));
    appointmentAPI.getAll().then(r => setAppointments(r.appointments || []));
  }, []);

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await clinicAPI.create(newClinic);
    if (res.clinic) {
      setMessage('✅ Clinic created!');
      setClinics([...clinics, res.clinic]);
      setNewClinic({ name: '', address: '', city: '', phone: '', email: '' });
    } else {
      setMessage(`❌ ${res.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-violet-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">⚙️ Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-violet-200">{user?.email}</span>
          <button onClick={logout} className="bg-violet-500 px-4 py-1 rounded hover:bg-violet-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border text-center">
            <p className="text-3xl font-bold text-violet-600">{clinics.length}</p>
            <p className="text-gray-500 text-sm mt-1">Total Clinics</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border text-center">
            <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
            <p className="text-gray-500 text-sm mt-1">Total Appointments</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('clinics')}
            className={`px-6 py-2 rounded-lg font-semibold ${tab === 'clinics' ? 'bg-violet-600 text-white' : 'bg-white text-violet-600 border border-violet-600'}`}>
            Manage Clinics
          </button>
          <button onClick={() => setTab('appointments')}
            className={`px-6 py-2 rounded-lg font-semibold ${tab === 'appointments' ? 'bg-violet-600 text-white' : 'bg-white text-violet-600 border border-violet-600'}`}>
            All Appointments
          </button>
        </div>

        {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">{message}</div>}

        {tab === 'clinics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Clinic</h2>
              <form onSubmit={handleCreateClinic} className="grid grid-cols-2 gap-4">
                {(['name', 'address', 'city', 'phone', 'email'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                    <input type="text" required={['name','address','city'].includes(field)}
                      value={newClinic[field]}
                      onChange={e => setNewClinic({ ...newClinic, [field]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder={field} />
                  </div>
                ))}
                <div className="col-span-2">
                  <button type="submit" className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700">
                    Create Clinic
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.map(clinic => (
                <div key={clinic.id} className="bg-white rounded-xl p-4 shadow-sm border">
                  <h3 className="font-semibold text-gray-800">{clinic.name}</h3>
                  <p className="text-sm text-gray-500">{clinic.address}, {clinic.city}</p>
                  {clinic.phone && <p className="text-sm text-gray-500">📞 {clinic.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="space-y-3">
            {appointments.length === 0 && <p className="text-gray-400">No appointments yet.</p>}
            {appointments.map((appt: any) => (
              <div key={appt.id} className="bg-white rounded-xl p-4 shadow-sm border flex justify-between">
                <div>
                  <p className="font-semibold">{appt.patient_profiles?.full_name} → Dr. {appt.doctor_profiles?.full_name}</p>
                  <p className="text-sm text-gray-500">📅 {appt.appointment_date} at {appt.start_time?.slice(0,5)} | 🏥 {appt.clinics?.name}</p>
                </div>
                <span className={`px-3 py-1 h-fit rounded-full text-xs font-semibold ${
                  appt.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                  appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'}`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
