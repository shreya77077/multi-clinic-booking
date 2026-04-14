require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const schedulingRoutes = require('./routes/scheduling');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'scheduling-service', status: 'ok' }));
app.use('/', schedulingRoutes);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Scheduling Service running on port ${PORT}`));
