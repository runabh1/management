// Uses Node.js 22.5+ built-in SQLite (no native compilation needed!)
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'smartcampus.db'));

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','faculty','student')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_no TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    semester INTEGER NOT NULL,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    subject TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('present','absent','late')),
    marked_by INTEGER REFERENCES faculty(id),
    UNIQUE(student_id, subject, date)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_path TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'midterm',
    marks REAL NOT NULL,
    max_marks REAL NOT NULL DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Helper: prepare statement ─────────────────────────────────────────────────
// Node:sqlite uses db.prepare() same as better-sqlite3 — synchronous API
const prepare = (sql) => db.prepare(sql);

// ─── Seed Data ─────────────────────────────────────────────────────────────────
function seedData() {
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@smartcampus.edu');
  if (adminExists) return;

  console.log('🌱 Seeding database with demo data...');

  const insertUser      = db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`);
  const insertStudent   = db.prepare(`INSERT INTO students (user_id, roll_no, department, semester, phone) VALUES (?, ?, ?, ?, ?)`);
  const insertFaculty   = db.prepare(`INSERT INTO faculty (user_id, department, subject) VALUES (?, ?, ?)`);
  const insertAttendance = db.prepare(`INSERT OR IGNORE INTO attendance (student_id, subject, date, status, marked_by) VALUES (?, ?, ?, ?, ?)`);
  const insertMarks     = db.prepare(`INSERT INTO marks (student_id, subject, exam_type, marks, max_marks) VALUES (?, ?, ?, ?, ?)`);
  const insertNotice    = db.prepare(`INSERT INTO notices (title, content, author_id, priority) VALUES (?, ?, ?, ?)`);
  const insertAssignment = db.prepare(`INSERT INTO assignments (title, description, due_date, faculty_id, subject) VALUES (?, ?, ?, ?, ?)`);
  const insertSubmission = db.prepare(`INSERT OR IGNORE INTO submissions (assignment_id, student_id) VALUES (?, ?)`);

  const adminHash   = bcrypt.hashSync('Admin@123', 10);
  const facultyHash = bcrypt.hashSync('Faculty@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  // Users
  const adminRes = insertUser.run('Admin User', 'admin@smartcampus.edu', adminHash, 'admin');
  const f1Res    = insertUser.run('Dr. Priya Sharma', 'faculty@smartcampus.edu', facultyHash, 'faculty');
  const f2Res    = insertUser.run('Prof. Amit Verma', 'amit@smartcampus.edu', facultyHash, 'faculty');
  const f3Res    = insertUser.run('Dr. Sunita Rao', 'sunita@smartcampus.edu', facultyHash, 'faculty');
  const s1Res    = insertUser.run('Rahul Kumar', 'student@smartcampus.edu', studentHash, 'student');
  const s2Res    = insertUser.run('Priya Singh', 'priya@smartcampus.edu', studentHash, 'student');
  const s3Res    = insertUser.run('Arjun Patel', 'arjun@smartcampus.edu', studentHash, 'student');
  const s4Res    = insertUser.run('Neha Gupta', 'neha@smartcampus.edu', studentHash, 'student');
  const s5Res    = insertUser.run('Rohit Sharma', 'rohit@smartcampus.edu', studentHash, 'student');

  // Faculty records
  const fac1 = insertFaculty.run(f1Res.lastInsertRowid, 'Computer Science', 'Data Structures');
  const fac2 = insertFaculty.run(f2Res.lastInsertRowid, 'Computer Science', 'Database Management');
  const fac3 = insertFaculty.run(f3Res.lastInsertRowid, 'Mathematics', 'Linear Algebra');

  // Student records
  const stu1 = insertStudent.run(s1Res.lastInsertRowid, 'CS2021001', 'Computer Science', 5, '9876543210');
  const stu2 = insertStudent.run(s2Res.lastInsertRowid, 'CS2021002', 'Computer Science', 5, '9876543211');
  const stu3 = insertStudent.run(s3Res.lastInsertRowid, 'CS2021003', 'Computer Science', 5, '9876543212');
  const stu4 = insertStudent.run(s4Res.lastInsertRowid, 'CS2021004', 'Computer Science', 5, '9876543213');
  const stu5 = insertStudent.run(s5Res.lastInsertRowid, 'CS2021005', 'Computer Science', 5, '9876543214');

  const studentIds = [stu1, stu2, stu3, stu4, stu5].map(r => r.lastInsertRowid);
  const subjects   = ['Data Structures', 'Database Management', 'Linear Algebra', 'Operating Systems'];
  const statusPool = ['present','present','present','present','present','absent','late'];

  // Attendance for last 45 weekdays
  for (let daysAgo = 45; daysAgo >= 0; daysAgo--) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = d.toISOString().split('T')[0];
    for (const subj of subjects) {
      for (const sid of studentIds) {
        const status = statusPool[Math.floor(Math.random() * statusPool.length)];
        insertAttendance.run(sid, subj, dateStr, status, fac1.lastInsertRowid);
      }
    }
  }

  // Marks
  const examTypes = ['quiz', 'midterm', 'final'];
  for (const sid of studentIds) {
    for (const subj of subjects) {
      for (const exam of examTypes) {
        const base  = exam === 'quiz' ? 8 : exam === 'midterm' ? 55 : 60;
        const range = exam === 'quiz' ? 2 : 15;
        const maxM  = exam === 'quiz' ? 10 : 100;
        const m     = base + Math.floor(Math.random() * range);
        insertMarks.run(sid, subj, exam, m, maxM);
      }
    }
  }

  // Notices
  insertNotice.run('Welcome to SmartCampus!', 'Welcome to SmartCampus — your AI-powered college management system.', adminRes.lastInsertRowid, 'high');
  insertNotice.run('Mid-Semester Examinations', 'Mid-semester exams scheduled from next week. Check your timetable.', adminRes.lastInsertRowid, 'urgent');
  insertNotice.run('New Assignment: Data Structures', 'Dr. Priya has posted a BST assignment. Deadline: next Friday.', f1Res.lastInsertRowid, 'normal');
  insertNotice.run('Library Hours Extended', 'Library open until 9 PM on weekdays during exams.', adminRes.lastInsertRowid, 'low');
  insertNotice.run('AI Tools Now Available', 'Gemini-powered AI tools: Study Planner, Notes Summarizer, Question Generator, Performance Advisor.', adminRes.lastInsertRowid, 'high');

  // Assignments
  const t1 = new Date(); t1.setDate(t1.getDate() + 7);
  const t2 = new Date(); t2.setDate(t2.getDate() + 14);
  const t3 = new Date(); t3.setDate(t3.getDate() + 10);

  const a1 = insertAssignment.run('Binary Search Tree Implementation', 'Implement a complete BST with insert, delete, search, and traversal.', t1.toISOString().split('T')[0], fac1.lastInsertRowid, 'Data Structures');
  const a2 = insertAssignment.run('SQL Queries Practice Set', 'Write 20 complex SQL queries including joins, subqueries, and window functions.', t2.toISOString().split('T')[0], fac2.lastInsertRowid, 'Database Management');
  const a3 = insertAssignment.run('Matrix Transformations', 'Solve 15 problems on eigenvalues and eigenvectors.', t3.toISOString().split('T')[0], fac3.lastInsertRowid, 'Linear Algebra');

  insertSubmission.run(a1.lastInsertRowid, studentIds[0]);
  insertSubmission.run(a1.lastInsertRowid, studentIds[1]);
  insertSubmission.run(a2.lastInsertRowid, studentIds[2]);

  console.log('✅ Database seeded successfully!');
  console.log('   Admin:   admin@smartcampus.edu / Admin@123');
  console.log('   Faculty: faculty@smartcampus.edu / Faculty@123');
  console.log('   Student: student@smartcampus.edu / Student@123\n');
}

seedData();

module.exports = db;
