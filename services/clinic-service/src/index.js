require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { getAllClinics, getClinic, createClinic, updateClinic } = require('./controllers/clinicController');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'clinic-service', status: 'ok' }));

// Handle both /clinics and / routes
app.get(['/clinics', '/'],    authenticate, getAllClinics);
app.get(['/clinics/:id'],     authenticate, getClinic);
app.post(['/clinics', '/'],   authenticate, authorize('admin'), createClinic);
app.put(['/clinics/:id'],     authenticate, authorize('admin'), updateClinic);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Clinic Service running on port ${PORT}`));
