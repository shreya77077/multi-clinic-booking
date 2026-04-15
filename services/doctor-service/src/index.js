require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { getDoctorsByClinic, getDoctorProfile, assignDoctorToClinic } = require('./controllers/doctorController');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'doctor-service', status: 'ok' }));

app.get(['/doctors/clinic/:clinicId', '/clinic/:clinicId'], authenticate, getDoctorsByClinic);
app.get(['/doctors/:id', '/:id'], authenticate, getDoctorProfile);
app.post(['/doctors/assign', '/assign'], authenticate, authorize('admin'), assignDoctorToClinic);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Doctor Service running on port ${PORT}`));
