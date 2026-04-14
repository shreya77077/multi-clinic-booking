const { getSupabaseClient } = require('../utils/supabase');

const EVENTS = {
  booking_confirmed:    'Your appointment has been confirmed.',
  appointment_reminder: 'Reminder: You have an appointment tomorrow.',
  cancellation:         'Your appointment has been cancelled.',
};

const sendNotification = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { user_id, appointment_id, type, event, recipient } = req.body;

    if (!event || !recipient) {
      return res.status(400).json({ error: 'event and recipient are required' });
    }

    const message = EVENTS[event] || event;

    // Log the notification
    const { data, error } = await supabase
      .from('notification_log')
      .insert({
        user_id: user_id || null,
        appointment_id: appointment_id || null,
        type: type || 'email',
        event,
        recipient,
        status: 'sent'
      })
      .select()
      .single();

    if (error) throw error;

    // In production: integrate with SendGrid / Twilio here
    console.log(`[NOTIFICATION] ${type} to ${recipient}: ${message}`);

    return res.status(201).json({ message: 'Notification sent', notification: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notification_log')
      .select('*')
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return res.json({ notifications: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { sendNotification, getNotifications };
