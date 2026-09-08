const crypto = require('crypto');
const cookie = require('cookie');

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
  const cookies = cookie.parse(req.headers.cookie || '');
  return verifySession(cookies.session);
}

module.exports = {
  createSession,
  verifySession,
  checkAuth
};
