# Malik's Learning Lab

## Overview
Malik's Learning Lab is a comprehensive educational platform designed to empower teachers and engage students. It goes beyond simple quizzes to offer a full suite of learning tools, including an interactive lesson builder, customizable quizzes, and detailed performance tracking. The platform connects educators with students through a simple access code system, suitable for grades 1-11 across Math, English, and ICT subjects.

## Features

### For Teachers
- **Comprehensive Dashboard**: A central hub to manage all educational content across multiple subjects.
- **Unified Lesson Builder**: 
  - **6 Learning Types**: Choose from Scaffolded, Problem Solving, Visual & Interactive, Game-Based, Real-World Application, and Math Talks.
  - **Visual Selection Grid**: Intuitive card-based interface to select your preferred teaching style.
  - **Universal 5-Phase Structure**: Apply the proven Engage-Model-Guided-Independent-Reflect model to **any** learning type you select.
- **Scaffolded Lesson Framework**: 
  - **Engage** (5 min): Hook students and activate prior knowledge
  - **Model** (8 min): Demonstrate and explain new concepts
  - **Guided Practice** (12 min): Practice together with teacher support
  - **Independent Practice** (10 min): Students apply learning independently
  - **Reflect** (5 min): Summarize and check for understanding
- **Rich Content Creation**: 
  - Text content with AI-assisted generation
  - Image uploads directly from your computer
  - Video uploads (up to 50MB) 
  - Document uploads (PowerPoint, Word, PDF up to 20MB)
  - Interactive activities and quizzes
- **Advanced Quiz Management**:
  - Create custom multiple-choice quizzes with image support
  - **AI Content Generator**: Built-in AI assistant to generate lesson content and quiz questions
  - **Live Race Mode**: Real-time competitive quiz mode with synchronized starts and live leaderboards
- **Research-Based Lesson Designer**:
  - **AI Asset Forge**: Generate custom educational images and worksheets on the fly
  - **5-Phase Framework**: Engage (Universal Hook), Learn, Practice Together (4-Carousel Challenge), Try It Yourself, Reflect
  - **Pedagogical Insights**: AI-generated teaching strategies and real-world connections for every lesson
- **Classroom Management**:
  - Support for grades 1-11
  - Multi-subject support (Math, English, ICT)
  - Generate unique 6-digit access codes for lessons and quizzes
  - Team-based activities and game modes
- **Analytics & Tracking**: Monitor student progress with detailed performance reports and leaderboards.

### For Students
- **Simple Access**: Join sessions instantly using a 6-digit code—no account registration required.
- **Interactive Learning**:
  - Engage with multimedia lessons (video, text, diagrams).
  - Take timed quizzes with instant feedback.
- **Gamification**: Earn points, see live scores, and compete on the leaderboard.

## Technology Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL database with real-time capabilities)
- **AI Integration**: Google Gemini API for content generation
- **State Management**: Local React State & Context
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js (v18+) and npm installed
- Supabase account (for database features)
- Google Gemini API key (optional, for AI content generation)

### Installation
1. Clone the repository
```bash
git clone https://github.com/Raheeq-lab/maliks-learning-lab-.git
cd maliks-learning-lab-
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (optional)
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development server
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

## Usage

### Teacher Flow
1. **Sign Up/Login**: Access the Teacher Dashboard.
2. **Select Subject & Grade**: Choose from Math, English, or ICT for grades 1-11.
3. **Create Content**:
   - Go to **Lesson Builder** to create scaffolded 40-minute lessons
   - Upload PowerPoint presentations, Word documents, or PDFs
   - Use the **AI Content Generator** to help create lesson materials
   - Go to **Quiz Zone** to create assessments with the AI assistant
4. **Deploy**: Share the generated **Access Code** with your class.

### Student Flow
1. **Join**: Enter the Access Code on the home page.
2. **Learn**: Engage with interactive lesson materials including videos, images, and documents.
3. **Test**: Complete quizzes and see instant feedback.
4. **Compete**: Check your score on the live leaderboard.

## Future Enhancements
- Mobile app (iOS/Android)
- Real-time collaborative whiteboard
- Advanced analytics dashboard with student insights
- Exportable student reports (PDF/CSV)
- Parent portal for progress tracking
- [x] Dark/Light mode toggle
- [x] Live Race Mode
- [x] Research-Based Design System
- [x] AI Image & Worksheet Generation

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
