# SU LMS Release 1 — Frontend Integration QA

Date: 2026-08-19  
Frontend branch: `feature/SULMS-release1-frontend-integration`  
Backend repository: `adilhanDevs/su-lms-backend`  
Backend branch: `develop` plus `fix/SULMS-media-volume-permissions`
API base: `/api/v1/`

## Environment

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8001`
- `GET /api/v1/health/`: `200`, service and database are healthy
- Swagger: `GET /api/docs/` → `200`
- OpenAPI: `GET /api/schema/` → `200`
- Release 1 demo data is available for Student, Teacher, Content Manager and LMS Admin.

## Automated verification

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — 78 tests passed
- `npm run test:e2e` — 10 Playwright scenarios passed
- `npm run build` — passed

Playwright coverage:

- Student, Teacher, Content Manager and LMS Admin login through real cookie authentication.
- `/auth/me/` role redirect and session persistence after browser refresh.
- Student Dashboard, Courses, Course Detail and Calendar using backend data.
- Staff Dashboard and Courses using backend-scoped data.
- Staff Calendar Create → refresh → PATCH → DELETE against PostgreSQL-backed API.
- Teacher Course Create → refresh → Edit using backend organization references and PostgreSQL persistence.
- Full Teacher Create → structure → PDF material → review → revision → resubmit → Admin publish → enrollment → Student lesson completion lifecycle.
- Lifecycle test removes its course, uploaded files, enrollment and progress records after every run.
- Release 2/3 navigation is absent from the Student runtime.
- No requests to mock JSON/modules during tested flows.
- No unexpected API errors, browser console errors or React runtime errors.
- Desktop Chromium and Pixel 5 viewport checks, including horizontal overflow assertions.

## Runtime data audit

- Staff Dashboard no longer imports `mockUsers`, `useMockLoading`, legacy sessions or `courseService`.
- Student search and profile use backend data.
- Course, structure, materials, templates, enrollments, users, progress and calendar runtime paths use `/api/v1/`.
- `localStorage` is limited to the collapsed sidebar UI preference.
- Assignments, Tests, Schedule and Notifications remain outside the Release 1 route graph.

## Screenshots

Current backend-connected screenshots are stored in `docs/screenshots/release1-e2e/`:

- Student Dashboard, Courses, Course Detail and Calendar
- Teacher Dashboard and Courses
- Course Builder and Readiness
- Content Manager review list
- LMS Admin Users and Enrollments
- Staff Calendar

## Backend integration fix

### Organization reference API — resolved

- Backend commit: `241bf86 feat: add organization reference api`
- `GET /api/v1/organization/faculties/` — active faculties
- `GET /api/v1/organization/departments/?faculty={id}` — active filtered departments
- `GET /api/v1/organization/programs/?department={id}` — active filtered programs
- `GET /api/v1/organization/semesters/` — active semesters with dates
- Anonymous access returns `401`; all endpoints are read-only.
- OpenAPI schema includes all four endpoints and filters.

Course Create/Edit now loads canonical organization values, submits multipart `POST`/`PATCH` requests, maps backend field errors and uploads real cover/syllabus files. Teacher-created courses are assigned to the current teacher by backend policy; LMS Admin can select an active teacher.

Verified E2E coverage:

- Teacher Create Course and Edit Course
- Browser refresh persistence after Course Create
- Automated cleanup of the E2E Draft through the authenticated LMS Admin API

### Docker media storage — resolved

- The backend image prepares `/app/media` and `/app/private_media` for the non-root `app` account.
- The container entrypoint repairs named-volume ownership before starting Django and then drops privileges to `app`.
- Image build, container recreation, health check and real syllabus/material PDF uploads passed.
- PostgreSQL data remained available after Docker Desktop and backend container restarts.

### Locked lesson fixture

The current seeded student account returns four courses and 40 lessons, all with `is_available = true`. Locked lesson rendering is covered by unit tests, but the locked → complete prerequisite → unlocked browser scenario requires a backend fixture with an `after_lesson` dependency.

## Handoff

Organization integration, Course Create/Edit and the complete four-role Release 1 lifecycle are ready. Existing read flows, progress flows, staff calendar CRUD, file uploads, course form persistence and responsive layouts are verified.
