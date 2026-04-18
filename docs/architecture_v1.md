# Architecture Documentation
## Multi-Clinic Appointment Booking System
**Course:** SS G653 Software Architectures | BITS Pilani | Dr. Tanmaya Mahapatra  
**Pattern:** Microservices Architecture  
**GitHub:** https://github.com/shreya77077/multi-clinic-booking  
**Live Demo:** https://multi-clinic-booking.vercel.app

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architectural Pattern — Microservices](#2-architectural-pattern--microservices)
3. [Module View (Decomposition)](#3-module-view-decomposition)
4. [Component-and-Connector View (C&C)](#4-component-and-connector-view-cc)
5. [Deployment View](#5-deployment-view)
6. [Quality Attribute Scenarios](#6-quality-attribute-scenarios)
7. [ADD — Attribute-Driven Design Rationale](#7-add--attribute-driven-design-rationale)
8. [Design Decisions and Tradeoffs](#8-design-decisions-and-tradeoffs)
9. [Inter-Service Communication Map](#9-inter-service-communication-map)
10. [Database Design](#10-database-design)

---

## 1. System Overview

The Multi-Clinic Appointment Booking System is a web-based platform that enables patients to discover clinics, browse doctors, and book appointments online. Clinic administrators can manage doctors and schedules. Doctors can view their appointments.

### Stakeholders

| Stakeholder | Concern |
|---|---|
| Patient | Easy appointment booking, no double bookings, appointment history |
| Doctor | View daily schedule, manage availability |
| Clinic Admin | Manage clinic data, doctor assignments, view all appointments |
| Developer | Maintainability, testability, independent deployability |
| Course Instructor | Clear architectural pattern, documented views, QA analysis |

### System Scope

**Inside scope:**
- User registration and authentication (JWT-based)
- Clinic and doctor management
- Availability slot generation
- Appointment booking with conflict prevention
- Notification logging
- Role-based access control (Patient / Doctor / Admin)

**Outside scope:**
- Payment processing
- Video consultation
- Medical records / EMR
- SMS/Email delivery (logged but not physically sent in current implementation)

---

## 2. Architectural Pattern — Microservices

### Definition
The system is structured as a collection of small, independently deployable services, each responsible for a specific business capability. Services communicate over HTTP via a central API Gateway.

### Why Microservices?

**Business goals driving this choice:**

| Business Goal | Architectural Impact |
|---|---|
| System must scale independently per feature | Each service scales horizontally without affecting others |
| New clinic types may require new booking rules | Services can be extended independently (OCP) |
| Auth and appointment logic must be fault-isolated | A crash in Notification Service does not affect Appointment booking |
| Multiple roles (patient, doctor, admin) with different access patterns | Gateway enforces role-based routing centrally |

### Services

| Service | Port | Responsibility | Own Data |
|---|---|---|---|
| API Gateway | 8080 | Routing, JWT verification, rate limiting | None |
| Auth Service | 3001 | Register, login, JWT issuance | users table |
| User Service | 3002 | Patient & doctor profile management | patient_profiles, doctor_profiles |
| Clinic Service | 3003 | Clinic CRUD, admin assignment | clinics, clinic_admins |
| Doctor Service | 3004 | Doctor profiles, clinic-doctor mapping | doctor_clinic |
| Scheduling Service | 3005 | Availability slots, leave management | availability, leave_requests |
| Appointment Service | 3006 | Book, cancel, reschedule, conflict prevention | appointments, appointment_history |
| Notification Service | 3007 | Notification event logging | notification_log |

---

## 3. Module View (Decomposition)

```
multi-clinic-booking/
│
├── gateway/                        [API Gateway Module]
│   └── src/
│       ├── index.js                — Express app, proxy routing
│       └── middleware/auth.js      — JWT verification
│
├── services/
│   ├── auth-service/               [Authentication Module]
│   │   └── src/
│   │       ├── controllers/authController.js   — register, login, getMe
│   │       ├── routes/auth.js                  — POST /register, POST /login
│   │       ├── middleware/protect.js            — JWT guard
│   │       └── utils/supabase.js               — DB client
│   │
│   ├── user-service/               [User Profile Module]
│   │   └── src/
│   │       ├── controllers/userController.js   — getProfile, updateProfile
│   │       └── routes/users.js
│   │
│   ├── clinic-service/             [Clinic Management Module]
│   │   └── src/
│   │       ├── controllers/clinicController.js — getAllClinics, createClinic
│   │       └── routes/clinics.js
│   │
│   ├── doctor-service/             [Doctor Module]
│   │   └── src/
│   │       ├── controllers/doctorController.js — getDoctorsByClinic, assign
│   │       └── routes/doctors.js
│   │
│   ├── scheduling-service/         [Scheduling Module]
│   │   └── src/
│   │       ├── controllers/schedulingController.js — getSlots, setAvailability
│   │       └── routes/scheduling.js
│   │
│   ├── appointment-service/        [Appointment Module]
│   │   └── src/
│   │       ├── controllers/appointmentController.js — book, cancel, getAll
│   │       └── routes/appointments.js
│   │
│   └── notification-service/       [Notification Module]
│       └── src/
│           ├── controllers/notificationController.js — sendNotification
│           └── routes/notifications.js
│
├── shared/                         [Shared Utilities]
│   ├── middleware/auth.js          — Shared JWT authenticate/authorize
│   └── utils/supabase.js           — Shared Supabase client factory
│
├── frontend/                       [Presentation Module]
│   ├── app/
│   │   ├── page.tsx                — Landing page
│   │   ├── login/page.tsx          — Login
│   │   ├── register/page.tsx       — Registration
│   │   └── dashboard/
│   │       ├── patient/page.tsx    — Patient booking flow
│   │       ├── doctor/page.tsx     — Doctor appointment view
│   │       └── admin/page.tsx      — Admin management
│   └── lib/
│       ├── api.ts                  — API client (auth, clinic, doctor, scheduling, appointment)
│       └── auth.ts                 — Token management (localStorage)
│
└── docs/
    ├── schema.sql                  — Complete Supabase schema
    └── architecture.md             — This document
```

### Module Responsibilities

| Module | Single Responsibility | Reason to Change |
|---|---|---|
| Auth Service | Identity and token management | Change in auth strategy (e.g., OAuth) |
| Clinic Service | Clinic data management | Change in clinic data model |
| Scheduling Service | Slot generation algorithm | Change in booking rules (e.g., 15-min slots) |
| Appointment Service | Booking lifecycle | Change in cancellation policy |
| Notification Service | Event logging and alerting | Add real email/SMS provider |
| API Gateway | Request routing and auth | Add new service or change routing rules |

---

## 4. Component-and-Connector View (C&C)

### Runtime Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Patient/Doctor/Admin)         │
│                   Next.js SPA — Vercel                   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS (REST/JSON)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway :8080                      │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Rate Limiter (100 req/15min)                   │   │
│   │  JWT Verifier (x-user-id, x-user-role headers) │   │
│   │  HTTP Proxy (http-proxy-middleware)             │   │
│   └─────────────────────────────────────────────────┘   │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬────────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
 Auth   User  Clinic Doctor Sched  Appt  Notif
 :3001  :3002  :3003  :3004  :3005  :3006  :3007
   │      │      │      │      │      │      │
   └──────┴──────┴──────┴──────┴──────┴──────┘
                         │
              ┌──────────▼──────────┐
              │   Supabase          │
              │   PostgreSQL        │
              │   (shared DB,       │
              │    11 tables)       │
              └─────────────────────┘
```

### Connector Types

| Connector | Type | Between | Data Exchanged |
|---|---|---|---|
| Client ↔ Gateway | HTTPS REST | Browser ↔ Gateway | JSON request/response |
| Gateway ↔ Services | HTTP Proxy | Gateway ↔ Each service | Forwarded HTTP request + x-user headers |
| Services ↔ Supabase | HTTPS (supabase-js) | Each service ↔ DB | SQL queries via REST API |
| Appointment → Notification | HTTP (fire-and-forget) | Appointment Service → Notification Service | Notification event payload |

### Key Runtime Behaviour — Appointment Booking Flow

```
Patient Browser
    │── POST /api/appointments ──────────────────────────────────▶ API Gateway
                                                                        │
                                                              JWT verify │
                                                            x-user-id added
                                                                        │
                                                                        ▼
                                                              Appointment Service
                                                                        │
                                                        1. Get patient profile (DB)
                                                        2. Check for double booking (DB)
                                                        3. INSERT appointment (DB)
                                                        4. INSERT appointment_history (DB)
                                                        5. POST /notify ──────▶ Notification Service
                                                                                      │
                                                                              INSERT notification_log
                                                                        │
                                                    ◀── 201 + appointment object ──────┘
```

---

## 5. Deployment View

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (CDN / Edge)                       │
│                                                                   │
│   ┌───────────────────────────────────────┐                      │
│   │  Next.js Frontend                     │                      │
│   │  multi-clinic-booking.vercel.app      │                      │
│   │  Auto-deploy on git push to main      │                      │
│   └───────────────────────────────────────┘                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                        RENDER (Free Tier)                         │
│                                                                   │
│  ┌─────────────────────┐   Each service:                         │
│  │  API Gateway        │   - Node.js runtime                     │
│  │  :8080              │   - Auto-deploy on git push             │
│  └──────┬──────────────┘   - Spins down after 15min inactivity   │
│         │                  - 512MB RAM, 0.1 CPU                  │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │  Auth  User  Clinic  Doctor  Scheduling  Appt  Notif    │    │
│  │  3001  3002   3003   3004      3005      3006   3007    │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (supabase-js)
┌──────────────────────────▼──────────────────────────────────────┐
│                        SUPABASE (South Asia / Mumbai)             │
│                                                                   │
│   PostgreSQL Database                                             │
│   - 11 tables                                                     │
│   - Row Level Security (manual policies)                          │
│   - Auto-generated REST API (Data API)                            │
│   - Free tier: 500MB storage, 50K MAU                            │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Configuration

| Component | Platform | URL | Auto-deploy |
|---|---|---|---|
| Frontend | Vercel | multi-clinic-booking.vercel.app | ✅ On push to main |
| API Gateway | Render | multi-clinic-gateway.onrender.com | ✅ On push to main |
| Auth Service | Render | multi-clinic-booking.onrender.com | ✅ On push to main |
| User Service | Render | multi-clinic-user-service.onrender.com | ✅ On push to main |
| Clinic Service | Render | multi-clinic-clinic-service.onrender.com | ✅ On push to main |
| Doctor Service | Render | multi-clinic-doctor-service.onrender.com | ✅ On push to main |
| Scheduling Service | Render | multi-clinic-scheduling-service.onrender.com | ✅ On push to main |
| Appointment Service | Render | multi-clinic-appointment-service.onrender.com | ✅ On push to main |
| Notification Service | Render | multi-clinic-notification-service.onrender.com | ✅ On push to main |
| Database | Supabase | ibdyphgjfsxzpflhzznz.supabase.co | N/A |

---

## 6. Quality Attribute Scenarios

### QA 1 — Availability

**Scenario:** The Notification Service crashes during peak hours.

| Part | Value |
|---|---|
| Source | Internal fault in Notification Service |
| Stimulus | Runtime exception causes service crash |
| Artifact | Notification Service |
| Environment | Normal operation, peak booking hours |
| Response | Appointment Service continues to book appointments. Notification call fails silently (fire-and-forget). No patient-facing error. |
| Response Measure | 0% of appointment bookings fail due to Notification Service downtime |

**Tactic used:** *Fault isolation* — Appointment Service calls Notification Service asynchronously with `.catch(() => {})`. A crash in one service does not cascade.

---

### QA 2 — Performance

**Scenario:** 100 patients simultaneously attempt to book appointments.

| Part | Value |
|---|---|
| Source | 100 concurrent patients |
| Stimulus | 100 simultaneous POST /api/appointments requests |
| Artifact | Appointment Service + Supabase DB |
| Environment | Normal operation |
| Response | Each request processed independently. DB-level UNIQUE constraint prevents double booking. |
| Response Measure | All 100 requests return within 3 seconds. Zero double bookings. |

**Tactic used:** *Unique constraint at DB level* — `UNIQUE(doctor_id, clinic_id, appointment_date, start_time)` ensures atomicity. No application-level locking needed.

---

### QA 3 — Modifiability

**Scenario:** The team wants to add a Payment Service.

| Part | Value |
|---|---|
| Source | Developer |
| Stimulus | New requirement: online payment before appointment confirmation |
| Artifact | System architecture |
| Environment | Post-deployment, system live |
| Response | Create new `payment-service` folder, add route in gateway, call from Appointment Service after booking |
| Response Measure | Change requires modifying 2 files (gateway/index.js + appointmentController.js). Zero changes to other services. Deployed independently. |

**Tactic used:** *Microservices decomposition* — each service is independently deployable. New services are added without modifying existing ones (OCP).

---

### QA 4 — Security

**Scenario:** An unauthenticated user attempts to book an appointment.

| Part | Value |
|---|---|
| Source | Malicious or unauthenticated external actor |
| Stimulus | POST /api/appointments without Authorization header |
| Artifact | API Gateway |
| Environment | Normal operation |
| Response | Gateway returns 401 Unauthorized. Request never reaches Appointment Service. |
| Response Measure | 100% of unauthenticated requests blocked at gateway. Zero unauthorized bookings in DB. |

**Tactic used:** *Authenticate actors at gateway* — JWT verified centrally before forwarding. Services trust x-user-id headers set by gateway.

---

### QA 5 — Testability

**Scenario:** Developer wants to test the Scheduling Service slot generation in isolation.

| Part | Value |
|---|---|
| Source | Developer |
| Stimulus | Unit test for slot generation algorithm |
| Artifact | Scheduling Service |
| Environment | Development/CI environment |
| Response | `getAvailableSlots` controller can be tested with mock Supabase client. No other service dependency. |
| Response Measure | Each service has a `/health` endpoint. Business logic functions are pure and independently testable. |

**Tactic used:** *Limit structural complexity* — each service has a single responsibility. The slot generation algorithm is contained in one controller function with no cross-service dependencies.

---

### QA 6 — Scalability

**Scenario:** The system needs to handle 10x more clinics and patients.

| Part | Value |
|---|---|
| Source | Business growth |
| Stimulus | User base grows from 100 to 1,000 concurrent users |
| Artifact | Appointment Service (highest load) |
| Environment | Production |
| Response | Appointment Service scaled horizontally on Render (multiple instances). Other services unaffected. |
| Response Measure | Appointment Service scales independently without redeploying Auth or Notification services. |

**Tactic used:** *Horizontal scaling per service* — microservices allow independent scaling of high-load components.

---

## 7. ADD — Attribute-Driven Design Rationale

### ADD Process Summary

**Step 1: Identify ASRs (Architecturally Significant Requirements)**

The utility tree for this system:

```
UTILITY
├── Availability (H, H)
│   └── "A crash in one service must not crash others" → Fault isolation
├── Security (H, H)
│   └── "Only authenticated users can book appointments" → JWT at gateway
├── Modifiability (H, M)
│   └── "Adding a Payment service must not change existing services"
├── Performance (M, H)
│   └── "Double booking must be prevented under concurrent load"
└── Testability (M, M)
    └── "Each service must be independently testable"
```

**Step 2: Architectural Decisions (Generate and Test)**

| ASR | Pattern/Tactic Chosen | Why |
|---|---|---|
| Fault isolation | Microservices + async notification | Service boundaries prevent cascade failures |
| Centralised auth | API Gateway with JWT verification | Single point of auth enforcement |
| Double booking prevention | DB UNIQUE constraint | Atomic, lock-free, database-enforced |
| Independent deployability | Monorepo + separate Render services | Each folder = one deployable unit |
| Role-based access | JWT claims (role field) + authorize middleware | Lightweight, stateless RBAC |

**Step 3: Design Solution**

Initial hypothesis: **Monolithic architecture** (one Express app, all routes in one codebase).

**Test:** Does it satisfy fault isolation ASR?
→ **No.** A crash in notification code would crash the entire app.

Next hypothesis: **Microservices with API Gateway.**

**Test:** Does it satisfy all (H,H) ASRs?
→ **Yes.**
- Fault isolation ✅ — services are separate processes
- Security ✅ — gateway verifies JWT before forwarding
- Double booking ✅ — DB UNIQUE constraint handles concurrent requests

**Step 4: Verify**

All (H,H) ASRs satisfied. Non-ASR requirements (payment, SMS) deferred to future sprints as new services.

---

## 8. Design Decisions and Tradeoffs

### Decision 1: Shared Database vs. Database per Service

**Chosen:** Shared Supabase instance (separate logical schemas)

**Rationale:** True database-per-service would require cross-service data joins via HTTP, significantly increasing latency for appointment queries that need patient, doctor, and clinic data simultaneously. For a student project on free tier infrastructure, shared DB with logical separation was the pragmatic choice.

**Tradeoff:** Reduces strict service isolation at the data layer. Mitigated by ensuring each service only queries its own tables via the application layer.

---

### Decision 2: Synchronous vs. Asynchronous Notification

**Chosen:** Fire-and-forget HTTP (asynchronous)

**Rationale:** Appointment booking response time must not depend on notification delivery. Email/SMS delivery can be delayed without affecting the user experience.

**Tradeoff:** No guaranteed delivery. If Notification Service is down, the notification is lost. Mitigated in production by a message queue (e.g., Supabase Realtime or Redis).

---

### Decision 3: JWT at Gateway vs. per Service

**Chosen:** JWT verified at Gateway only. Services trust x-user-id header.

**Rationale:** Avoids repeating JWT verification logic and the JWT_SECRET in every service. Gateway is the single trust boundary.

**Tradeoff:** If a request bypasses the gateway (internal network), services are unprotected. Mitigated in production by Render's private networking.

---

### Decision 4: Monorepo vs. Polyrepo

**Chosen:** Monorepo (one GitHub repo, multiple service folders)

**Rationale:** Easier to manage for a solo developer. Shared utilities (`shared/middleware`, `shared/utils`) can be referenced directly. Single CI/CD pipeline.

**Tradeoff:** All services deploy when any file changes (in current config). Mitigated in production by per-folder deploy triggers in Render.

---

## 9. Inter-Service Communication Map

```
Patient books appointment:
  Frontend → Gateway → Appointment Service
                              │
                              ├── Supabase (patient_profiles)
                              ├── Supabase (appointments — INSERT)
                              ├── Supabase (appointment_history — INSERT)
                              └── Notification Service (fire-and-forget)
                                          │
                                          └── Supabase (notification_log — INSERT)

Patient views slots:
  Frontend → Gateway → Scheduling Service
                              │
                              ├── Supabase (availability)
                              ├── Supabase (leave_requests)
                              └── Supabase (appointments — check existing)

Admin creates clinic:
  Frontend → Gateway (admin role check) → Clinic Service
                                                │
                                                └── Supabase (clinics — INSERT)
```

---

## 10. Database Design

### Entity Relationship Summary

```
users (1) ──── (1) patient_profiles
users (1) ──── (1) doctor_profiles
users (M) ──── (M) clinics          [via clinic_admins]
doctor_profiles (M) ── (M) clinics  [via doctor_clinic]

doctor_profiles (1) ── (M) availability
doctor_profiles (1) ── (M) leave_requests

patient_profiles (1) ── (M) appointments
doctor_profiles  (1) ── (M) appointments
clinics          (1) ── (M) appointments

appointments (1) ── (M) appointment_history
appointments (1) ── (M) notification_log
```

### Key Constraints

| Constraint | Table | Purpose |
|---|---|---|
| `UNIQUE(doctor_id, clinic_id, appointment_date, start_time)` | appointments | Prevents double booking |
| `UNIQUE(doctor_id, clinic_id)` | doctor_clinic | A doctor can only be assigned to a clinic once |
| `UNIQUE(clinic_id, user_id)` | clinic_admins | A user can only be admin of a clinic once |
| `CHECK role IN ('patient','doctor','admin')` | users | Enforces valid roles |
| `CHECK status IN ('booked','confirmed','cancelled','completed','no_show')` | appointments | Enforces valid states |

### Indexes (Performance)

```sql
idx_appointments_doctor_date  — Fast lookup: all appointments for a doctor on a date
idx_appointments_patient      — Fast lookup: all appointments for a patient
idx_appointments_clinic_date  — Fast lookup: all appointments at a clinic on a date
idx_availability_doctor       — Fast slot generation per doctor/clinic
idx_doctor_clinic_clinic      — Fast doctor list per clinic
```

---

*Document prepared for SS G653 Software Architectures — BITS Pilani, 2024-25*
