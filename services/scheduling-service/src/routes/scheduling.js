const express = require('express');
const router = express.Router();
const { getAvailableSlots, setAvailability, addLeave } = require('../controllers/schedulingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/slots', authenticate, getAvailableSlots);
router.post('/availability', authenticate, authorize('admin', 'doctor'), setAvailability);
router.post('/leave', authenticate, authorize('admin', 'doctor'), addLeave);

module.exports = router;
