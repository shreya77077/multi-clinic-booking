const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getSupabaseClient } = require('../utils/supabase');

const generateToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ── POST /register ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, role, full_name, phone } = req.body;

    // Validate input
    if (!email || !password || !role || !full_name) {
      return res.status(400).json({ error: 'email, password, role, full_name are required' });
    }
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role must be patient, doctor, or admin' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    const supabase = getSupabaseClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ email, password_hash, role })
      .select()
      .single();

    if (userError) throw userError;

    // Create profile based on role
    if (role === 'patient') {
      await supabase
        .from('patient_profiles')
        .insert({ user_id: user.id, full_name, phone: phone || null });
    } else if (role === 'doctor') {
      const { specialization } = req.body;
      await supabase
        .from('doctor_profiles')
        .insert({
          user_id: user.id,
          full_name,
          phone: phone || null,
          specialization: specialization || 'General'
        });
    }

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── POST /login ────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const supabase = getSupabaseClient();

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /me ────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });

  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, getMe };
