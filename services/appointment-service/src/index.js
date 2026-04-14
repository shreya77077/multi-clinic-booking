require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const appointmentRoutes = require('./routes/appointments');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'appointment-service', status: 'ok' }));
app.use('/', appointmentRoutes);

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`Appointment Service running on port ${PORT}`));
