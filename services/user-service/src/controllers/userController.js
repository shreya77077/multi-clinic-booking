const { getSupabaseClient } = require('../utils/supabase');

const getProfile = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const userId = req.user.id;
    const role = req.user.role;

    let profile;
    if (role === 'patient') {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      profile = data;
    } else if (role === 'doctor') {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      profile = data;
    } else {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', userId)
        .single();
      if (error) throw error;
      profile = data;
    }

    return res.json({ profile });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const userId = req.user.id;
    const role = req.user.role;
    const updates = req.body;

    const table = role === 'patient' ? 'patient_profiles' : 'doctor_profiles';
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return res.json({ message: 'Profile updated', profile: data });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getProfile, updateProfile };
