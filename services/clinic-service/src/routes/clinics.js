const express = require('express');
const router = express.Router();
const { getAllClinics, getClinic, createClinic, updateClinic } = require('../controllers/clinicController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/clinics', authenticate, getAllClinics);
router.get('/clinics/:id', authenticate, getClinic);
router.post('/clinics', authenticate, authorize('admin'), createClinic);
router.put('/clinics/:id', authenticate, authorize('admin'), updateClinic);

module.exports = router;
