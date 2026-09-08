const crypto = require('crypto');

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(function(cookie) {
    let parts = cookie.split('=');
    let name = parts.shift().trim();
    if (!name) return;
    list[name] = decodeURIComponent(parts.join('='));
  });
  return list;
}

function serializeCookie(name, val, options) {
  let str = `${name}=${encodeURIComponent(val)}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  if (options.maxAge) str += `; Max-Age=${options.maxAge}`;
  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options.path) str += `; Path=${options.path}`;
  return str;
}


function createSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  
  // Create a payload, valid for 90 days
  const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;
  const payload = `auth=${expiresAt}`;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  return `${payload}.${signature}`;
}

function verifySession(sessionCookie) {
  if (!sessionCookie) return false;
  
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  
  const parts = sessionCookie.split('.');
  if (parts.length !== 2) return false;
  
  const payload = parts[0];
  const signature = parts[1];
  
  const expectedHmac = crypto.createHmac('sha256', secret);
  expectedHmac.update(payload);
  const expectedSignature = expectedHmac.digest('hex');
  
  if (signature.length !== expectedSignature.length) return false;
  const isValidSig = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  
  if (!isValidSig) return false;
  
  const match = payload.match(/^auth=(\d+)$/);
  if (!match) return false;
  
  const expiresAt = parseInt(match[1], 10);
  if (Date.now() > expiresAt) return false;
  
  return true;
}

function checkAuth(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySession(cookies.session);
}

module.exports = {
  createSession,
  verifySession,
  checkAuth,
  serializeCookie
};
