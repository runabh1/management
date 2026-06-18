const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/faculty — list all faculty
router.get('/', verifyToken, requireRole('admin', 'student'), (req, res) => {
  const faculty = db.prepare(`
    SELECT f.id, f.department, f.subject,
           u.name, u.email, u.created_at
    FROM faculty f JOIN users u ON f.user_id = u.id
    ORDER BY u.name
  `).all();
  res.json(faculty);
});

// GET /api/faculty/me — logged-in faculty profile
router.get('/me', verifyToken, requireRole('faculty'), (req, res) => {
  const fac = db.prepare('SELECT f.*, u.name, u.email FROM faculty f JOIN users u ON f.user_id = u.id WHERE f.user_id = ?').get(req.user.id);
  if (!fac) return res.status(404).json({ error: 'Faculty profile not found' });
  res.json(fac);
});

// GET /api/faculty/:id
router.get('/:id', verifyToken, (req, res) => {
  const fac = db.prepare(`
    SELECT f.*, u.name, u.email FROM faculty f JOIN users u ON f.user_id = u.id WHERE f.id = ?
  `).get(req.params.id);
  if (!fac) return res.status(404).json({ error: 'Faculty not found' });
  res.json(fac);
});

// POST /api/faculty — create faculty (admin only)
router.post('/', verifyToken, requireRole('admin'), (req, res) => {
  const { name, email, password, department, subject } = req.body;
  if (!name || !email || !password || !department || !subject) {
    return res.status(400).json({ error: 'name, email, password, department, subject are required' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const userRes = db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'faculty')`).run(name, email.toLowerCase(), hash);
    const facRes = db.prepare(`INSERT INTO faculty (user_id, department, subject) VALUES (?, ?, ?)`).run(userRes.lastInsertRowid, department, subject);
    const faculty = db.prepare('SELECT f.*, u.name, u.email FROM faculty f JOIN users u ON f.user_id = u.id WHERE f.id = ?').get(facRes.lastInsertRowid);
    res.status(201).json(faculty);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/faculty/:id (admin only)
router.put('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { name, email, department, subject } = req.body;

  const fac = db.prepare('SELECT * FROM faculty WHERE id = ?').get(id);
  if (!fac) return res.status(404).json({ error: 'Faculty not found' });

  try {
    if (name !== undefined || email !== undefined) {
      db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?').run(name || null, email?.toLowerCase() || null, fac.user_id);
    }
    db.prepare('UPDATE faculty SET department = COALESCE(?, department), subject = COALESCE(?, subject) WHERE id = ?').run(department || null, subject || null, id);
    const updated = db.prepare('SELECT f.*, u.name, u.email FROM faculty f JOIN users u ON f.user_id = u.id WHERE f.id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/faculty/:id (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const fac = db.prepare('SELECT * FROM faculty WHERE id = ?').get(id);
  if (!fac) return res.status(404).json({ error: 'Faculty not found' });
  db.prepare('DELETE FROM users WHERE id = ?').run(fac.user_id);
  res.json({ message: 'Faculty deleted successfully' });
});

// GET /api/faculty/:id/stats
router.get('/:id/stats', verifyToken, (req, res) => {
  const { id } = req.params;
  const assignments = db.prepare('SELECT COUNT(*) as count FROM assignments WHERE faculty_id = ?').get(id);
  const students = db.prepare('SELECT COUNT(DISTINCT student_id) as count FROM attendance WHERE marked_by = ?').get(id);
  res.json({ assignments, students });
});

module.exports = router;
