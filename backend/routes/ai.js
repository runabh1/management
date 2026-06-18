const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Always uses GEMINI_API_KEY from .env — client cannot override this
async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    if (err.message && err.message.includes('429')) {
      throw new Error('RATE_LIMIT: Gemini API quota exceeded. Please wait a minute and try again, or replace GEMINI_API_KEY in backend/.env with a fresh key from https://aistudio.google.com/app/apikey');
    }
    throw err;
  }
}


// POST /api/ai/study-planner
router.post('/study-planner', verifyToken, async (req, res) => {
  const { subjects, examDate, hoursPerDay, currentLevel } = req.body;
  if (!subjects || !examDate) {
    return res.status(400).json({ error: 'subjects and examDate are required' });
  }

  const daysLeft = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));

  const prompt = `You are an expert academic study planner. Create a detailed day-by-day study schedule.

Student Details:
- Subjects: ${Array.isArray(subjects) ? subjects.join(', ') : subjects}
- Exam Date: ${examDate} (${daysLeft} days from now)
- Available Hours/Day: ${hoursPerDay || 4}
- Current Level: ${currentLevel || 'intermediate'}

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "overview": "Brief 2-sentence overview of the study plan",
  "totalDays": ${daysLeft},
  "hoursPerDay": ${hoursPerDay || 4},
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "Focus area for this week",
      "days": [
        {
          "day": "Day 1",
          "date": "YYYY-MM-DD",
          "topics": ["Topic 1", "Topic 2"],
          "tasks": ["Task description"],
          "hours": 4,
          "priority": "high"
        }
      ]
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "resources": ["Resource 1", "Resource 2"]
}`;

  try {
    const text = await callGemini(prompt);
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const plan = JSON.parse(clean);
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Study planner error:', err.message);
    if (err.message.startsWith('RATE_LIMIT')) {
      return res.status(429).json({ error: '⏳ Gemini API quota exceeded. Please wait a minute and try again, or get a fresh API key from https://aistudio.google.com/app/apikey and update backend/.env' });
    }
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Set GEMINI_API_KEY in backend/.env' });
    }
    res.status(500).json({ error: 'Failed to generate study plan. ' + err.message });
  }
});

// POST /api/ai/summarize — summarize text/notes
router.post('/summarize', verifyToken, upload.single('pdf'), async (req, res) => {
  const { text, topic } = req.body;
  let content = text;

  // Extract text from PDF if uploaded
  if (req.file) {
    try {
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(pdfBuffer);
      content = pdfData.text;
      // Cleanup uploaded file
      fs.unlinkSync(req.file.path);
    } catch (err) {
      return res.status(400).json({ error: 'Failed to parse PDF: ' + err.message });
    }
  }

  if (!content || content.trim().length < 10) {
    return res.status(400).json({ error: 'Text content is required (min 10 characters)' });
  }

  const truncated = content.substring(0, 8000); // Limit to avoid token overflow

  const prompt = `You are an expert academic assistant. Summarize the following ${topic ? `${topic} ` : ''}notes for a college student.

Notes:
${truncated}

Return ONLY valid JSON (no markdown):
{
  "title": "Topic title",
  "summary": "2-3 paragraph comprehensive summary",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "importantTerms": [{"term": "Term", "definition": "Definition"}],
  "examTips": ["What to focus on for exams"],
  "difficulty": "easy|medium|hard"
}`;

  try {
    const responseText = await callGemini(prompt);
    const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const summary = JSON.parse(clean);
    res.json({ success: true, summary });
  } catch (err) {
    if (err.message.startsWith('RATE_LIMIT')) {
      return res.status(429).json({ error: '⏳ Gemini API quota exceeded. Please wait a minute and try again, or get a fresh API key from https://aistudio.google.com/app/apikey and update backend/.env' });
    }
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Set GEMINI_API_KEY in backend/.env' });
    }
    res.status(500).json({ error: 'Failed to summarize notes. ' + err.message });
  }
});

// POST /api/ai/generate-questions
router.post('/generate-questions', verifyToken, async (req, res) => {
  const { topic, text, difficulty = 'medium', questionTypes = ['mcq', 'short', 'long'], count = 10 } = req.body;
  if (!topic && !text) return res.status(400).json({ error: 'topic or text is required' });

  const prompt = `You are an expert exam question generator for college students.

Topic/Content: ${topic || ''}
${text ? `Additional Content: ${text.substring(0, 3000)}` : ''}
Difficulty: ${difficulty}
Question Types: ${questionTypes.join(', ')}
Total Questions: ${count}

Return ONLY valid JSON (no markdown):
{
  "topic": "Topic name",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "A) Option 1",
      "explanation": "Why this is the answer"
    },
    {
      "id": 2,
      "type": "short",
      "question": "Short answer question?",
      "answer": "Expected answer (2-3 sentences)",
      "marks": 5
    },
    {
      "id": 3,
      "type": "long",
      "question": "Long answer / essay question?",
      "answer": "Expected detailed answer",
      "marks": 15,
      "hints": ["Hint 1", "Hint 2"]
    }
  ]
}`;

  try {
    const responseText = await callGemini(prompt);
    const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.message.startsWith('RATE_LIMIT')) {
      return res.status(429).json({ error: '⏳ Gemini API quota exceeded. Please wait a minute and try again, or get a fresh API key from https://aistudio.google.com/app/apikey and update backend/.env' });
    }
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Set GEMINI_API_KEY in backend/.env' });
    }
    res.status(500).json({ error: 'Failed to generate questions. ' + err.message });
  }
});

// POST /api/ai/performance-advisor
router.post('/performance-advisor', verifyToken, async (req, res) => {
  const { marksData, attendanceData, studentName } = req.body;
  if (!marksData || !attendanceData) {
    return res.status(400).json({ error: 'marksData and attendanceData are required' });
  }

  const prompt = `You are an expert academic performance advisor for a college student.

Student: ${studentName || 'Student'}

Marks Data (subject, exam_type, marks, max_marks):
${JSON.stringify(marksData, null, 2)}

Attendance Data (subject, present, total, percentage):
${JSON.stringify(attendanceData, null, 2)}

Analyze the performance comprehensively and return ONLY valid JSON (no markdown):
{
  "overallGrade": "A/B/C/D/F",
  "overallPercentage": 85.5,
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "atRiskSubjects": ["Subject if below 40%"],
  "attendanceAlert": true or false,
  "recommendations": [
    {
      "category": "Academics/Attendance/Study Habits",
      "priority": "high/medium/low",
      "action": "Specific actionable recommendation",
      "timeframe": "This week / This month"
    }
  ],
  "subjectInsights": [
    {
      "subject": "Subject Name",
      "status": "excellent/good/average/poor",
      "insight": "Specific insight about this subject",
      "suggestion": "What to do to improve"
    }
  ],
  "motivationalMessage": "An encouraging personalized message"
}`;

  try {
    const responseText = await callGemini(prompt);
    const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(clean);
    res.json({ success: true, analysis });
  } catch (err) {
    if (err.message.startsWith('RATE_LIMIT')) {
      return res.status(429).json({ error: '⏳ Gemini API quota exceeded. Please wait a minute and try again, or get a fresh API key from https://aistudio.google.com/app/apikey and update backend/.env' });
    }
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Set GEMINI_API_KEY in backend/.env' });
    }
    res.status(500).json({ error: 'Failed to analyze performance. ' + err.message });
  }
});

module.exports = router;
