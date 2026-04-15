"use client";
import { useEffect, useState } from 'react';
import { getUser, logout } from '@/lib/auth';
import { appointmentAPI } from '@/lib/api';

export default function DoctorDashboard() {
  const user = getUser();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { window.location.href = '/login'; return; }
    appointmentAPI.getMine().then(r => setAppointments(r.appointments || []));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const upcoming = appointments.filter(a => a.appointment_date > today && a.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-emerald-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👨‍⚕️ Doctor Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-emerald-200">{user?.email}</span>
          <button onClick={logout} className="bg-emerald-500 px-4 py-1 rounded hover:bg-emerald-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-emerald-600">{todayAppts.length}</p>
            <p className="text-gray-500 text-sm mt-1">Today&apos;s Appointments</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-blue-600">{upcoming.length}</p>
            <p className="text-gray-500 text-sm mt-1">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-gray-600">{appointments.length}</p>
            <p className="text-gray-500 text-sm mt-1">Total</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">All Appointments</h2>
        <div className="space-y-3">
          {appointments.length === 0 && <p className="text-gray-400">No appointments yet.</p>}
          {appointments.map((appt: any) => (
            <div key={appt.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">{appt.patient_profiles?.full_name || 'Patient'}</p>
                <p className="text-sm text-gray-500">📅 {appt.appointment_date} at {appt.start_time?.slice(0, 5)}</p>
                <p className="text-sm text-gray-500">🏥 {appt.clinics?.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                appt.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'}`}>
                {appt.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
