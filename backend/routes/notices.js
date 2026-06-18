const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/notices — list all notices
router.get('/', verifyToken, (req, res) => {
  const { priority, limit = 50 } = req.query;
  let query = `
    SELECT n.*, u.name as author_name, u.role as author_role
    FROM notices n JOIN users u ON n.author_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (priority) { query += ' AND n.priority = ?'; params.push(priority); }
  query += ` ORDER BY
    CASE n.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
    n.created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  res.json(db.prepare(query).all(...params));
});

// GET /api/notices/:id
router.get('/:id', verifyToken, (req, res) => {
  const notice = db.prepare(`
    SELECT n.*, u.name as author_name FROM notices n JOIN users u ON n.author_id = u.id WHERE n.id = ?
  `).get(req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found' });
  res.json(notice);
});

// POST /api/notices — create notice (admin/faculty)
router.post('/', verifyToken, requireRole('admin', 'faculty'), (req, res) => {
  const { title, content, priority = 'normal' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

  const result = db.prepare(`
    INSERT INTO notices (title, content, author_id, priority) VALUES (?, ?, ?, ?)
  `).run(title, content, req.user.id, priority);

  const notice = db.prepare(`
    SELECT n.*, u.name as author_name FROM notices n JOIN users u ON n.author_id = u.id WHERE n.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(notice);
});

// PUT /api/notices/:id
router.put('/:id', verifyToken, requireRole('admin', 'faculty'), (req, res) => {
  const { title, content, priority } = req.body;
  const notice = db.prepare('SELECT * FROM notices WHERE id = ?').get(req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found' });

  // Faculty can only edit their own notices
  if (req.user.role === 'faculty' && notice.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Cannot edit another user\'s notice' });
  }

  db.prepare(`
    UPDATE notices SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      priority = COALESCE(?, priority)
    WHERE id = ?
  `).run(title || null, content || null, priority || null, req.params.id);

  res.json(db.prepare('SELECT n.*, u.name as author_name FROM notices n JOIN users u ON n.author_id = u.id WHERE n.id = ?').get(req.params.id));
});

// DELETE /api/notices/:id (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const notice = db.prepare('SELECT * FROM notices WHERE id = ?').get(req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found' });
  db.prepare('DELETE FROM notices WHERE id = ?').run(req.params.id);
  res.json({ message: 'Notice deleted' });
});

module.exports = router;
