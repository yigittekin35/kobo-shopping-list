const { checkAuth } = require('../lib/auth');
const supabase = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Session expired or unauthorized access.' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('recent_items')
        .select('name')
        .order('last_added_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('Recent API Error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
