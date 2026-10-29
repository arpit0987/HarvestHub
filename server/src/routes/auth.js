const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const db = require('../db');

const SECRET = process.env.AUTH_SECRET || 'harvesthub_secret_key_spring_2026';

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateToken(user) {
  const payload = JSON.stringify({ id: user.id, email: user.email, ts: Date.now() });
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + hmac;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const payload = Buffer.from(parts[0], 'base64').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedHmac))) {
      return null;
    }
    return JSON.parse(payload);
  } catch (_) {
    return null;
  }
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { email, password, full_name, role, farm_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, error: 'Email, password, and full name are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const assignedRole = role || 'Farm Manager';
    const assignedFarm = farm_name || 'Willow Creek Farm';
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}&backgroundColor=059669`;

    const result = db.prepare(`
      INSERT INTO users (email, password_hash, salt, full_name, role, farm_name, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(cleanEmail, hash, salt, full_name.trim(), assignedRole, assignedFarm, avatar);

    const user = {
      id: Number(result.lastInsertRowid),
      email: cleanEmail,
      full_name: full_name.trim(),
      role: assignedRole,
      farm_name: assignedFarm,
      avatar_url: avatar
    };

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: `Welcome to HarvestHub, ${user.full_name}!`,
      user,
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!userRow) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const testHash = hashPassword(password, userRow.salt);
    const valid = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(userRow.password_hash, 'hex'));

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role,
      farm_name: userRow.farm_name,
      avatar_url: userRow.avatar_url
    };

    const token = generateToken(user);
    res.json({
      success: true,
      message: `Signed in as ${user.full_name}`,
      user,
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token;

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Not authenticated or invalid token.' });
    }

    const userRow = db.prepare('SELECT id, email, full_name, role, farm_name, avatar_url FROM users WHERE id = ?').get(decoded.id);
    if (!userRow) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    res.json({ success: true, user: userRow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.body.token;

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { full_name, role, farm_name } = req.body;
    db.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          role = COALESCE(?, role),
          farm_name = COALESCE(?, farm_name)
      WHERE id = ?
    `).run(full_name, role, farm_name, decoded.id);

    const updatedUser = db.prepare('SELECT id, email, full_name, role, farm_name, avatar_url FROM users WHERE id = ?').get(decoded.id);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, full_name, role, farm_name, avatar_url FROM users ORDER BY id ASC').all();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
