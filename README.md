# Read-Aloud-Planner

> *A schedule you hear, not just see.*

**Read Aloud Planner** is an accessible, production-grade daily planner (Progressive Web App & native Android APK) engineered specifically for screen reader users, keyboard-only navigators, and individuals with visual impairments or severe dyslexia.

---

## Key Features

- 🌐 **Seamless Multilingual Support (English & Bahasa Indonesia):** Full dynamic localization across all UI buttons, landmarks, speech synthesis voices, natural language voice parsing, and assistive screen reader announcements.
- 👆 **Two-Tap Blind Assist Mode (TalkBack & VoiceOver Style):**
  - **Single Tap / Click:** Speaks the button's name and purpose aloud without executing it (prevents accidental clicks).
  - **Double Tap / Click:** Executes the selected action.
  - Can be toggled on/off anytime via the top navigation toolbar.
- 🔓 **100% Zero-Login Barrier-Free:** Opens directly into the active schedule without email, password, or account hurdles.
- 🎤 **Natural Voice Schedule Input (Speech-to-Text):** Add tasks simply by speaking naturally in English or Indonesian (e.g. *"Database Lecture tomorrow at 9 AM for 2 hours in room 301"*). Internal NLP extracts task title, date, time, duration, and room automatically (Shortcut: <kbd>V</kbd>).
- 🎙️ **Linear Time Sentences:** Replaces confusing calendar matrices with complete sentences (e.g. *"Monday, 08:00, Database Architecture Lecture, 2 hours, Room 301. Completed."*).
- 🔊 **Web Speech API & Web Audio Earcons:** Client-side sequential speech reading with speed adjustment (0.5x–2.0x), voice selector, and synthetic Web Audio oscillator chimes for instant acoustic feedback.
- 💾 **Offline-First Storage:** Schedules are saved immediately to browser `localStorage` and persist offline without server dependency.
- 🎯 **Focus Mode (One Task Per Screen):** Minimizes cognitive overload for users with dyslexia or ADHD with automatic voice reading and large, accessible controls.
- ⌨️ **100% Keyboard-Only Navigation:**
  - `V` — Start voice input to speak a new task.
  - `S` — Start / Stop sequential linear speech reading.
  - `D` — Toggle task completion status.
  - `N` — Open manual task entry modal.
  - `Esc` — Close modals or exit Focus Mode.
  - `Tab` / `Shift + Tab` — Predictable linear keyboard focus with 3px solid high-contrast focus rings.
- ♿ **WCAG 2.2 Level AA Audited:**
  - Automated `@axe-core/playwright` audits with 0 critical and 0 serious violations.
  - Contrast ratios ≥ 4.5:1 for text and ≥ 3:1 for controls, with instant High Contrast theme.
  - Touch targets ≥ 44×44px.
- 📱 **Multiplatform (Native Android APK & iOS PWA):**
  - Compiled standalone Android APK (`ReadAloudPlanner.apk`, 33 MB).
  - Installable PWA with offline Service Worker caching for iPhone/iOS Safari & Android.
- 🎬 **Animated Video Demo Showcase:** After Effects-style showcase video with Framer Motion animations, kinetic subtitles, and voiceover: [Watch Demo Video](https://taskforge-sooty.vercel.app/ReadAloudPlanner_Demo_Video.mp4).

---

## Technical Architecture

```
[Browser / PWA / Android APK]
         ↕ (HTTPS / JSON / Web Speech API)
[Fastify Server (TypeScript)]
  ├── Security: Helmet, Rate-Limit, Cookie, CORS
  ├── Services: Formatter, Password Security, RFC 5545 iCalendar, Web Audio
  └── Storage: PostgreSQL 16 & LocalStorage Offline Cache
```

- **Frontend:** Semantic HTML5, TypeScript, Fluid CSS3, Web Speech API, Web Audio API, Service Worker.
- **Backend:** Node.js, Fastify v4, TypeScript, PostgreSQL (`pg`).
- **Testing:** Vitest (38 unit & integration tests), Playwright + axe-core (7 E2E accessibility tests).

---

## Local Setup & Development

### Prerequisites
- Node.js ≥ 20
- PostgreSQL (or Podman / Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/ArrafiNurHafiz/Read-Aloud-Planner.git
cd Read-Aloud-Planner

# Install dependencies
npm install

# Run backend development server
npm run dev:backend
```

Open your browser at `http://localhost:3000`.

---

## Running the Automated Test Suite

```bash
# Run unit & integration tests (38 tests)
npm test

# Run E2E & WCAG 2.2 Level AA accessibility tests (7 tests)
npm run test:e2e
```

---

## Direct Downloads & Live Links

- **Live Production (Vercel):** https://taskforge-sooty.vercel.app
- **Interactive Showcase Studio:** https://taskforge-sooty.vercel.app/demo.html
- **Official Demo Video (MP4):** https://taskforge-sooty.vercel.app/ReadAloudPlanner_Demo_Video.mp4
- **Download Native Android APK:** https://taskforge-sooty.vercel.app/ReadAloudPlanner.apk
- **GitHub Release v1.0.0:** https://github.com/ArrafiNurHafiz/Read-Aloud-Planner/releases/tag/v1.0.0

---

## License
MIT License. Built for accessibility independence.
