# Malik's Learning Lab

## Overview
Malik's Learning Lab is a comprehensive educational platform designed to empower teachers and engage students. It goes beyond simple quizzes to offer a full suite of learning tools, including an AI-assisted lesson builder, interactive quizzes, and detailed performance tracking. The platform connects educators with students through a simple access code system, suitable for grades 3-10 across various subjects.

## Features

### For Teachers
- **Comprehensive Dashboard**: A central hub to manage all educational content.
- **AI-Powered Lesson Builder**: 
  - Create rich, interactive lessons with text, videos, and images.
  - **AI Content Generation**: Seamlessly generate educational text content for your lessons using integrated AI tools.
- **Advanced Quiz Management**:
  - Create custom multiple-choice quizzes.
  - **AI Prompt Generator**: Generates structured prompts that you can copy to use with external AI tools (like ChatGPT). It creates the *prompt* for you, rather than generating the questions directly.
- **Classroom Management**:
  - Assign content to specific grade levels.
  - Generate unique 6-digit access codes for lessons and quizzes.
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
- **State Management**: Local React State & Context
- **Deployment**: Vercel (recommended) / Static Hosting

## Getting Started

### Prerequisites
- Node.js (v18+) and npm installed

### Installation
1. Clone the repository
```bash
git clone https://github.com/Raheeq-lab/Maliks-learning-lab.git
cd Maliks-learning-lab
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080` (or the port shown in your terminal)

## Usage

### Teacher Flow
1. **Sign Up/Login**: Access the Teacher Dashboard.
2. **Create Content**:
   - Go to **Lessons** to build a new topic using the AI Writer.
   - Go to **Quizzes** to create assessments. Use the Prompt Generator tab to help craft questions.
3. **Deploy**: Share the generated **Access Code** with your class.

### Student Flow
1. **Join**: Enter the Access Code on the home page.
2. **Learn**: Read through the interactive lesson materials.
3. **Test**: Complete the associated quiz and check the leaderboard.

## Future Enhancements
- Backend integration (Supabase/Firebase) for persistent user accounts.
- Real-time multiplayer quiz modes.
- Exportable student reports (PDF/CSV).
- Dark/Light mode toggle.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
