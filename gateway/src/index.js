require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const proxy = require('express-http-proxy');
const { verifyToken } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Service URLs — in production these come from environment variables
const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:3001',
  user:         process.env.USER_SERVICE_URL         || 'http://localhost:3002',
  clinic:       process.env.CLINIC_SERVICE_URL       || 'http://localhost:3003',
  doctor:       process.env.DOCTOR_SERVICE_URL       || 'http://localhost:3004',
  scheduling:   process.env.SCHEDULING_SERVICE_URL   || 'http://localhost:3005',
  appointment:  process.env.APPOINTMENT_SERVICE_URL  || 'http://localhost:3006',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
};

// Public routes — no JWT required
app.use('/api/auth', proxy(SERVICES.auth));

// Protected routes — JWT verified by gateway before forwarding
app.use('/api/users',         verifyToken, proxy(SERVICES.user));
app.use('/api/clinics',       verifyToken, proxy(SERVICES.clinic));
app.use('/api/doctors',       verifyToken, proxy(SERVICES.doctor));
app.use('/api/scheduling',    verifyToken, proxy(SERVICES.scheduling));
app.use('/api/appointments',  verifyToken, proxy(SERVICES.appointment));
app.use('/api/notifications', verifyToken, proxy(SERVICES.notification));

// Gateway health check
app.get('/health', (req, res) => {
  res.json({ service: 'api-gateway', status: 'ok' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
