require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());

const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:3001',
  user:         process.env.USER_SERVICE_URL         || 'http://localhost:3002',
  clinic:       process.env.CLINIC_SERVICE_URL       || 'http://localhost:3003',
  doctor:       process.env.DOCTOR_SERVICE_URL       || 'http://localhost:3004',
  scheduling:   process.env.SCHEDULING_SERVICE_URL   || 'http://localhost:3005',
  appointment:  process.env.APPOINTMENT_SERVICE_URL  || 'http://localhost:3006',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers['x-user-id']    = decoded.sub;
    req.headers['x-user-role']  = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const proxy = (target, pathRewrite) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite,
  on: {
    error: (err, req, res) => res.status(502).json({ error: 'Service unavailable' })
  }
});

app.get('/health', (req, res) => res.json({ service: 'api-gateway', status: 'ok' }));

// Public
app.use('/api/auth', proxy(SERVICES.auth, { '^/api/auth': '' }));

// Protected
app.use('/api/users',         verifyToken, proxy(SERVICES.user,         { '^/api/users': '' }));
app.use('/api/clinics',       verifyToken, proxy(SERVICES.clinic,       { '^/api/clinics': '/clinics' }));
app.use('/api/doctors',       verifyToken, proxy(SERVICES.doctor,       { '^/api/doctors': '/doctors' }));
app.use('/api/scheduling',    verifyToken, proxy(SERVICES.scheduling,   { '^/api/scheduling': '' }));
app.use('/api/appointments',  verifyToken, proxy(SERVICES.appointment,  { '^/api/appointments': '/appointments' }));
app.use('/api/notifications', verifyToken, proxy(SERVICES.notification, { '^/api/notifications': '' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
