const { getSupabaseClient } = require('../utils/supabase');
const axios = require('axios');

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';

const bookAppointment = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { doctor_id, clinic_id, appointment_date, start_time, end_time, notes } = req.body;
    const userId = req.user.id;

    if (!doctor_id || !clinic_id || !appointment_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get patient profile
    const { data: patient, error: pErr } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (pErr || !patient) return res.status(404).json({ error: 'Patient profile not found' });

    // Check for double booking
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('clinic_id', clinic_id)
      .eq('appointment_date', appointment_date)
      .eq('start_time', start_time)
      .neq('status', 'cancelled')
      .single();

    if (existing) {
      return res.status(409).json({ error: 'This slot is already booked' });
    }

    // Book appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        doctor_id,
        clinic_id,
        appointment_date,
        start_time,
        end_time,
        notes,
        status: 'booked'
      })
      .select()
      .single();

    if (error) throw error;

    // Record history
    await supabase.from('appointment_history').insert({
      appointment_id: appointment.id,
      old_status: null,
      new_status: 'booked',
      changed_by: userId
    });

    // Notify (fire and forget)
    axios.post(`${NOTIFICATION_URL}/notify`, {
      user_id: userId,
      appointment_id: appointment.id,
      type: 'email',
      event: 'booking_confirmed',
      recipient: req.user.email
    }).catch(() => {});

    return res.status(201).json({ message: 'Appointment booked', appointment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const userId = req.user.id;
    const role = req.user.role;

    let query = supabase.from('appointments').select(`
      *, 
      doctor_profiles ( full_name, specialization ),
      clinics ( name, address, city )
    `);

    if (role === 'patient') {
      const { data: patient } = await supabase
        .from('patient_profiles').select('id').eq('user_id', userId).single();
      if (patient) query = query.eq('patient_id', patient.id);
    } else if (role === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctor_profiles').select('id').eq('user_id', userId).single();
      if (doctor) query = query.eq('doctor_id', doctor.id);
    }

    const { data, error } = await query.order('appointment_date', { ascending: false });
    if (error) throw error;
    return res.json({ appointments: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('appointment_history').insert({
      appointment_id: id,
      old_status: 'booked',
      new_status: 'cancelled',
      changed_by: req.user.id,
      reason
    });

    return res.json({ message: 'Appointment cancelled', appointment: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { clinic_id, date } = req.query;
    let query = supabase.from('appointments').select(`
      *,
      patient_profiles ( full_name, phone ),
      doctor_profiles ( full_name, specialization ),
      clinics ( name )
    `);
    if (clinic_id) query = query.eq('clinic_id', clinic_id);
    if (date) query = query.eq('appointment_date', date);
    const { data, error } = await query.order('appointment_date');
    if (error) throw error;
    return res.json({ appointments: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { bookAppointment, getMyAppointments, cancelAppointment, getAllAppointments };
