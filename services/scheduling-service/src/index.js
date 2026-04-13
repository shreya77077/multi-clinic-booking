require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check — used by API Gateway to verify service is alive
app.get('/health', (req, res) => {
  res.json({ service: 'scheduling-service', status: 'ok', port: 3005 });
});

// TODO: mount routes
// const routes = require('./routes');
// app.use('/', routes);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`scheduling-service running on port ${PORT}`);
});
