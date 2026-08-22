# SU LMS Release 1 — Frontend Integration QA

Date: 2026-08-22
Frontend branch: `feature/SULMS-release1-final-stabilization`
Backend repository: `adilhanDevs/su-lms-backend`
Backend branch: clean `develop` at merge commit `0e93ecd00f64723f9ff17411b0fbb3d516213920`
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
- `npm test` — 39 active API-driven tests passed
- `npm run test:e2e` — 14 Playwright scenarios passed sequentially against the real backend
- `npm run build` — passed
- Lifecycle screenshot run — passed independently with 9 final screenshots
- Backend test workflow — 518 tests passed
- Backend Pylint workflow — 10.00/10
- `npm audit` and `npm audit --omit=dev` — 0 vulnerabilities
- WCAG A/AA automated audit — 0 violations on Login, Student Dashboard, Student Courses, Student Profile, Staff Courses and Staff Profile

Playwright coverage:

- Student, Teacher, Content Manager and LMS Admin login through real cookie authentication.
- `/auth/me/` role redirect and session persistence after browser refresh.
- Student Dashboard, Courses, Course Detail and Calendar using backend data.
- Staff Dashboard and Courses using backend-scoped data.
- Staff Calendar Create → refresh → PATCH → DELETE against PostgreSQL-backed API.
- Teacher Course Create → refresh → Edit using backend organization references and PostgreSQL persistence.
- Full Teacher Create → Builder → Module → Topic → Lesson → PDF Material → Submit Review → Content Manager Return → Teacher Resubmit → LMS Admin Publish → Enrollment → Calendar → Student Course → Lesson → Complete → Progress lifecycle.
- Enrollment verification waits for the refreshed table and asserts the student record, not only the success notification.
- Lifecycle test removes its course, uploaded files, enrollment and progress records after every run.
- Release 2/3 navigation is absent from the Student runtime.
- No requests to mock JSON/modules during tested flows.
- No unexpected API errors, browser console errors or React runtime errors.
- Desktop Chromium and Pixel 5 viewport checks, including horizontal overflow assertions.
- Student locked prerequisite → completion → dependent lesson unlock using a real database fixture.
- Teacher upload and launch of a valid SCORM package.
- Content Manager course copy, reusable template creation and course creation from that template.
- Course structure and completed student progress remain available after a real backend container restart.
- Shared-backend browser files run with one worker so restart and lifecycle fixtures cannot race.

## Runtime data audit

- Staff Dashboard no longer imports `mockUsers`, `useMockLoading`, legacy sessions or `courseService`.
- Student search and profile use backend data.
- Course, structure, materials, templates, enrollments, users, progress and calendar runtime paths use `/api/v1/`.
- `localStorage` is limited to the collapsed sidebar UI preference.
- Password recovery routes are disabled by default until an email delivery contract is configured.
- Assignments, Tests, Schedule and Notifications remain outside the Release 1 route graph.

## Screenshots

General backend-connected screenshots are stored in `docs/screenshots/release1-e2e/`.

The final continuous lifecycle evidence is stored in `docs/screenshots/release1-lifecycle/`:

- Teacher Builder with the lesson and uploaded PDF material
- Teacher Submit Review
- Content Manager Return with the revision comment
- Teacher Resubmit
- LMS Admin Publish and visible active enrollment
- LMS Admin public Calendar event
- Student Calendar with the enrolled course event
- Student completed lesson
- Student course progress at 100%

The general screenshot set also covers:

- Student Dashboard, Courses, Course Detail and Calendar
- Teacher Dashboard and Courses
- Course Builder and Readiness
- Content Manager review list
- LMS Admin Users and Enrollments
- Staff Calendar

Final stabilization evidence is stored in `docs/screenshots/release1-final-stabilization/` and covers prerequisite locking/unlocking, SCORM, course copy, templates and progress after backend restart.

## Backend integration fix

### Organization reference API — resolved

- Backend commit: `241bf86 feat: add organization reference api`
- Backend PR: `adilhanDevs/su-lms-backend#7` — merged into `develop`
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

- Backend PR: `adilhanDevs/su-lms-backend#8` — merged into `develop`
- The backend image prepares `/app/media` and `/app/private_media` for the non-root `app` account.
- The container entrypoint repairs named-volume ownership before starting Django and then drops privileges to `app`.
- Image build, container recreation, health check and real syllabus/material PDF uploads passed.
- PostgreSQL data remained available after Docker Desktop and backend container restarts.

### Windows checkout line endings — resolved

- Backend PR: `adilhanDevs/su-lms-backend#9` — merged into `develop`
- `.gitattributes` enforces LF for shell scripts.
- A regression test rejects CRLF in `docker-entrypoint.sh`.
- A fresh Windows checkout built successfully, and the container started under the non-root `app` account.

### Restart persistence — verified

- A temporary Teacher Draft was created through the real API on clean `develop`.
- The backend container was restarted and returned to `healthy`.
- The draft was found with the same ID, code and status after restart, then removed through the authenticated API with `204`.

### Release 1 reference API — resolved

- Backend PR: `adilhanDevs/su-lms-backend#10` — merged into `develop`
- `GET /api/v1/references/teachers/` supplies compact active teacher records to course-management roles.
- Enrollment responses expose nested student identity with the canonical university Student ID.
- Frontend course filters and enrollment tables use these contracts directly.

### Locked lesson fixture — verified

The final stabilization browser suite creates an isolated `after_lesson` dependency, verifies the locked state, completes the prerequisite, verifies the unlocked state and removes all temporary data. The same course and completed progress are then verified after a backend restart.

## Handoff

Organization integration, Course Create/Edit, reference data and the complete four-role Release 1 lifecycle are ready on merged backend `develop`. Read flows, progress, prerequisite unlock, SCORM, templates, course copy, staff calendar CRUD, file uploads, restart persistence and responsive layouts are verified against the real API.
