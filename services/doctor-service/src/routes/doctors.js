const express = require('express');
const router = express.Router();
const { getDoctorsByClinic, assignDoctorToClinic, getDoctorProfile } = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/doctors/clinic/:clinicId', authenticate, getDoctorsByClinic);
router.get('/doctors/:id', authenticate, getDoctorProfile);
router.post('/doctors/assign', authenticate, authorize('admin'), assignDoctorToClinic);

module.exports = router;
