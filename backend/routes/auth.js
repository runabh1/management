const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'smartcampus_super_secret_jwt_key_2024_xK9mP3qR';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Get role-specific profile data
  let profile = {};
  if (user.role === 'student') {
    profile = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id) || {};
  } else if (user.role === 'faculty') {
    profile = db.prepare('SELECT * FROM faculty WHERE user_id = ?').get(user.id) || {};
  }

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...profile
    }
  });
});

// GET /api/auth/me — get current user profile
router.get('/me', verifyToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let profile = {};
  if (user.role === 'student') {
    profile = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id) || {};
  } else if (user.role === 'faculty') {
    profile = db.prepare('SELECT * FROM faculty WHERE user_id = ?').get(user.id) || {};
  }

  res.json({ ...user, ...profile });
});

module.exports = router;
