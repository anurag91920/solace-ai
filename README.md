#  Solace AI – Your Personal AI Wellness Companion

**Solace AI** is an AI-powered mental wellness companion designed to support users in their daily emotional well-being. It provides a calm and supportive environment where users can interact with an AI companion, track their moods, practice breathing exercises, maintain a journal, and monitor their wellness progress.

Solace AI is built with **React Native, Expo, Node.js, Express.js, MongoDB, and Google Gemini AI**.

---

##  Features

###  Authentication
- User Registration and Login
- Secure password hashing
- JWT-based authentication
- Protected API routes

###  Lumi – AI Wellness Companion
- AI-powered supportive conversations
- Empathetic and friendly responses
- Conversation history
- Continue previous conversations
- Start a new conversation
- Context-aware wellness support

###  Mood Tracking
- Daily mood check-ins
- Select your current mood
- Add personal notes
- Save mood entries to the database
- View mood history

###  Wellness Progress
- Track mood history
- Weekly mood insights
- Daily activity tracking
- Streak tracking
- Wellness achievements
- Monthly progress calendar

###  Wellness Activities
- Guided breathing exercise
- Daily positive affirmations
- Personal wellness activities
- Daily reminders and notifications

### Personal Journal
- Write personal thoughts and reflections
- Save journal entries locally
- Revisit your personal notes

###  Mobile Experience
- Built with React Native and Expo
- User-friendly navigation
- Responsive mobile interface
- Clean and calming UI
- Android APK support

---

##  Tech Stack

### Frontend
- React Native
- Expo
- JavaScript
- React Navigation
- AsyncStorage
- Expo Notifications
- Lucide React Native
- Expo Linear Gradient

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt
- Google Gemini AI SDK

### Deployment & Tools
- Git and GitHub
- Render
- Expo EAS Build
- VS Code
- MongoDB Atlas
- Postman

---

##  Project Structure

```text
solace-ai/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Mood.js
│   │   ├── Conversation.js
│   │   └── Progress.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── moodRoutes.js
│   │   ├── chatRoutes.js
│   │   └── progressRoutes.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── mobile/
│   ├── app/
│   │   ├── ChatScreen.js
│   │   └── ProgressScreen.js
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.js
│   ├── app.json
│   ├── eas.json
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run Solace AI on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/anurag91920/solace-ai.git
```

### 2. Open the Project

```bash
cd solace-ai
```

---

## ⚙️ Backend Setup

### Step 1: Navigate to Backend

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file inside the `backend` folder.

Add the required environment variables using the names expected by your backend code:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

**Important:** Never upload your actual `.env` file, database password, JWT secret, or Gemini API key to GitHub.

### Step 4: Start the Backend

```bash
npm run dev
```

Backend will run locally at:

```text
http://localhost:5000
```

---

## 📱 Mobile App Setup

### Step 1: Open a New Terminal

Navigate to the mobile folder from the project root:

```bash
cd mobile
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure API URL

Open:

```text
mobile/services/api.js
```

Set your backend URL:

```javascript
const API_URL = "https://solace-ai-47sj.onrender.com";
```

For local development, use your computer's local network IP address when testing on a physical phone. Do not use `localhost` as the phone's backend address.

### Step 4: Start the Expo App

```bash
npx expo start
```

Scan the QR code using Expo Go if your project configuration and dependencies support it.

---

##  Useful Development Commands

| Command | Purpose |
|---|---|
| `npx expo start` | Run the app in development mode |
| `npx expo start -c` | Clear Expo cache and start the app |
| `npm install` | Install project dependencies |
| `npm run dev` | Start the backend development server |

---

##  Android APK Build – EAS

Solace AI uses Expo Application Services (EAS) to create Android builds.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Navigate to Mobile Folder

```bash
cd mobile
```

### Step 4: Build Android APK (Preview)

```bash
eas build --platform android --profile preview
```

Use this command to generate a preview Android build that can be installed and tested on Android devices. Your `eas.json` preview profile must be configured to produce an APK.

### Step 5: Build Android Production Version

```bash
eas build --platform android --profile production
```

Use this command to create a production build according to your EAS production configuration.

### Development and Build Commands – Quick Reference

| Command | Work |
|---|---|
| `npx expo start` | Development में ऐप चलाना |
| `npx expo start -c` | Cache clear करके ऐप चलाना |
| `eas build --platform android --profile preview` | नई Android APK बनाना |
| `eas build --platform android --profile production` | Production build बनाना |

**Note:** A new build is needed when you want to test updated native or app code in an installed APK. You do not need to generate a new APK every time you start Expo in development mode.

---

## Live Project Links

| Resource | Link |
|---|---|
| GitHub Repository | [Solace AI](https://github.com/anurag91920/solace-ai) |
| Backend API | [Render Backend](https://solace-ai-47sj.onrender.com) |
| Android Build | [Expo EAS Build](https://expo.dev/accounts/anurag919200s-team/projects/mobile/builds/5fd41d67-9dee-48ec-ac7c-aef45a639a06) |
| Demo Video | [Watch Project Demo](https://drive.google.com/file/d/1UCV8GKC4PARfblJKl7DuRAEf0kRelH5F/view?usp=drivesdk) |

---

##  Security

- Passwords are hashed before storing them.
- JWT authentication protects private API endpoints.
- User-specific data is associated with authenticated accounts.
- API credentials and database connection strings should be stored in environment variables.
- Never commit `.env` files or private API keys.

---

##  Important Disclaimer

Solace AI is a wellness support application and is not a replacement for professional mental healthcare, medical advice, diagnosis, or emergency services.

If you are experiencing a mental health emergency, contact local emergency services or a qualified professional.

---

##  Developer

**Anurag Chaurasiya**

B.Tech Computer Science & Engineering | MERN Stack Developer

- GitHub: [@anurag91920](https://github.com/anurag91920)
- LinkedIn: [Anurag Chaurasiya](https://www.linkedin.com/in/anurag-chaurasiya-32a2442a5/)

---

## Support

If you like this project, please give it a  on GitHub!

**Built with to make everyday emotional wellness more accessible.**
