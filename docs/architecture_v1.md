# Architecture Documentation
## Multi-Clinic Appointment Booking System

**Course:** SS G653 Software Architectures | BITS Pilani, Pilani Campus  
**Instructor:** Dr. Tanmaya Mahapatra  
**Reference:** *Software Architecture in Practice*, Bass, Clements, Kazman, 4th Ed., Pearson, 2024  
**GitHub:** https://github.com/shreya77077/multi-clinic-booking  
**Live Demo:** https://multi-clinic-booking.vercel.app

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architectural Pattern](#2-architectural-pattern)
3. [System Decomposition](#3-system-decomposition)
4. [Runtime Architecture](#4-runtime-architecture)
5. [Deployment Architecture](#5-deployment-architecture)
6. [Quality Attribute Analysis](#6-quality-attribute-analysis)
7. [Design Rationale — ADD Method](#7-design-rationale--add-method)
8. [Design Decisions and Tradeoffs](#8-design-decisions-and-tradeoffs)
9. [Inter-Service Communication](#9-inter-service-communication)
10. [Database Design](#10-database-design)
11. [Setup and Execution](#11-setup-and-execution)

---

## 1. System Overview

The Multi-Clinic Appointment Booking System is a web-based platform that enables patients to discover clinics, browse doctors, and book appointments online. Clinic administrators manage doctors and schedules. Doctors view their appointments.

### Stakeholders

| Stakeholder | Primary Concern |
|---|---|
| Patient | Easy booking, no double bookings, appointment history |
| Doctor | View daily schedule, manage availability |
| Clinic Admin | Manage clinic data, doctor assignments, all appointments |
| Developer | Independent deployability, maintainability, testability |
| Course Instructor | Clear pattern implementation, documented views, QA analysis |

### System Scope

**In scope:**
- User registration and authentication (JWT-based, role-based)
- Clinic and doctor management
- Availability slot generation and leave management
- Appointment booking with conflict prevention
- Notification event logging
- Role-based access control (Patient / Doctor / Admin)

**Out of scope:**
- Payment processing (future scope)
- Video consultation
- Physical SMS/Email delivery (events logged, not physically sent)
- Medical records / EMR

---

## 2. Architectural Pattern

### Pattern: Service-Oriented Architecture (SOA) / Microservices

The system is structured as a collection of independently deployable services, each responsible for a single business capability. Services communicate over HTTP through a central API Gateway. This is a **Component-and-Connector architectural style** where:

- **Components** are services — Auth, User, Clinic, Doctor, Scheduling, Appointment, Notification
- **Connectors** are synchronous REST/HTTP calls and one asynchronous (fire-and-forget) notification call
- The **API Gateway** is the single entry point for all client requests, enforcing authentication and routing

### Why This Pattern?

The key architecturally significant requirements (ASRs) that drove this choice:

| Requirement | Priority | How SOA satisfies it |
|---|---|---|
| A crash in one service must not affect others | High | Each service runs as a separate process — failures are contained |
| Each service must be deployable independently | High | Every service has its own deployment on Render |
| High-load services must scale without scaling everything | High | Appointment Service scales independently |
| All requests must be authenticated at one place | High | API Gateway verifies JWT before forwarding to any service |
| New services (e.g. Payment) must be addable without changing existing services | High | New service = new folder + new gateway route. Zero changes to existing services. |

### Services

| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 8080 | Routing, JWT verification, rate limiting |
| Auth Service | 3001 | User registration, login, JWT issuance |
| User Service | 3002 | Patient and doctor profile management |
| Clinic Service | 3003 | Clinic creation and management |
| Doctor Service | 3004 | Doctor profiles, clinic-doctor assignment |
| Scheduling Service | 3005 | Weekly availability, slot generation, leave |
| Appointment Service | 3006 | Book, cancel, reschedule appointments |
| Notification Service | 3007 | Notification event logging |

---

## 3. System Decomposition

```
multi-clinic-booking/
│
├── gateway/                        [API Gateway]
│   └── src/
│       ├── index.js                — Proxy routing, rate limiting
│       └── middleware/auth.js      — JWT verification
│
├── services/
│   ├── auth-service/
│   │   └── src/
│   │       ├── controllers/authController.js   — register, login, getMe
│   │       ├── routes/auth.js
│   │       ├── middleware/protect.js
│   │       └── utils/supabase.js
│   │
│   ├── user-service/
│   │   └── src/
│   │       ├── controllers/userController.js   — getProfile, updateProfile
│   │       └── routes/users.js
│   │
│   ├── clinic-service/
│   │   └── src/
│   │       ├── controllers/clinicController.js — getAllClinics, createClinic
│   │       └── routes/clinics.js
│   │
│   ├── doctor-service/
│   │   └── src/
│   │       ├── controllers/doctorController.js — getDoctorsByClinic, assign
│   │       └── routes/doctors.js
│   │
│   ├── scheduling-service/
│   │   └── src/
│   │       ├── controllers/schedulingController.js — getSlots, setAvailability
│   │       └── routes/scheduling.js
│   │
│   ├── appointment-service/
│   │   └── src/
│   │       ├── controllers/appointmentController.js — book, cancel, getAll
│   │       └── routes/appointments.js
│   │
│   └── notification-service/
│       └── src/
│           ├── controllers/notificationController.js — sendNotification
│           └── routes/notifications.js
│
├── shared/
│   ├── middleware/auth.js          — Shared JWT authenticate/authorize
│   └── utils/supabase.js           — Shared Supabase client factory
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                — Landing page
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── dashboard/
│   │       ├── patient/page.tsx    — Clinic → Doctor → Slot → Book flow
│   │       ├── doctor/page.tsx     — Appointment view
│   │       └── admin/page.tsx      — Clinic management
│   └── lib/
│       ├── api.ts                  — API client
│       └── auth.ts                 — Token management
│
└── docs/
    ├── schema.sql
    └── architecture_v1.md          — This document
```

### Service Responsibilities

| Service | Single Responsibility | Only reason to change |
|---|---|---|
| Auth | Identity and token management | Change in auth strategy |
| Clinic | Clinic data management | Change in clinic data model |
| Scheduling | Slot generation algorithm | Change in booking rules |
| Appointment | Booking lifecycle | Change in cancellation policy |
| Notification | Event logging and alerting | Add real email/SMS provider |
| Gateway | Request routing and auth | Add new service or routing rule |

---

## 4. Runtime Architecture

### System Diagram

```
┌──────────────────────────────────────────────────────────┐
│              Browser (Patient / Doctor / Admin)           │
│              Next.js SPA — Vercel                         │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS (REST/JSON)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                     API Gateway :8080                     │
│                                                           │
│   Rate Limiter (100 req / 15 min per IP)                 │
│   JWT Verifier → sets x-user-id, x-user-role headers    │
│   HTTP Proxy → forwards to correct service               │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬────────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
 Auth   User  Clinic Doctor Sched  Appt  Notif
 :3001  :3002  :3003  :3004  :3005  :3006  :3007
   │      │      │      │      │      │      │
   └──────┴──────┴──────┴──────┴──────┴──────┘
                          │
             ┌────────────▼────────────┐
             │       Supabase          │
             │       PostgreSQL        │
             │       11 tables         │
             └─────────────────────────┘
```

### Appointment Booking — Step-by-Step Flow

```
Patient Browser
    │
    │── POST /api/appointments ──────────────────────▶ API Gateway
                                                            │
                                                 1. Verify JWT token
                                                 2. Add x-user-id header
                                                            │
                                                            ▼
                                                  Appointment Service
                                                            │
                                              3. Fetch patient profile (DB)
                                              4. Check double booking (DB)
                                              5. INSERT appointment (DB)
                                              6. INSERT history record (DB)
                                              7. POST /notify ──▶ Notification
                                                                       │
                                                               8. Log event (DB)
                                                            │
                                    ◀── 201 Created + appointment JSON ──┘
```

### Connector Types

| Connector | Protocol | Between | Nature |
|---|---|---|---|
| Client ↔ Gateway | HTTPS REST | Browser ↔ Gateway | Synchronous |
| Gateway ↔ Services | HTTP Proxy | Gateway ↔ Each service | Synchronous |
| Services ↔ Supabase | HTTPS (supabase-js) | Each service ↔ DB | Synchronous |
| Appointment → Notification | HTTP | Appointment ↔ Notification | Async (fire-and-forget) |

---

## 5. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (CDN / Global Edge)                 │
│                                                               │
│   Next.js Frontend                                            │
│   https://multi-clinic-booking.vercel.app                    │
│   Auto-redeploys on every git push to main                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    RENDER (Free Tier)                         │
│                                                               │
│   API Gateway    → multi-clinic-gateway.onrender.com         │
│   Auth Service   → multi-clinic-booking.onrender.com         │
│   User Service   → multi-clinic-user-service.onrender.com    │
│   Clinic Service → multi-clinic-clinic-service.onrender.com  │
│   Doctor Service → multi-clinic-doctor-service.onrender.com  │
│   Scheduling     → multi-clinic-scheduling-service.onrender.com│
│   Appointment    → multi-clinic-appointment-service.onrender.com│
│   Notification   → multi-clinic-notification-service.onrender.com│
│                                                               │
│   Each service: Node.js runtime, auto-deploy on git push     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (supabase-js)
┌──────────────────────────▼──────────────────────────────────┐
│                    SUPABASE (South Asia / Mumbai)             │
│                                                               │
│   PostgreSQL — 11 tables                                      │
│   Auto-generated REST API                                     │
│   Free tier: 500MB storage, 50K MAU                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Quality Attribute Analysis

### Availability

**Scenario:** The Notification Service crashes during peak booking hours.

| Element | Value |
|---|---|
| Source | Internal fault in Notification Service |
| Stimulus | Runtime exception causes service crash |
| Artifact | Notification Service |
| Environment | Normal operation, peak hours |
| Response | Appointment booking continues unaffected. Notification call fails silently. |
| Response Measure | 0% of appointment bookings fail due to Notification Service downtime |

**Tactic:** Fault isolation + ignore faulty behaviour. The Appointment Service calls Notification asynchronously with `.catch(() => {})`. A crash in one service does not cascade to others.

---

### Security

**Scenario:** An unauthenticated user attempts to book an appointment.

| Element | Value |
|---|---|
| Source | Unauthenticated external actor |
| Stimulus | POST /api/appointments without Authorization header |
| Artifact | API Gateway |
| Environment | Normal operation |
| Response | Gateway returns 401 Unauthorized. Request never reaches Appointment Service. |
| Response Measure | 100% of unauthenticated requests blocked at gateway. Zero unauthorized DB writes. |

**Tactic:** Authenticate actors at the gateway. Authorize actors in each service using JWT role claims (patient / doctor / admin).

---

### Modifiability

**Scenario:** A Payment Service needs to be added.

| Element | Value |
|---|---|
| Source | New business requirement |
| Stimulus | Add online payment before appointment confirmation |
| Artifact | System architecture |
| Environment | Post-deployment, system live |
| Response | New `payment-service` folder created. One route added to gateway. One call added in Appointment Service. |
| Response Measure | Zero changes to Auth, Clinic, Doctor, Scheduling, Notification, or User services. |

**Tactic:** Encapsulate responsibilities per service. Restrict dependencies — services communicate only via HTTP interfaces, never via shared code.

---

### Performance

**Scenario:** 100 patients simultaneously book the same slot.

| Element | Value |
|---|---|
| Source | 100 concurrent patients |
| Stimulus | 100 simultaneous POST /api/appointments for the same doctor/date/time |
| Artifact | Appointment Service + Supabase |
| Environment | Peak load |
| Response | Exactly one booking succeeds. All others receive a 409 Conflict response. |
| Response Measure | Zero double bookings. DB-level constraint enforces atomicity without application-level locking. |

**Tactic:** Bound execution — `UNIQUE(doctor_id, clinic_id, appointment_date, start_time)` constraint at DB level ensures atomic conflict detection.

---

### Testability

**Scenario:** A developer wants to test the slot generation logic in isolation.

| Element | Value |
|---|---|
| Source | Developer |
| Stimulus | Run unit test on slot generation algorithm |
| Artifact | Scheduling Service |
| Environment | Development environment |
| Response | Controller function invoked with mock Supabase client. No other service needed. |
| Response Measure | Every service has a `/health` endpoint. Each service runs independently with `node src/index.js`. |

**Tactic:** Specialised interfaces (`/health` endpoints). Single responsibility per service — slot generation logic isolated to one controller with no cross-service dependencies.

---

### Scalability

**Scenario:** User base grows 10x.

| Element | Value |
|---|---|
| Source | Business growth |
| Stimulus | 1,000 concurrent users (up from 100) |
| Artifact | Appointment Service (highest load service) |
| Environment | Production |
| Response | Appointment Service scaled to multiple instances on Render. Other services unaffected. |
| Response Measure | Appointment Service scales independently without redeploying any other service. |

**Tactic:** Horizontal scaling per service — each service is independently deployable and scalable.

---

## 7. Design Rationale — ADD Method

The Attribute-Driven Design (ADD) method was used to derive this architecture.

### Architecturally Significant Requirements (Utility Tree)

```
UTILITY
├── Availability                        (High business value, High architectural impact)
│   └── Service crash must not cascade
├── Security                            (High, High)
│   └── Only authenticated users can book
├── Modifiability                       (High, Medium)
│   └── New services addable without touching existing ones
├── Performance                         (Medium, High)
│   └── No double booking under concurrent load
└── Testability                         (Medium, Medium)
    └── Each service independently runnable and testable
```

### Generate and Test

**Initial hypothesis:** Monolithic Express application — all services in one codebase.

**Test against ASRs:**
- Fault isolation ✗ — notification crash kills entire app
- Independent deployability ✗ — one deployment for everything
- Security ✗ — auth logic scattered across controllers

**Verdict:** Rejected.

**Next hypothesis:** SOA / Microservices with API Gateway.

**Test against ASRs:**
- Fault isolation ✅ — separate processes
- Independent deployability ✅ — separate Render services
- Security ✅ — JWT verified centrally at gateway
- Double booking prevention ✅ — DB UNIQUE constraint
- Testability ✅ — `/health` endpoints, single-responsibility controllers

**Verdict:** Accepted. All (High, High) ASRs satisfied.

### Design Decisions

| ASR | Decision | Tactic |
|---|---|---|
| Fault isolation | Async notification call | Ignore faulty behaviour |
| Centralised auth | JWT at API Gateway | Authenticate actors |
| Double booking | DB UNIQUE constraint | Bound execution |
| Independent deploy | Separate Render service per folder | Microservices decomposition |
| Role-based access | JWT role claim + authorize middleware | Authorize actors |

---

## 8. Design Decisions and Tradeoffs

### Shared Database vs. Database per Service

**Decision:** Shared Supabase PostgreSQL instance with logical table separation.

**Rationale:** True database-per-service requires cross-service data fetching via HTTP for queries that join patient, doctor, and clinic data. This adds significant latency for appointment queries. For the current scale and free-tier infrastructure, shared DB with application-layer separation was the pragmatic choice.

**Tradeoff:** Reduced strict data isolation. Mitigated by ensuring each service only queries its own tables in code.

---

### Synchronous vs. Asynchronous Notification

**Decision:** Fire-and-forget HTTP call (asynchronous).

**Rationale:** Appointment booking response time must not depend on notification delivery. A slow or crashed Notification Service must not delay booking confirmation.

**Tradeoff:** No guaranteed delivery. If Notification Service is down, the notification event is lost. Mitigated in production by adding a message queue.

---

### JWT at Gateway vs. per Service

**Decision:** JWT verified only at the API Gateway. Services trust the `x-user-id` and `x-user-role` headers set by the gateway.

**Rationale:** Avoids duplicating JWT verification logic and the `JWT_SECRET` in every service. The gateway is the single trust boundary.

**Tradeoff:** Services are unprotected if accessed directly (bypassing gateway). Mitigated in production by Render's private networking.

---

### Monorepo vs. Polyrepo

**Decision:** Monorepo — one GitHub repository, one folder per service.

**Rationale:** Easier to manage for a solo developer. Shared utilities can be referenced directly. Single git history for the whole system.

**Tradeoff:** A push to any file triggers potential redeployment of all services. Mitigated in production by per-folder deploy filters in Render.

---

## 9. Inter-Service Communication

```
Patient books appointment:
  Frontend → Gateway → Appointment Service
                            │
                            ├── Supabase (read patient_profiles)
                            ├── Supabase (check existing appointments)
                            ├── Supabase (INSERT appointment)
                            ├── Supabase (INSERT appointment_history)
                            └── Notification Service [async]
                                      │
                                      └── Supabase (INSERT notification_log)

Patient views available slots:
  Frontend → Gateway → Scheduling Service
                            │
                            ├── Supabase (read availability)
                            ├── Supabase (check leave_requests)
                            └── Supabase (read booked appointments for date)

Admin creates clinic:
  Frontend → Gateway (verifies admin role) → Clinic Service
                                                  │
                                                  └── Supabase (INSERT clinics)

Patient login:
  Frontend → Gateway (public route) → Auth Service
                                           │
                                           ├── Supabase (read users)
                                           └── bcrypt password verify → return JWT
```

---

## 10. Database Design

### Tables

| Table | Description |
|---|---|
| `users` | All user accounts with role (patient / doctor / admin) |
| `patient_profiles` | Patient personal information |
| `doctor_profiles` | Doctor information and specialization |
| `clinics` | Clinic details and location |
| `clinic_admins` | Maps admin users to clinics |
| `doctor_clinic` | Maps doctors to clinics with consultation fee |
| `availability` | Weekly recurring availability per doctor per clinic |
| `leave_requests` | Doctor leave days |
| `appointments` | All appointment bookings |
| `appointment_history` | Audit trail of status changes |
| `notification_log` | Record of all notification events |

### Key Constraints

| Constraint | Purpose |
|---|---|
| `UNIQUE(doctor_id, clinic_id, appointment_date, start_time)` | Prevents double booking at DB level |
| `UNIQUE(doctor_id, clinic_id)` on doctor_clinic | A doctor assigned to a clinic only once |
| `CHECK role IN ('patient','doctor','admin')` | Enforces valid user roles |
| `CHECK status IN ('booked','confirmed','cancelled','completed','no_show')` | Enforces valid appointment states |

### Indexes

```sql
idx_appointments_doctor_date  — All appointments for a doctor on a given date
idx_appointments_patient      — All appointments for a patient
idx_appointments_clinic_date  — All appointments at a clinic on a given date
idx_availability_doctor       — Slot generation per doctor/clinic
idx_doctor_clinic_clinic      — Doctor list per clinic
```

---

## 11. Setup and Execution

### Prerequisites
- Node.js 20+
- Supabase account (free tier)
- Render account (free tier)
- Vercel account (free tier)

### Local Setup

```bash
# 1. Clone
git clone https://github.com/shreya77077/multi-clinic-booking
cd multi-clinic-booking

# 2. Install dependencies
cd services/auth-service && npm install && cd ../..
cd services/user-service && npm install && cd ../..
cd services/clinic-service && npm install && cd ../..
cd services/doctor-service && npm install && cd ../..
cd services/scheduling-service && npm install && cd ../..
cd services/appointment-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd gateway && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Configure environment variables
# Copy .env.example to .env in each service folder and fill in:
# SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, PORT

# 4. Run database schema
# Paste docs/schema.sql into Supabase SQL Editor and execute

# 5. Start all backend services
node services/auth-service/src/index.js &
node services/user-service/src/index.js &
node services/clinic-service/src/index.js &
node services/doctor-service/src/index.js &
node services/scheduling-service/src/index.js &
node services/appointment-service/src/index.js &
node services/notification-service/src/index.js &
node gateway/src/index.js &

# 6. Start frontend
cd frontend && npm run dev
```

### Verify All Services Running

```bash
curl http://localhost:8080/health   # API Gateway
curl http://localhost:3001/health   # Auth
curl http://localhost:3002/health   # User
curl http://localhost:3003/health   # Clinic
curl http://localhost:3004/health   # Doctor
curl http://localhost:3005/health   # Scheduling
curl http://localhost:3006/health   # Appointment
curl http://localhost:3007/health   # Notification
```

### Open App

```
http://localhost:3000
```

### Testing the Full Flow

1. Register an **admin** account at `/register`
2. Login as admin → create clinics from Admin Dashboard
3. Register a **doctor** account at `/register`
4. Use Supabase SQL Editor to assign doctor to clinic and set availability
5. Register a **patient** account at `/register`
6. Login as patient → select clinic → select doctor → pick date → book slot
7. Login as doctor → verify appointment appears in Doctor Dashboard

---

*Documentation prepared for SS G653 Software Architectures, BITS Pilani, 2024-25*
