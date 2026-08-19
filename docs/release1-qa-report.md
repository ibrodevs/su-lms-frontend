# SU LMS Release 1 — Frontend Integration QA

Date: 2026-08-19  
Frontend branch: `feature/SULMS-release1-frontend-integration`  
Backend repository: `adilhanDevs/su-lms-backend`  
Backend branch: `develop`  
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
- `npm test` — 77 tests passed
- `npm run test:e2e` — 8 Playwright scenarios passed
- `npm run build` — passed

Playwright coverage:

- Student, Teacher, Content Manager and LMS Admin login through real cookie authentication.
- `/auth/me/` role redirect and session persistence after browser refresh.
- Student Dashboard, Courses, Course Detail and Calendar using backend data.
- Staff Dashboard and Courses using backend-scoped data.
- Staff Calendar Create → refresh → PATCH → DELETE against PostgreSQL-backed API.
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

## Backend blocker

### Organization reference API

- Method: `GET`
- Endpoint: `/api/v1/organization/faculties/`
- Actual response: `404 Not Found`
- Expected response: paginated or list response with active faculties
- Affected roles: Teacher, Content Manager, LMS Admin
- Reproduction: authenticate as a staff demo account and request the endpoint

The same canonical read API is still required for departments, programs and semesters. Until these endpoints exist, Course Create/Edit cannot load valid foreign-key choices. The frontend intentionally shows a blocked state instead of saving mock organization data.

Blocked E2E coverage:

- Teacher Create Course and Edit Course
- Full Teacher → Content Manager → LMS Admin lifecycle starting from a newly created course
- Backend restart persistence test was not executed against the currently shared local server process

### Locked lesson fixture

The current seeded student account returns four courses and 40 lessons, all with `is_available = true`. Locked lesson rendering is covered by unit tests, but the locked → complete prerequisite → unlocked browser scenario requires a backend fixture with an `after_lesson` dependency.

## Handoff

Frontend work can proceed to delivery after the Organization API blocker is resolved and the blocked Teacher lifecycle E2E is rerun. Existing Release 1 read flows, progress flows, staff calendar CRUD and responsive layouts are verified.
