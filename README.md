# TeamSync - Professional Team Task Manager

A production-ready full-stack application built for collaborative task management and executive project monitoring.

## 🧠 Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion
- **Backend**: Express.js (Node.js)
- **Database**: Firebase Firestore (Enterprise NoSQL)
- **Authentication**: Firebase Auth (JWT/OAuth)
- **Deployment**: Optimized for Railway or Cloud Run

## 🔐 Authentication & Roles
- **Identity**: Google or Email registration.
- **RBAC**: 
  - **Owner/Admin**: Full constitutional control over projects, members, and all objectives.
  - **Member**: Access to project details and status updates for assigned tasks.

## 🚀 Setup Guide

### 1. Project Initialization
- Clone the repository.
- Ensure Node.js 18+ is installed.
- Run `npm install`.

### 2. Firebase Configuration
- Create a project at [Firebase Console](https://console.firebase.google.com/).
- Enable **Authentication** (Google & Email).
- Enable **Cloud Firestore** in Enterprise mode.
- Update `firebase-applet-config.json` with your credentials.
- Deploy `firestore.rules` for security.

### 3. Environment Variables
Create a `.env` file based on `.env.example`:
```env
# Google Gemini API (if used)
GEMINI_API_KEY=your_key_here

# Firebase Config (Optional overrides)
# VITE_FIREBASE_API_KEY=...
```

### 4. Local Execution
```bash
npm run dev
```

## 🌐 Deployment (Railway)
1. Link your GitHub repository to [Railway.app](https://railway.app/).
2. Set the build command to `npm run build`.
3. Set the start command to `node server.ts` (Railway handles typescript via ts-node or native node if pre-compiled).
4. Add all environment variables to the Railway dashboard.

## 📊 Dashboard Metrics
- **Executive Overview**: High-level status of all active projects.
- **Priority Pipeline**: Immediate focus on 'High' priority tasks.
- **Workload Distribution**: Visualizing tasks per team member.
- **System Intelligence**: Dynamic workspace tips powered by TeamSync API.
