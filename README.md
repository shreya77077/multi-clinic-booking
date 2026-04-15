# Multi-Clinic Appointment Booking System

A microservices-based healthcare appointment booking platform built with Node.js, Express, Supabase, and Next.js.

> **Live Demo:** https://multi-clinic-booking.vercel.app
> **GitHub:** https://github.com/shreya77077/multi-clinic-booking

---

## Architecture

```
Frontend (Next.js / Vercel)
        │
        ▼
API Gateway :8080   ← Single entry point, JWT verification, rate limiting
        │
        ├── Auth Service        :3001  → Register, Login, JWT
        ├── User Service        :3002  → Patient & Doctor Profiles
        ├── Clinic Service      :3003  → Clinic Management
        ├── Doctor Service      :3004  → Doctor Profiles & Clinic Mapping
        ├── Scheduling Service  :3005  → Availability Slots & Leave
        ├── Appointment Service :3006  → Book, Cancel, Reschedule
        └── Notification Service:3007  → Email/SMS Alerts
                │
                ▼
          Supabase (PostgreSQL)
          Shared database — 11 tables
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| API Gateway | Node.js + Express + http-proxy-middleware |
| Microservices | Node.js + Express (x7) |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Local dev | Docker Compose |
| Frontend hosting | Vercel (free) |
| Service hosting | Render (free) |

---

## Live Deployment URLs

| Service | URL |
|---|---|
| **Frontend** | https://multi-clinic-booking.vercel.app |
| **API Gateway** | https://multi-clinic-gateway.onrender.com |
| **Auth Service** | https://multi-clinic-booking.onrender.com |
| **User Service** | https://multi-clinic-user-service.onrender.com |
| **Clinic Service** | https://multi-clinic-clinic-service.onrender.com |
| **Doctor Service** | https://multi-clinic-doctor-service.onrender.com |
| **Scheduling Service** | https://multi-clinic-scheduling-service.onrender.com |
| **Appointment Service** | https://multi-clinic-appointment-service.onrender.com |
| **Notification Service** | https://multi-clinic-notification-service.onrender.com |

> **Note:** Free tier services on Render spin down after inactivity. First request may take ~50 seconds to wake up.

---

## Features

### Patient
- Browse clinics and doctors
- View doctor availability and consultation fees
- Book appointments with time slot selection
- View and cancel existing appointments
- Double-booking prevention enforced at DB level

### Doctor
- View today's and upcoming appointments
- See patient details per appointment

### Admin
- Create and manage clinics
- View all appointments across clinics
- Assign doctors to clinics (via SQL/API)

---

## Database Schema (Supabase)

11 tables across 7 logical service domains:

| Table | Service | Description |
|---|---|---|
| `users` | Auth | User accounts with roles (patient/doctor/admin) |
| `patient_profiles` | User | Patient personal info |
| `doctor_profiles` | User | Doctor info + specialization |
| `clinics` | Clinic | Clinic details |
| `clinic_admins` | Clinic | Admin-clinic mapping |
| `doctor_clinic` | Doctor | Doctor-clinic assignment + fees |
| `availability` | Scheduling | Weekly availability slots |
| `leave_requests` | Scheduling | Doctor leave management |
| `appointments` | Appointment | Bookings with conflict prevention |
| `appointment_history` | Appointment | Status change audit trail |
| `notification_log` | Notification | Sent notification records |

See `/docs/schema.sql` for the complete SQL.

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker + Docker Compose (optional)
- Supabase project (free tier)

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/shreya77077/multi-clinic-booking
cd multi-clinic-booking
```

**2. Install dependencies for all services**
```bash
cd services/auth-service && npm install && cd ../..
cd services/user-service && npm install && cd ../..
cd services/clinic-service && npm install && cd ../..
cd services/doctor-service && npm install && cd ../..
cd services/scheduling-service && npm install && cd ../..
cd services/appointment-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd gateway && npm install && cd ..
```

**3. Create .env files**
```bash
cp services/auth-service/.env.example services/auth-service/.env
# repeat for all services and gateway
```

Fill in each `.env` with:
```
PORT=<service port>
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

**4. Run all services**
```bash
# Start all backend services
node services/auth-service/src/index.js &
node services/user-service/src/index.js &
node services/clinic-service/src/index.js &
node services/doctor-service/src/index.js &
node services/scheduling-service/src/index.js &
node services/appointment-service/src/index.js &
node services/notification-service/src/index.js &
node gateway/src/index.js &

# Start frontend
cd frontend && npm run dev
```

**5. Verify all services are running**
```bash
curl http://localhost:8080/health   # Gateway
curl http://localhost:3001/health   # Auth
curl http://localhost:3002/health   # User
curl http://localhost:3003/health   # Clinic
curl http://localhost:3004/health   # Doctor
curl http://localhost:3005/health   # Scheduling
curl http://localhost:3006/health   # Appointment
curl http://localhost:3007/health   # Notification
```

**6. Open the app**
```
http://localhost:3000
```

---

## API Routes (via Gateway)

| Method | Route | Auth | Service |
|---|---|---|---|
| POST | /api/auth/register | Public | Auth |
| POST | /api/auth/login | Public | Auth |
| GET | /api/users/profile | JWT | User |
| PUT | /api/users/profile | JWT | User |
| GET | /api/clinics | JWT | Clinic |
| POST | /api/clinics | JWT (admin) | Clinic |
| GET | /api/doctors/clinic/:id | JWT | Doctor |
| GET | /api/scheduling/slots | JWT | Scheduling |
| POST | /api/scheduling/availability | JWT (admin/doctor) | Scheduling |
| POST | /api/appointments | JWT (patient) | Appointment |
| GET | /api/appointments/me | JWT | Appointment |
| PUT | /api/appointments/:id/cancel | JWT | Appointment |
| GET | /api/appointments | JWT (admin/doctor) | Appointment |

---

## Deployment Guide

### Frontend → Vercel
1. Connect GitHub repo on vercel.com
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=<gateway_url>`
4. Deploy

### Backend Services → Render
For each service:
1. New Web Service → connect GitHub repo
2. Set root directory (e.g. `services/auth-service`)
3. Language: Node, Branch: main, Instance: Free
4. Add environment variables
5. Deploy

### Database → Supabase
1. Create project on supabase.com
2. Run `/docs/schema.sql` in SQL Editor
3. Copy Project URL + service_role key to all `.env` files

---

## Architectural Documentation

See `/docs/architecture.md` for:
- Module view (decomposition)
- C&C view (runtime component interactions)
- Deployment view (Vercel + Render + Supabase)
- Quality Attribute scenarios
- ADD (Attribute-Driven Design) rationale
- Design decisions and tradeoffs

---

## Course Information

**Course:** SS G653 Software Architectures
**Institution:** BITS Pilani, Pilani Campus
**Instructor:** Dr. Tanmaya Mahapatra
**Pattern:** Microservices Architecture
