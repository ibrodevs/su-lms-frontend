# SU LMS Release 1 — Final QA

## Build under test

- Date: 2026-08-22
- Frontend branch: `feature/SULMS-release1-final-stabilization`
- Frontend verified SHA: `42d6f8db2d7f15a5dc7a1f35c9a57516f526bd29`
- Frontend PR: [ibrodevs/su-lms-frontend#10](https://github.com/ibrodevs/su-lms-frontend/pull/10)
- Backend branch: `develop`
- Backend SHA: `0e93ecd00f64723f9ff17411b0fbb3d516213920`
- Backend reference API PR: [adilhanDevs/su-lms-backend#10](https://github.com/adilhanDevs/su-lms-backend/pull/10)

## Environment

- Frontend development server: Vite on `http://localhost:5173`
- Production-like smoke: built `dist/` served by `npm run preview` on `http://localhost:5173`
- Backend: Docker Compose on `http://127.0.0.1:8001`
- Database: PostgreSQL 16
- Backend source: clean merged `develop`
- Demo seed: `python manage.py seed_release1`
- API health, Swagger and OpenAPI schema returned `200`.

Production-like preview smoke passed for Login, Student Dashboard, Student Course List and a direct Student Course route after browser refresh. No Vite overlay, console error or browser error was present.

## Browsers and viewports

- Playwright 1.62.1 Desktop Chrome profile: 1280 × 720
- Playwright 1.62.1 Pixel 5 profile: 393 × 851
- Chromium accessibility audit with axe-core 4.12.1

## Automated results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, zero warnings |
| `npm test` | PASS, 39/39 tests |
| `npm run test:e2e` | PASS, 14/14 scenarios |
| `npm run build` | PASS |
| Frontend quality GitHub Actions | PASS |
| Release 1 real-backend E2E GitHub Actions | PASS |
| Backend tests | PASS, 518/518 tests |
| Backend Pylint | PASS, 10.00/10 |
| `npm audit` | PASS, 0 vulnerabilities |
| Backend `pip check` | PASS |
| WCAG A/AA core-route audit | PASS, 0 violations |

The browser suite runs with one shared-backend worker and collects unexpected `console.error`, page errors, failed API responses and mock requests. The final database audit found no remaining `E2E-*` courses or templates.

## Functional acceptance

- Teacher: Create → Builder → Module → Topic → Lesson → Material → SCORM → Preview → Readiness → Submit Review.
- Content Manager: Under Review → inspect structure/material → Return for Revision.
- Teacher: edit Needs Revision course → Resubmit.
- LMS Admin: Publish → Enrollment with full student identity and Student ID → Calendar.
- Student: Dashboard → Course → locked prerequisite → Start/Complete → dependent lesson unlock → Material/SCORM → Progress → Calendar.
- Course Copy: new Draft with structure and no enrollment/progress.
- Template: create from course → refresh → create new Draft course with structure.
- Persistence: courses, structure, enrollment, calendar and completed progress survive backend restart.
- Authentication: login, refresh, session persistence, logout, role guards and single-flight refresh regression.
- Shared profile: Student, Teacher, Content Manager and LMS Admin.

## Evidence

- `docs/screenshots/release1-lifecycle/` — 9 continuous four-role lifecycle screenshots.
- `docs/screenshots/release1-final-stabilization/` — 7 locked/unlocked, SCORM, copy, template and restart screenshots.
- `docs/release1-qa-report.md` — detailed integration history and acceptance coverage.
- `docs/backend-integration-blockers.md` — all Release 1 backend blockers marked resolved.

## Known limitations

- Assignments are Release 2 scope.
- Gradebook is Release 2 scope.
- Quiz Engine is Release 3 scope.
- Full Learning Analytics is a later release.
- Real OIDC depends on the university Identity Provider.
- Production SIS integration depends on the university provider.
- Remote production deployment still requires environment-specific HTTPS, trusted origins, secrets, persistent storage, email delivery and monitoring configuration.

These items are outside the Release 1 frontend scope and are not treated as Release 1 defects.
