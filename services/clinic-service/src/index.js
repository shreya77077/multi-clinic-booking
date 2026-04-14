require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const clinicRoutes = require('./routes/clinics');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'clinic-service', status: 'ok' }));
app.use('/', clinicRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Clinic Service running on port ${PORT}`));
