# Traffic Light Debate Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Firebase-ready classroom debate board where teachers manage multiple sessions and students submit color-coded opinions in real time.

**Architecture:** The app uses Vite, React, and TypeScript with a repository interface that selects Firestore/Auth when Firebase environment variables exist and a local demo repository otherwise. Pure utilities handle statistics, session codes, export/import, filtering, and backup transforms so the core behavior is testable without Firebase.

**Tech Stack:** Vite, React, TypeScript, Firebase Auth/Firestore, Firebase Hosting, qrcode.react, jsPDF, html2canvas, Vitest, React Testing Library.

---

### Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/test/setup.ts`

- [ ] Add Vite React TypeScript project files.
- [ ] Add dependency scripts for `dev`, `build`, `test`, and `lint`.
- [ ] Add Firebase environment variable examples.
- [ ] Run `npm install`.
- [ ] Run `npm test -- --run` and confirm the empty baseline is ready after tests are added.

### Task 2: Core Types And Utilities

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/stats.ts`
- Create: `src/lib/sessionCode.ts`
- Create: `src/lib/sessionManagement.ts`
- Create: `src/lib/exportImport.ts`
- Create: `src/lib/backup.ts`
- Test: `src/lib/stats.test.ts`
- Test: `src/lib/sessionCode.test.ts`
- Test: `src/lib/sessionManagement.test.ts`
- Test: `src/lib/exportImport.test.ts`

- [ ] Write tests for stance statistics, code generation, room filtering/sorting, and JSON validation.
- [ ] Implement the minimal utilities until tests pass.

### Task 3: Firebase And Repository Layer

**Files:**
- Create: `src/services/firebase.ts`
- Create: `src/services/debateRepository.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useRealtimeValue.ts`
- Create: `firestore.rules`
- Create: `firebase.json`

- [ ] Add Firebase initialization with demo-mode fallback.
- [ ] Implement auth adapter for Google sign-in and demo teacher sign-in.
- [ ] Implement repository methods for rooms, posts, JSON import/export, backups, restore, and soft deletion.
- [ ] Add Firestore rules for teacher-owned rooms, public room lookup, student post create, and teacher backup access.

### Task 4: Teacher Experience

**Files:**
- Create: `src/components/GaugeBar.tsx`
- Create: `src/components/PostItBoard.tsx`
- Create: `src/components/TeacherDashboard.tsx`
- Create: `src/components/TeacherRoom.tsx`
- Create: `src/lib/pdf.ts`

- [ ] Build teacher dashboard with login, session creation, search, filters, sorting, selection, and session actions.
- [ ] Build teacher room with QR code, real-time gauge, post-it board, PDF/JSON/backup actions, and status changes.
- [ ] Add PDF export through a temporary printable HTML capture.

### Task 5: Student Experience

**Files:**
- Create: `src/components/Home.tsx`
- Create: `src/components/StudentJoin.tsx`
- Create: `src/components/StudentRoom.tsx`

- [ ] Build role landing screen.
- [ ] Build student code/QR join flow.
- [ ] Build opinion form with stance buttons, validation, submission, and current class ratio.

### Task 6: Styling, Accessibility, And Verification

**Files:**
- Create: `src/App.css`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Modify: `README.md`

- [ ] Add responsive classroom-friendly visual design.
- [ ] Add keyboard/focus states, labels, and `aria-live` updates.
- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Start the dev server and verify the main teacher/student workflow in a browser.
