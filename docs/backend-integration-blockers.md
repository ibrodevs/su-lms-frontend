# Release 1 frontend integration blockers

Verified against backend `develop` at commit `6f1b89d` on 2026-08-18.

## Organization reference API is unavailable

- Endpoints: `/api/v1/organization/faculties/`, `/departments/`, `/programs/`, `/semesters/`
- Method: `GET`
- Request: authenticated request from a course creator
- Response: `404` with `not_found`
- Expected: read-only active Organization references and the documented faculty/department filters
- Affected roles: Teacher, Content Manager, LMS Admin, Super Admin
- Reproduction: start the seeded backend and request any endpoint listed above

Impact: Course Create/Edit cannot replace `mockOrganization` and the Release 1 frontend task cannot be considered complete.

## Content Manager cannot load the teacher reference list

- Endpoint: `/api/v1/users/?role=teacher&is_active=true&page_size=100`
- Method: `GET`
- Request: authenticated as `content@su.edu.kg`
- Response: `403 permission_denied` — `LMS administrator access is required.`
- Expected: a read-only teacher reference list for roles allowed to create courses
- Affected role: Content Manager
- Reproduction: seed Release 1, sign in as Content Manager, request the endpoint above

Impact: Content Manager has `courses.create` but cannot populate the required Teacher select without mock data. User administration can remain restricted to LMS Admin/Super Admin; the course-form reference endpoint needs compatible read access or a dedicated compact endpoint.

