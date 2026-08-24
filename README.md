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

The current version is an API-driven Release 1 application for Students, Teachers, Content Managers and LMS Administrators. Authentication, course management, learning progress, enrollments and calendar data are persisted by the SU LMS Django REST API.

## Current Features

- Cookie-based authentication and role-aware routing
- Student dashboard, course catalogue, lessons and progress
- Prerequisite-based lesson availability
- Teacher course builder with files and SCORM packages
- Content review, return and resubmission lifecycle
- Course templates and course copying
- LMS Admin publishing, enrollment, users and calendar
- Backend-driven filters and organization references
- Responsive desktop and mobile layouts

## Release 1 Scope

The first production release includes:

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
├── api/                # Typed API clients
├── auth/               # Session, permissions and route guards
├── components/         # Shared UI and layouts
├── pages/              # Student and staff application pages
├── types/              # API and domain contracts
├── App.jsx             # Role-aware route graph
└── main.jsx            # Application entry point
```

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
| `npm run typecheck` | Validate TypeScript contracts |
| `npm run lint` | Run ESLint with zero warnings |
| `npm test` | Run unit and integration tests |
| `npm run test:e2e:release1` | Run the Release 1 real-backend browser suite |
| `npm run verify` | Run typecheck, lint, unit tests and production build |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Deploy a preview to Vercel |
| `npm run deploy:prod` | Deploy to Vercel production |

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=SU LMS
VITE_ENABLE_PASSWORD_RECOVERY=false
```

Do not commit real credentials, access tokens or production secrets.

## Backend Integration

The frontend communicates with the Django REST backend:

- Repository: [adilhanDevs/su-lms-backend](https://github.com/adilhanDevs/su-lms-backend)
- API prefix: `/api/v1/`
- Authentication: secure cookie-based sessions with single-flight refresh handling
- Data source: PostgreSQL-backed API; no runtime mock or local learning-data fallback

## Development Workflow

1. Create a branch from `develop`.
2. Use a descriptive branch name such as `feature/course-builder` or `fix/mobile-navigation`.
3. Keep commits focused and use clear messages.
4. Run `npm run verify` and the relevant Playwright suite before opening a pull request.
5. Open a pull request with screenshots for visual changes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full contribution guidelines.

## Project Status

**Release 1 stabilization**

The application is ready for review against the integrated backend. Production deployment still requires environment-specific HTTPS, secrets, storage and email configuration.

## Security

Please do not report security vulnerabilities through public GitHub issues. Follow the process described in [SECURITY.md](SECURITY.md).

## Maintainer

Developed and maintained by [@ibrodevs](https://github.com/ibrodevs) with the SU LMS development team.

---

<div align="center">
  <strong>SU LMS — Digital learning infrastructure for Salymbekov University</strong>
</div>
