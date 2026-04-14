require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'notification-service', status: 'ok' }));
app.use('/', notificationRoutes);

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
