require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const doctorRoutes = require('./routes/doctors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'doctor-service', status: 'ok' }));
app.use('/', doctorRoutes);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Doctor Service running on port ${PORT}`));
