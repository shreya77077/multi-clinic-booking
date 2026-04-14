const express = require('express');
const router = express.Router();
const { bookAppointment, getMyAppointments, cancelAppointment, getAllAppointments } = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/appointments', authenticate, authorize('patient'), bookAppointment);
router.get('/appointments/me', authenticate, getMyAppointments);
router.put('/appointments/:id/cancel', authenticate, cancelAppointment);
router.get('/appointments', authenticate, authorize('admin', 'doctor'), getAllAppointments);

module.exports = router;
