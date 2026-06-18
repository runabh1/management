# 🎓 SmartCampus — AI College Management System

A full-stack college management system powered by **Gemini 2.0 Flash AI**, built with React + Tailwind CSS frontend and Node.js/Express backend with SQLite.

---

## ✨ Features

| Role | Capabilities |
|---|---|
| **Admin** | Manage students, faculty, notices |
| **Faculty** | Mark attendance, post assignments, enter marks |
| **Student** | View attendance/marks, submit assignments, AI Study Hub |

### 🤖 AI Study Hub (Gemini 2.0 Flash)
- **Study Planner** — Personalized day-by-day exam schedules
- **Notes Summarizer** — Paste text or upload PDF for instant key points
- **Question Generator** — MCQ, short & long answer practice questions
- **Performance Advisor** — AI analysis of marks + attendance with action plan

---

## 🚀 Deploy on Render (Free)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/runabh1/management.git
git push -u origin main
```

### Step 2 — Create Render Web Service
1. Go to [https://render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo: `runabh1/management`
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `smartcampus` |
| **Runtime** | `Node` |
| **Build Command** | `npm run build && cd backend && npm install` |
| **Start Command** | `npm start` |

### Step 3 — Set Environment Variables in Render Dashboard

Go to your service → **Environment** tab and add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | *(any long random string)* |
| `GEMINI_API_KEY` | *(your key from [aistudio.google.com](https://aistudio.google.com/app/apikey))* |

### Step 4 — Deploy!
Click **Manual Deploy → Deploy latest commit**.

Your app will be live at: `https://smartcampus.onrender.com`

---

## 💻 Local Development

### Prerequisites
- **Node.js 22+** (required for built-in `node:sqlite`)
- npm

### Setup
```bash
# Clone
git clone https://github.com/runabh1/management.git
cd management

# Install all dependencies
npm run install:all

# Copy and fill in your env
cp backend/.env.example backend/.env
# Edit backend/.env with your GEMINI_API_KEY
```

### Run
```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@smartcampus.edu | Admin@123 |
| Faculty | faculty@smartcampus.edu | Faculty@123 |
| Student | student@smartcampus.edu | Student@123 |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 18 + Tailwind CSS v3 + Recharts |
| Backend | Node.js + Express |
| Database | Node.js 22 built-in `node:sqlite` (no native compilation) |
| Auth | JWT + bcryptjs |
| AI | Gemini 2.0 Flash (`@google/generative-ai`) |

> **Note on Database:** SQLite data is stored in `backend/smartcampus.db`. On Render's **free tier**, the filesystem resets on each deploy (data is re-seeded automatically). Upgrade to a **paid plan with a persistent disk** to retain data across deploys.

---

## 📁 Project Structure

```
management/
├── backend/
│   ├── server.js          # Express entry point (serves API + React in prod)
│   ├── db.js              # SQLite schema + seed data (node:sqlite)
│   ├── middleware/auth.js # JWT + RBAC
│   └── routes/            # auth, students, faculty, attendance, assignments, marks, notices, ai
├── frontend/
│   ├── src/
│   │   ├── pages/         # admin/, faculty/, student/ dashboards
│   │   ├── components/    # StatCard, Charts, ai/ tools
│   │   └── context/       # AuthContext
│   └── vite.config.js
├── render.yaml            # Render deployment blueprint
└── package.json           # Root scripts
```
