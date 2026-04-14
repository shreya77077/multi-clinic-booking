const { getSupabaseClient } = require('../utils/supabase');

const getAllClinics = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return res.json({ clinics: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getClinic = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Clinic not found' });
    return res.json({ clinic: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createClinic = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { name, address, city, phone, email, description } = req.body;
    if (!name || !address || !city) {
      return res.status(400).json({ error: 'name, address, city are required' });
    }
    const { data, error } = await supabase
      .from('clinics')
      .insert({ name, address, city, phone, email, description })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ message: 'Clinic created', clinic: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateClinic = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('clinics')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ message: 'Clinic updated', clinic: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllClinics, getClinic, createClinic, updateClinic };
