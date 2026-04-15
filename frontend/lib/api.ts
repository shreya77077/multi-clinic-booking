const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const headers = (auth = true) => ({
  'Content-Type': 'application/json',
  ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data: object) =>
    fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: headers(false), body: JSON.stringify(data) }).then(r => r.json()),

  login: (data: object) =>
    fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: headers(false), body: JSON.stringify(data) }).then(r => r.json()),
};

// ── Clinics ───────────────────────────────────────────────────
export const clinicAPI = {
  getAll: () =>
    fetch(`${API_URL}/api/clinics`, { headers: headers() }).then(r => r.json()),

  create: (data: object) =>
    fetch(`${API_URL}/api/clinics`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
};

// ── Doctors ───────────────────────────────────────────────────
export const doctorAPI = {
  getByClinic: (clinicId: string) =>
    fetch(`${API_URL}/api/doctors/clinic/${clinicId}`, { headers: headers() }).then(r => r.json()),
};

// ── Scheduling ────────────────────────────────────────────────
export const schedulingAPI = {
  getSlots: (doctorId: string, clinicId: string, date: string) =>
    fetch(`${API_URL}/api/scheduling/slots?doctor_id=${doctorId}&clinic_id=${clinicId}&date=${date}`, { headers: headers() }).then(r => r.json()),
};

// ── Appointments ──────────────────────────────────────────────
export const appointmentAPI = {
  book: (data: object) =>
    fetch(`${API_URL}/api/appointments`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),

  getMine: () =>
    fetch(`${API_URL}/api/appointments/me`, { headers: headers() }).then(r => r.json()),

  cancel: (id: string, reason: string) =>
    fetch(`${API_URL}/api/appointments/${id}/cancel`, { method: 'PUT', headers: headers(), body: JSON.stringify({ reason }) }).then(r => r.json()),

  getAll: (clinicId?: string, date?: string) => {
    const params = new URLSearchParams();
    if (clinicId) params.append('clinic_id', clinicId);
    if (date) params.append('date', date);
    return fetch(`${API_URL}/api/appointments?${params}`, { headers: headers() }).then(r => r.json());
  },
};
