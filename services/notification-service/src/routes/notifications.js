const express = require('express');
const router = express.Router();
const { sendNotification, getNotifications } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.post('/notify', sendNotification);
router.get('/notifications', authenticate, getNotifications);

module.exports = router;
