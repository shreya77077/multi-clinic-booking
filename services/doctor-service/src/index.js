require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check — used by API Gateway to verify service is alive
app.get('/health', (req, res) => {
  res.json({ service: 'doctor-service', status: 'ok', port: 3004 });
});

// TODO: mount routes
// const routes = require('./routes');
// app.use('/', routes);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`doctor-service running on port ${PORT}`);
});
