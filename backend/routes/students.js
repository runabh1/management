const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/students — list all students (admin + faculty)
router.get('/', verifyToken, requireRole('admin', 'faculty'), (req, res) => {
  const { dept, semester, search } = req.query;
  let query = `
    SELECT s.id, s.roll_no, s.department, s.semester, s.phone,
           u.name, u.email, u.created_at
    FROM students s JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (dept) { query += ' AND s.department = ?'; params.push(dept); }
  if (semester) { query += ' AND s.semester = ?'; params.push(semester); }
  if (search) { query += ' AND (u.name LIKE ? OR s.roll_no LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY s.roll_no';
  res.json(db.prepare(query).all(...params));
});

// GET /api/students/me — logged-in student's own profile
router.get('/me', verifyToken, requireRole('student'), (req, res) => {
  const student = db.prepare('SELECT s.*, u.name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.user_id = ?').get(req.user.id);
  if (!student) return res.status(404).json({ error: 'Student profile not found' });
  res.json(student);
});

// GET /api/students/:id
router.get('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  if (req.user.role === 'student') {
    const self = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
    if (!self || self.id !== parseInt(id)) return res.status(403).json({ error: 'Access denied' });
  }
  const student = db.prepare(`
    SELECT s.*, u.name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?
  `).get(id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

// POST /api/students — create student (admin only)
router.post('/', verifyToken, requireRole('admin'), (req, res) => {
  const { name, email, password, roll_no, department, semester, phone } = req.body;
  if (!name || !email || !password || !roll_no || !department || !semester) {
    return res.status(400).json({ error: 'name, email, password, roll_no, department, semester are required' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const userRes = db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')`).run(name, email.toLowerCase(), hash);
    const stuRes = db.prepare(`INSERT INTO students (user_id, roll_no, department, semester, phone) VALUES (?, ?, ?, ?, ?)`).run(userRes.lastInsertRowid, roll_no, department, parseInt(semester), phone || null);
    const student = db.prepare('SELECT s.*, u.name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?').get(stuRes.lastInsertRowid);
    res.status(201).json(student);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email or roll number already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id — update student (admin only)
router.put('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { name, email, department, semester, phone, roll_no } = req.body;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  try {
    if (name !== undefined || email !== undefined) {
      db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?').run(name || null, email?.toLowerCase() || null, student.user_id);
    }
    db.prepare(`
      UPDATE students SET
        roll_no = COALESCE(?, roll_no),
        department = COALESCE(?, department),
        semester = COALESCE(?, semester),
        phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(roll_no || null, department || null, semester ? parseInt(semester) : null, phone || null, id);

    const updated = db.prepare('SELECT s.*, u.name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email or roll number already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id — delete student (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
  res.json({ message: 'Student deleted successfully' });
});

// GET /api/students/:id/stats — attendance + marks summary
router.get('/:id/stats', verifyToken, (req, res) => {
  const { id } = req.params;
  const attendance = db.prepare(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late
    FROM attendance WHERE student_id = ?
  `).get(id);

  const marks = db.prepare(`
    SELECT AVG(marks * 100.0 / max_marks) as avg_pct,
      COUNT(*) as count
    FROM marks WHERE student_id = ?
  `).get(id);

  const assignments = db.prepare(`
    SELECT COUNT(*) as submitted FROM submissions WHERE student_id = ?
  `).get(id);

  const totalAssignments = db.prepare('SELECT COUNT(*) as total FROM assignments').get();

  res.json({ attendance, marks, assignments, totalAssignments });
});

module.exports = router;
