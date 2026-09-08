const { checkAuth } = require('../lib/auth');
const supabase = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Session expired or unauthorized access.' });
  }

  const method = req.method;

  try {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('is_purchased', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === 'POST') {
      let name, quantity;
      if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
         name = req.body.name;
         quantity = req.body.quantity;
      } else {
         const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
         name = body ? body.name : null;
         quantity = body ? body.quantity : null;
      }

      name = (name || '').trim();
      quantity = parseInt(quantity, 10);
      if (isNaN(quantity)) quantity = 1;

      if (!name || name.length > 100) {
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
           res.writeHead(302, { Location: '/?error=invalid_name' });
           return res.end();
        }
        return res.status(400).json({ error: 'Invalid name.' });
      }

      if (quantity < 1) quantity = 1;
      if (quantity > 99) quantity = 99;

      const { data, error } = await supabase
        .from('shopping_items')
        .insert([{ name, quantity }])
        .select();

      if (error) throw error;
      
      // Update recent items table
      await supabase
        .from('recent_items')
        .upsert(
          { name: name, last_added_at: new Date().toISOString() },
          { onConflict: 'name' }
        );
      
      
      if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
        res.writeHead(302, { Location: '/' });
        return res.end();
      }

      return res.status(201).json(data[0]);
    }

    if (method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, action } = body || {}; 

      if (!id) return res.status(400).json({ error: 'ID is required.' });

      const { data: item, error: fetchError } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({ error: 'Not found.' });
      }

      let updates = {};
      if (action === 'toggle') {
        updates.is_purchased = !item.is_purchased;
      } else if (action === 'increment') {
        updates.quantity = Math.min(99, item.quantity + 1);
      } else if (action === 'decrement') {
        updates.quantity = Math.max(1, item.quantity - 1);
      } else {
        return res.status(400).json({ error: 'Invalid action.' });
      }

      const { data, error } = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return res.status(200).json(data[0]);
    }

    if (method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id } = body || {};

      if (!id) return res.status(400).json({ error: 'ID is required.' });

      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
