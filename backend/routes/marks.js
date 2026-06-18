const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/marks — view marks
router.get('/', verifyToken, (req, res) => {
  let { student_id, subject, exam_type } = req.query;

  if (req.user.role === 'student') {
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    student_id = student.id;
  }

  let query = `
    SELECT m.*, u.name as student_name, s.roll_no
    FROM marks m
    JOIN students s ON m.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (student_id) { query += ' AND m.student_id = ?'; params.push(student_id); }
  if (subject) { query += ' AND m.subject = ?'; params.push(subject); }
  if (exam_type) { query += ' AND m.exam_type = ?'; params.push(exam_type); }
  query += ' ORDER BY m.subject, m.exam_type';

  res.json(db.prepare(query).all(...params));
});

// GET /api/marks/leaderboard — top performers per subject
router.get('/leaderboard', verifyToken, requireRole('admin', 'faculty'), (req, res) => {
  const { subject, limit = 10 } = req.query;
  let query = `
    SELECT u.name, s.roll_no,
      AVG(m.marks * 100.0 / m.max_marks) as avg_pct,
      SUM(m.marks) as total_marks
    FROM marks m
    JOIN students s ON m.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (subject) { query += ' AND m.subject = ?'; params.push(subject); }
  query += ` GROUP BY m.student_id ORDER BY avg_pct DESC LIMIT ?`;
  params.push(parseInt(limit));
  res.json(db.prepare(query).all(...params));
});

// GET /api/marks/summary — per-subject summary for a student
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
      SUM(marks) as total_marks,
      SUM(max_marks) as total_max,
      ROUND(AVG(marks * 100.0 / max_marks), 1) as avg_pct,
      COUNT(*) as exam_count
    FROM marks WHERE student_id = ?
    GROUP BY subject ORDER BY subject
  `).all(student_id);

  res.json(summary);
});

// POST /api/marks — add/update mark (faculty/admin)
router.post('/', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const { student_id, subject, exam_type, marks, max_marks } = req.body;
  if (!student_id || !subject || !exam_type || marks === undefined || !max_marks) {
    return res.status(400).json({ error: 'student_id, subject, exam_type, marks, max_marks required' });
  }
  if (parseFloat(marks) > parseFloat(max_marks)) {
    return res.status(400).json({ error: 'marks cannot exceed max_marks' });
  }

  const result = db.prepare(`
    INSERT INTO marks (student_id, subject, exam_type, marks, max_marks)
    VALUES (?, ?, ?, ?, ?)
  `).run(parseInt(student_id), subject, exam_type, parseFloat(marks), parseFloat(max_marks));

  res.status(201).json(db.prepare('SELECT * FROM marks WHERE id = ?').get(result.lastInsertRowid));
});

// POST /api/marks/bulk — bulk upload marks
router.post('/bulk', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const { records } = req.body; // [{ student_id, subject, exam_type, marks, max_marks }]
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array required' });
  }

  const insert = db.prepare(`
    INSERT INTO marks (student_id, subject, exam_type, marks, max_marks) VALUES (?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((recs) => {
    for (const r of recs) insert.run(r.student_id, r.subject, r.exam_type, r.marks, r.max_marks);
  });
  insertMany(records);
  res.json({ message: `${records.length} marks records saved` });
});

// PUT /api/marks/:id
router.put('/:id', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const { marks, max_marks, subject, exam_type } = req.body;
  const mark = db.prepare('SELECT * FROM marks WHERE id = ?').get(req.params.id);
  if (!mark) return res.status(404).json({ error: 'Mark record not found' });

  db.prepare(`
    UPDATE marks SET
      marks = COALESCE(?, marks),
      max_marks = COALESCE(?, max_marks),
      subject = COALESCE(?, subject),
      exam_type = COALESCE(?, exam_type)
    WHERE id = ?
  `).run(marks ?? null, max_marks ?? null, subject || null, exam_type || null, req.params.id);

  res.json(db.prepare('SELECT * FROM marks WHERE id = ?').get(req.params.id));
});

// DELETE /api/marks/:id
router.delete('/:id', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const mark = db.prepare('SELECT * FROM marks WHERE id = ?').get(req.params.id);
  if (!mark) return res.status(404).json({ error: 'Mark record not found' });
  db.prepare('DELETE FROM marks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Mark deleted' });
});

module.exports = router;
