# Release 1 backend integration status

Verified against backend `develop` at merge commit `0e93ecd00f64723f9ff17411b0fbb3d516213920` on 2026-08-22.

There are no open backend blockers for the Release 1 frontend scope.

## Organization references — resolved

- Active faculties, departments, programs and semesters are available under `/api/v1/organization/`.
- Department and program endpoints support the dependent Faculty → Department → Program filters.
- Anonymous requests return `401`; authenticated course-management roles receive read-only reference data.

## Teacher reference list — resolved

- `GET /api/v1/references/teachers/` returns compact active teacher records.
- The response exposes only `id`, `full_name` and `email`.
- Teacher, Content Manager, LMS Admin and Super Admin can populate course forms without access to user administration.

## Enrollment student identity — resolved

- Course enrollment responses contain nested student identity: `id`, `full_name`, `email` and `student_id`.
- Enrollment creation continues to accept the numeric student user ID.
- Teacher and LMS Admin views display the canonical university Student ID without mock data.

## Delivery evidence

- Backend commit: `8457c3c feat: add release1 reference data endpoints`
- Backend PR: [adilhanDevs/su-lms-backend#10](https://github.com/adilhanDevs/su-lms-backend/pull/10)
- Backend merge commit: `0e93ecd00f64723f9ff17411b0fbb3d516213920`
- Backend tests: 518 passed
- Pylint: 10.00/10
- Live API checks passed on clean `develop`.
