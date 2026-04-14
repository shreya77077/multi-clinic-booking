const { getSupabaseClient } = require('../utils/supabase');

// GET /slots?doctor_id=xxx&clinic_id=xxx&date=2026-04-15
const getAvailableSlots = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { doctor_id, clinic_id, date } = req.query;

    if (!doctor_id || !clinic_id || !date) {
      return res.status(400).json({ error: 'doctor_id, clinic_id, date are required' });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0=Sun, 6=Sat

    // Get availability for this doctor/clinic/day
    const { data: availability, error: avErr } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', doctor_id)
      .eq('clinic_id', clinic_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (avErr || !availability) {
      return res.json({ slots: [], message: 'No availability for this day' });
    }

    // Check for leave
    const { data: leave } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('leave_date', date)
      .eq('status', 'approved')
      .single();

    if (leave) {
      return res.json({ slots: [], message: 'Doctor is on leave this day' });
    }

    // Get existing appointments for this date
    const { data: booked } = await supabase
      .from('appointments')
      .select('start_time')
      .eq('doctor_id', doctor_id)
      .eq('clinic_id', clinic_id)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    const bookedTimes = new Set((booked || []).map(a => a.start_time));

    // Generate slots
    const slots = [];
    const [startH, startM] = availability.start_time.split(':').map(Number);
    const [endH, endM] = availability.end_time.split(':').map(Number);
    const duration = availability.slot_duration_mins;

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + duration <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, '0');
      const m = String(current % 60).padStart(2, '0');
      const timeStr = `${h}:${m}:00`;
      slots.push({
        start_time: timeStr,
        end_time: (() => {
          const e = current + duration;
          return `${String(Math.floor(e/60)).padStart(2,'0')}:${String(e%60).padStart(2,'0')}:00`;
        })(),
        available: !bookedTimes.has(timeStr)
      });
      current += duration;
    }

    return res.json({ date, doctor_id, clinic_id, slots });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const setAvailability = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration_mins } = req.body;
    if (!doctor_id || !clinic_id || day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { data, error } = await supabase
      .from('availability')
      .upsert({ doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration_mins: slot_duration_mins || 30 })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ message: 'Availability set', availability: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const addLeave = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { doctor_id, clinic_id, leave_date, reason } = req.body;
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({ doctor_id, clinic_id, leave_date, reason, status: 'approved' })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ message: 'Leave added', leave: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAvailableSlots, setAvailability, addLeave };
