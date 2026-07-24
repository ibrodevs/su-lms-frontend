<div align="center">

# SU LMS Frontend

**Modern Learning Management System frontend for Salymbekov University**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://bilim-ordo.vercel.app/)
[![Status](https://img.shields.io/badge/status-active%20development-orange)](#project-status)

[Live Demo](https://bilim-ordo.vercel.app/) · [Backend Repository](https://github.com/adilhanDevs/su-lms-backend) · [Report an Issue](https://github.com/ibrodevs/su-lms-frontend/issues)

</div>

---

## Overview

SU LMS is the frontend application for Salymbekov University's Learning Management System. The platform is being developed as part of the university's Digital Campus initiative and will provide dedicated experiences for students, teachers and administrators.

The current version contains an interactive student-facing prototype with subjects, lessons, learning materials, quizzes and local progress tracking. The project is being expanded into a production-ready API-driven application for Release 1.

## Current Features

- Student ID demo authentication
- Student dashboard and subject catalogue
- Course and lesson navigation
- YouTube video lessons and lesson notes
- PDF and learning material viewer
- Lesson-based quizzes and result review
- Progress persistence through `localStorage`
- Responsive mobile presentation interface
- Static Vercel deployment with hash routing

## Release 1 Scope

The first production release will include:

- Real authentication and session management
- Role-based access for Student, Teacher and Administrator
- User and enrolment management
- Course catalogue and lifecycle management
- Course builder with modules, topics and lessons
- Learning material upload and viewing
- Student progress tracking
- Calendar module
- Teacher portal
- Admin console MVP
- Integration with the SU LMS Django REST API

## Technology Stack

| Area | Technology |
|---|---|
| UI | React 19 |
| Build tool | Vite 7 |
| Routing | React Router |
| Markdown | React Markdown |
| Icons | Lucide React |
| Styling | CSS |
| Deployment | Vercel |
| Backend | Django REST Framework |

## Project Structure

```text
src/
├── data/               # Temporary static demo data
├── pages/              # Student-facing application pages
├── App.jsx             # Main routing and application shell
├── main.jsx            # Application entry point
└── styles.css           # Global styles and responsive UI
```

> The current structure reflects the prototype stage. It will be gradually reorganized into feature-based modules as backend integration begins.

## Getting Started

### Requirements

- Node.js 20 or newer
- npm 10 or newer

### Installation

```bash
git clone https://github.com/ibrodevs/su-lms-frontend.git
cd su-lms-frontend
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

The application will be available at the URL shown by Vite, usually `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Deploy a preview to Vercel |
| `npm run deploy:prod` | Deploy to Vercel production |

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=SU LMS
```

Do not commit real credentials, access tokens or production secrets.

## Backend Integration

The frontend will communicate with the Django REST backend:

- Repository: [adilhanDevs/su-lms-backend](https://github.com/adilhanDevs/su-lms-backend)
- Planned API prefix: `/api/v1/`
- Authentication: JWT / secure cookie-based sessions

During the prototype phase, learning data is stored locally in `src/data/mockData.js`. This data will be replaced by API services as each module is integrated.

## Development Workflow

1. Create a branch from `main`.
2. Use a descriptive branch name such as `feature/course-builder` or `fix/mobile-navigation`.
3. Keep commits focused and use clear messages.
4. Run `npm run build` before opening a pull request.
5. Open a pull request with screenshots for visual changes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full contribution guidelines.

## Project Status

**Active development — Release 1**

Target: complete the Core LMS frontend and backend integration by **20 August 2026**.

The public deployment currently represents a frontend prototype and does not yet contain production authentication or live university data.

## Security

Please do not report security vulnerabilities through public GitHub issues. Follow the process described in [SECURITY.md](SECURITY.md).

## Maintainer

Developed and maintained by [@ibrodevs](https://github.com/ibrodevs) with the SU LMS development team.

---

<div align="center">
  <strong>SU LMS — Digital learning infrastructure for Salymbekov University</strong>
</div>
