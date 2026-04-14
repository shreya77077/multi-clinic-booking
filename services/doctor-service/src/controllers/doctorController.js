const { getSupabaseClient } = require('../utils/supabase');

const getDoctorsByClinic = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('doctor_clinic')
      .select(`
        id, consultation_fee, is_active,
        doctor_profiles ( id, full_name, specialization, qualification, experience_yrs, bio )
      `)
      .eq('clinic_id', req.params.clinicId)
      .eq('is_active', true);
    if (error) throw error;
    return res.json({ doctors: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getDoctorProfile = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Doctor not found' });
    return res.json({ doctor: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const assignDoctorToClinic = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { doctor_id, clinic_id, consultation_fee } = req.body;
    if (!doctor_id || !clinic_id) {
      return res.status(400).json({ error: 'doctor_id and clinic_id are required' });
    }
    const { data, error } = await supabase
      .from('doctor_clinic')
      .insert({ doctor_id, clinic_id, consultation_fee: consultation_fee || 0 })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ message: 'Doctor assigned to clinic', mapping: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getDoctorsByClinic, getDoctorProfile, assignDoctorToClinic };
