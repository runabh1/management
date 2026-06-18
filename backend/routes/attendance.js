const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/attendance — view attendance records
// Faculty/admin: query by student_id, subject, date range
// Student: only their own
router.get('/', verifyToken, (req, res) => {
  const { student_id, subject, from, to, date } = req.query;

  let sid = student_id;

  // Students can only see their own attendance
  if (req.user.role === 'student') {
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    sid = student.id;
  }

  let query = `
    SELECT a.*, u.name as student_name, s.roll_no
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (sid) { query += ' AND a.student_id = ?'; params.push(sid); }
  if (subject) { query += ' AND a.subject = ?'; params.push(subject); }
  if (date) { query += ' AND a.date = ?'; params.push(date); }
  if (from) { query += ' AND a.date >= ?'; params.push(from); }
  if (to) { query += ' AND a.date <= ?'; params.push(to); }
  query += ' ORDER BY a.date DESC, a.subject';

  res.json(db.prepare(query).all(...params));
});

// GET /api/attendance/summary — summary per subject for a student
router.get('/summary', verifyToken, (req, res) => {
  let { student_id } = req.query;

  if (req.user.role === 'student') {
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    student_id = student.id;
  }

  if (!student_id) return res.status(400).json({ error: 'student_id required' });

  const summary = db.prepare(`
    SELECT subject,
      COUNT(*) as total,
      SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late,
      ROUND(SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as percentage
    FROM attendance
    WHERE student_id = ?
    GROUP BY subject
    ORDER BY subject
  `).all(student_id);

  res.json(summary);
});

// GET /api/attendance/report — class-wide report for faculty
router.get('/report', verifyToken, requireRole('admin', 'faculty'), (req, res) => {
  const { subject, date } = req.query;
  if (!subject || !date) return res.status(400).json({ error: 'subject and date are required' });

  const records = db.prepare(`
    SELECT a.status, u.name as student_name, s.roll_no
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE a.subject = ? AND a.date = ?
    ORDER BY s.roll_no
  `).all(subject, date);

  res.json(records);
});

// POST /api/attendance/mark — mark attendance (faculty/admin)
router.post('/mark', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const { records } = req.body; // [{ student_id, subject, date, status }]
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array is required' });
  }

  let facultyId = null;
  if (req.user.role === 'faculty') {
    const fac = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user.id);
    facultyId = fac?.id;
  }

  const upsert = db.prepare(`
    INSERT INTO attendance (student_id, subject, date, status, marked_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id, subject, date) DO UPDATE SET status = excluded.status, marked_by = excluded.marked_by
  `);

  const markMany = db.transaction((recs) => {
    for (const r of recs) {
      if (!r.student_id || !r.subject || !r.date || !r.status) continue;
      upsert.run(r.student_id, r.subject, r.date, r.status, facultyId);
    }
  });

  markMany(records);
  res.json({ message: `${records.length} attendance records saved` });
});

// POST /api/attendance/single — mark single record
router.post('/single', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const { student_id, subject, date, status } = req.body;
  if (!student_id || !subject || !date || !status) {
    return res.status(400).json({ error: 'student_id, subject, date, status required' });
  }

  let facultyId = null;
  if (req.user.role === 'faculty') {
    const fac = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user.id);
    facultyId = fac?.id;
  }

  db.prepare(`
    INSERT INTO attendance (student_id, subject, date, status, marked_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id, subject, date) DO UPDATE SET status = excluded.status, marked_by = excluded.marked_by
  `).run(student_id, subject, date, status, facultyId);

  res.json({ message: 'Attendance marked successfully' });
});

module.exports = router;
