const { serializeCookie } = require('../lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', serializeCookie('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  }));

  res.writeHead(302, { Location: '/login.html' });
  res.end();
};
