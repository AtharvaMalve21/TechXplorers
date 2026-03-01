# 🧠 CollabAI: Collaborative Intelligence Learning Platform

The **Collective Intelligence Learning Platform** is an AI-powered collaborative learning environment where learners solve complex problems together with peers and AI agents. 

Unlike traditional AI tutoring systems that simply provide direct answers, this platform redefines AI’s role as a **facilitator of reasoning**, not a solution provider.

We shift the focus from:
❌ Individual answer correctness  
➡️  
✅ Collective intelligence building and reasoning quality  

---

## 🎯 Problem Statement & Core Innovation

Modern EdTech platforms often prioritize exact correctness over critical thinking, with AI systems providing instant solutions that reduce deep reasoning and collaborative learning.

**CollabAI introduces:**
- 🤖 **AI as a Socratic Facilitator**: Guides discussions, detects logic gaps, ensures balanced participation, and *never* gives final answers.
- 🧩 **Structured Workflows**: Forces students through the scientific method (Hypothesis → Discussion → Challenge → Consensus → Reflection).
- 📊 **Explainable Reasoning Scoring**: Evaluates individual messages for Logical Depth, Relevance, and Constructiveness using OpenAI.
- 📈 **Collaboration Analytics**: Measures Room Collaboration Health and Participation Balance to prevent alpha-student dominance.

---

## 🏗 System Architecture & Tech Stack

This platform is built on modern web technologies ensuring high performance, security, and real-time responsiveness.

### Backend (Current Implementation)
- **Node.js & Express**: Core REST API logic and middleware management.
- **MongoDB & Mongoose**: Database for storing Users, Rooms, Messages, and Analytics data.
- **Socket.io**: Real-time bidirectional event-based communication for discussion rooms and stage updates.
- **JWT & HTTP-Only Cookies**: Secure, XSS-resistant user authentication and session tracking (applied to both REST and WebSockets).
- **OpenAI API (GPT-4o-mini)**: Powers the Socratic Moderation, Reasoning Evaluation, and Stage Reflection services.

### Frontend (Upcoming)
- **React / Next.js**: Client interface.
- **Tailwind CSS**: Modern UI styling.
- **Socket.io-client**: Connecting to real-time discussion rooms.

---

## 🚀 Key Backend Features

1. **Robust Authentication**: 
   - Registration, Login, and secure session management via strict HTTP-only cookies.
   - WebSocket handshakes validated via cookie parsing to prevent unauthorized room access.
2. **Real-time Event Broadcasting**:
   - Live message sending, receiving, and automatic database persistence.
   - Broadcaster for stage changes (moving the room from *Hypothesis* to *Consensus*).
3. **AI Moderation Engine (`aiModerationService`)**:
   - Triggers every 3 messages. Evaluates recent context, checks for dominant participants, and asks probing questions.
   - Hardcoded guardrails prevent the AI from leaking answers.
4. **Asynchronous Scoring (`reasoningScoringService`)**:
   - Evaluates every student message behind the scenes.
   - Returns strict JSON evaluating Logical Depth, Relevance, and Constructiveness out of 5. Updates user lifetime contribution scores and emits real-time WebSocket score updates.
5. **Session Analytics (`analyticsService`)**:
   - Automatically tracks participation balance and stage engagement to generate a final `collaborationHealthScore`.
6. **Dominance Detection (`dominanceService`)**:
   - Flags if a single user is dominating the room chat (>60% of messages) and prompts the AI to pull other students into the discussion.

---

## 🛠 Hackathon MVP Progress
- [x] Database Schema Design (Users, Rooms, Messages, RoomAnalytics)
- [x] Secure JWT Cookie Auth
- [x] Room & Message REST APIs
- [x] Real-time Socket.io Integration
- [x] OpenAI Integration (Moderation & Scoring)
- [x] Dominance and Analytics Tracking
- [ ] Frontend Client Integration
- [ ] UI/UX Design

---

## 🌍 Vision
To transform education from answer-centric systems into **reasoning-centric** collaborative intelligence platforms.

---

## 🤝 Contributing
This project is under active hackathon development by **Team TechXplorers**.  
Feedback, PRs, and contributions are heavily welcomed.

## ⭐ Support
If you believe AI should enhance human reasoning — not replace it — consider starring this repository!