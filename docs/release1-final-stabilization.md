# SU LMS Release 1 final stabilization

Date: 2026-08-22

## Branches

- Frontend: `feature/SULMS-release1-final-stabilization`
- Backend source: merged `develop` at `0e93ecd00f64723f9ff17411b0fbb3d516213920`
- Backend reference API delivery: [PR #10](https://github.com/adilhanDevs/su-lms-backend/pull/10)

## Completed scope

- Backend-driven course search, status, language, organization, semester, teacher, ordering and pagination filters.
- URL-persisted staff course filter state with dependent Faculty → Department → Program values.
- Compact teacher references and nested enrollment student identity.
- Shared profile access for Student, Teacher, Content Manager and LMS Admin.
- Single-flight session refresh and concurrent `401` regression coverage.
- Password recovery hidden behind `VITE_ENABLE_PASSWORD_RECOVERY` until a delivery contract is available.
- Locked prerequisite lesson, completion and unlock browser coverage.
- Valid SCORM upload and launch browser coverage.
- Course copy, reusable template and course-from-template browser coverage.
- Full Teacher → Content Manager → LMS Admin → Student lifecycle.
- PostgreSQL persistence verified after a backend container restart.
- Legacy runtime mocks, fake IDs and unreachable prototype modules removed.
- Desktop and Pixel 5 responsive checks.
- WCAG A/AA contrast and semantics checks on authentication, student and staff surfaces.
- Dependency audits with zero npm vulnerabilities and no broken backend Python requirements.
- GitHub Actions quality and real-backend E2E workflows.

## Repeatable verification

```bash
npm ci
npm run verify
npm run test:e2e:release1
```

The browser suite expects the backend at `http://127.0.0.1:8001` and accepts `E2E_BACKEND_DIR` when the backend repository is not adjacent to the frontend checkout. Temporary courses, templates, files, enrollments and progress are removed after each run.

The final local run completed 14/14 Playwright scenarios with a single shared-backend worker. It produced 9 continuous lifecycle screenshots and 7 final stabilization screenshots. A post-run database query confirmed that no `E2E-*` courses or templates remained.

## Production boundary

Deployment must provide a non-demo secret key, HTTPS security flags, production `ALLOWED_HOSTS`, trusted origins, persistent object storage and a real email provider before enabling password recovery. No production credentials are stored in this repository.
