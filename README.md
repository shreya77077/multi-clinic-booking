# Multi-Clinic Appointment Booking System

A microservices-based healthcare appointment platform built with Node.js, Express, Supabase, and Next.js.

## Architecture

```
Frontend (Next.js / Vercel)
        │
        ▼
API Gateway :8080   ← Single entry point, JWT verification, rate limiting
        │
        ├── Auth Service        :3001
        ├── User Service        :3002
        ├── Clinic Service      :3003
        ├── Doctor Service      :3004
        ├── Scheduling Service  :3005
        ├── Appointment Service :3006
        └── Notification Service:3007
                │
                ▼
          Supabase (PostgreSQL)
          One schema per service
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| API Gateway | Node.js + Express |
| Microservices | Node.js + Express (x7) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + JWT |
| Local dev | Docker Compose |
| Frontend hosting | Vercel |
| Service hosting | Render |

## Local Development

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- A Supabase project (free tier)

### Setup

1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/multi-clinic-booking
cd multi-clinic-booking
```

2. Copy env files and fill in your Supabase credentials
```bash
cp services/auth-service/.env.example services/auth-service/.env
cp services/user-service/.env.example services/user-service/.env
cp services/clinic-service/.env.example services/clinic-service/.env
cp services/doctor-service/.env.example services/doctor-service/.env
cp services/scheduling-service/.env.example services/scheduling-service/.env
cp services/appointment-service/.env.example services/appointment-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp gateway/.env.example gateway/.env
```

3. Run all services with Docker Compose
```bash
docker compose up --build
```

4. Check all services are healthy
```bash
curl http://localhost:8080/health   # Gateway
curl http://localhost:3001/health   # Auth
curl http://localhost:3002/health   # User
# ... and so on
```

### Run a single service (without Docker)
```bash
cd services/auth-service
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Services

| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 8080 | Routing, JWT verification, rate limiting |
| Auth Service | 3001 | Register, login, JWT issuance |
| User Service | 3002 | Patient & doctor profiles |
| Clinic Service | 3003 | Clinic management |
| Doctor Service | 3004 | Doctor profiles, clinic mapping |
| Scheduling Service | 3005 | Availability slots, leave management |
| Appointment Service | 3006 | Book, cancel, reschedule |
| Notification Service | 3007 | Email/SMS alerts |

## API Routes (via Gateway)

| Method | Route | Auth | Service |
|---|---|---|---|
| POST | /api/auth/register | Public | Auth |
| POST | /api/auth/login | Public | Auth |
| GET | /api/users/me | JWT | User |
| GET | /api/clinics | JWT | Clinic |
| POST | /api/clinics | JWT (admin) | Clinic |
| GET | /api/doctors | JWT | Doctor |
| GET | /api/scheduling/slots | JWT | Scheduling |
| POST | /api/appointments | JWT (patient) | Appointment |
| GET | /api/appointments/me | JWT | Appointment |

## Deployment

- **Frontend** → Vercel (connect GitHub repo, set root to `/frontend`)
- **Each service** → Render (create one Web Service per service folder)
- **Database** → Supabase (create project, run SQL schema)

## Database Schema

See `/docs/schema.sql` for the complete Supabase schema.

## Architectural Documentation

See `/docs/architecture.md` for:
- Module view
- C&C view
- Deployment view
- QA scenarios
- ADD rationale
