const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// GET /api/assignments — list assignments
router.get('/', verifyToken, (req, res) => {
  const { subject, faculty_id } = req.query;
  let query = `
    SELECT a.*, u.name as faculty_name, f.subject as faculty_subject
    FROM assignments a
    JOIN faculty f ON a.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (subject) { query += ' AND a.subject = ?'; params.push(subject); }
  if (faculty_id) { query += ' AND a.faculty_id = ?'; params.push(faculty_id); }

  // If faculty, only show their own assignments
  if (req.user.role === 'faculty') {
    const fac = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user.id);
    if (fac) { query += ' AND a.faculty_id = ?'; params.push(fac.id); }
  }

  query += ' ORDER BY a.due_date ASC';
  const assignments = db.prepare(query).all(...params);

  // If student, add submission status
  if (req.user.role === 'student') {
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
    if (student) {
      return res.json(assignments.map(a => {
        const sub = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?').get(a.id, student.id);
        return { ...a, submitted: !!sub, submission: sub || null };
      }));
    }
  }

  res.json(assignments);
});

// GET /api/assignments/:id
router.get('/:id', verifyToken, (req, res) => {
  const assignment = db.prepare(`
    SELECT a.*, u.name as faculty_name FROM assignments a
    JOIN faculty f ON a.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const submissions = req.user.role !== 'student'
    ? db.prepare(`
        SELECT sub.*, u.name as student_name, s.roll_no
        FROM submissions sub JOIN students s ON sub.student_id = s.id JOIN users u ON s.user_id = u.id
        WHERE sub.assignment_id = ?
      `).all(req.params.id)
    : [];

  res.json({ ...assignment, submissions });
});

// POST /api/assignments — create assignment (faculty/admin)
router.post('/', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const { title, description, due_date, subject } = req.body;
  if (!title || !due_date || !subject) {
    return res.status(400).json({ error: 'title, due_date, and subject are required' });
  }

  let faculty_id = req.body.faculty_id;
  if (req.user.role === 'faculty') {
    const fac = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user.id);
    if (!fac) return res.status(400).json({ error: 'Faculty profile not found' });
    faculty_id = fac.id;
  }

  if (!faculty_id) return res.status(400).json({ error: 'faculty_id required' });

  const result = db.prepare(`
    INSERT INTO assignments (title, description, due_date, faculty_id, subject)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, description || null, due_date, faculty_id, subject);

  const assignment = db.prepare(`
    SELECT a.*, u.name as faculty_name FROM assignments a
    JOIN faculty f ON a.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(assignment);
});

// PUT /api/assignments/:id
router.put('/:id', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, subject } = req.body;
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  db.prepare(`
    UPDATE assignments SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      due_date = COALESCE(?, due_date),
      subject = COALESCE(?, subject)
    WHERE id = ?
  `).run(title || null, description || null, due_date || null, subject || null, id);

  res.json(db.prepare('SELECT * FROM assignments WHERE id = ?').get(id));
});

// DELETE /api/assignments/:id
router.delete('/:id', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Assignment deleted' });
});

// POST /api/assignments/:id/submit — student submits file
router.post('/:id/submit', verifyToken, requireRole('student'), upload.single('file'), (req, res) => {
  const { id } = req.params;
  const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  const filePath = req.file ? req.file.filename : null;

  try {
    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, file_path)
      VALUES (?, ?, ?)
      ON CONFLICT(assignment_id, student_id) DO UPDATE SET file_path = excluded.file_path, submitted_at = CURRENT_TIMESTAMP
    `).run(id, student.id, filePath);
    res.json({ message: 'Assignment submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/:id/submissions — view all submissions (faculty/admin)
router.get('/:id/submissions', verifyToken, requireRole('faculty', 'admin'), (req, res) => {
  const subs = db.prepare(`
    SELECT sub.*, u.name as student_name, s.roll_no
    FROM submissions sub
    JOIN students s ON sub.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE sub.assignment_id = ?
    ORDER BY sub.submitted_at DESC
  `).all(req.params.id);
  res.json(subs);
});

module.exports = router;
