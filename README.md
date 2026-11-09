# Solace AI – AI-Powered Wellness Companion

Solace AI is a full-stack wellness companion application designed to support users through mood tracking and AI-powered conversations with Lumi.

## Features

- User Registration and Login
- Mood Tracking
- AI Chat with Lumi
- Chat History saved in MongoDB
- Typing Indicator
- Quick Reply Suggestions
- Mood-Based Chat Context
- Basic Safety Support

## Tech Stack

**Frontend**
- React Native
- JavaScript
- Expo

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

**AI Integration**
- Google Gemini API

## Project Structure

```text
solace-ai/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── mobile/
│   ├── app/
│   ├── services/
│   └── App.js
│
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd solace-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Configure your backend environment variables in a `.env` file.

### 3. Mobile App Setup

Open another terminal:

```bash
cd mobile
npm install
npx expo start
```

## Environment Variables

Configure the required environment variables in the backend `.env` file. Never upload API keys, database credentials, or JWT secrets to GitHub.

## Purpose

Solace AI aims to provide an accessible digital wellness companion through mood tracking and supportive AI conversations.

**Note:** Solace AI is not a substitute for professional mental health care.
