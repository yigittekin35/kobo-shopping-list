const { createSession } = require('../lib/auth');
const cookie = require('cookie');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pin;
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
    pin = req.body.pin;
  } else {
    try {
      pin = typeof req.body === 'string' ? JSON.parse(req.body).pin : req.body.pin;
    } catch(e) {
      pin = req.body.pin;
    }
  }

  if (!pin || pin !== process.env.HOUSEHOLD_PIN) {
    // If URL encoded form submission, redirect back with error (could use query params for simple error display)
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
      res.writeHead(302, { Location: '/login.html?error=1' });
      res.end();
      return;
    }
    return res.status(401).json({ error: 'Invalid PIN. Please try again.' });
  }

  const session = createSession();
  
  res.setHeader('Set-Cookie', cookie.serialize('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60,
    path: '/'
  }));

  if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  return res.status(200).json({ success: true });
};
