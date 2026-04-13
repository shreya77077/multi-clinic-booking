const { createClient } = require('@supabase/supabase-js');

let client = null;

const getSupabaseClient = () => {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  }

  client = createClient(url, key, {
    auth: { persistSession: false }
  });

  return client;
};

module.exports = { getSupabaseClient };
