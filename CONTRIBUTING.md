# Contributing to SU LMS Frontend

Thank you for contributing to SU LMS. This repository follows a lightweight pull-request workflow to keep development fast, reviewable and stable.

## Development setup

```bash
git clone https://github.com/ibrodevs/su-lms-frontend.git
cd su-lms-frontend
npm install
cp .env.example .env.local
npm run dev
```

## Branch naming

Use one of the following prefixes:

- `feature/` for new functionality
- `fix/` for bug fixes
- `refactor/` for structural improvements
- `docs/` for documentation
- `chore/` for tooling and maintenance

Examples:

```text
feature/course-builder
fix/mobile-navigation
refactor/api-client
```

## Commit messages

Use clear, focused commit messages:

```text
feat: add teacher course list
fix: preserve lesson progress after refresh
refactor: extract authentication service
docs: update local setup instructions
```

## Pull requests

Before opening a pull request:

1. Rebase or update your branch from `main`.
2. Run `npm run build`.
3. Test the affected user flow manually.
4. Include screenshots or recordings for visual changes.
5. Describe the change, reason and testing steps.

Keep pull requests focused on one feature or problem whenever possible.

## Code expectations

- Prefer reusable components over duplicated markup.
- Keep pages focused on composition and feature components.
- Do not hardcode production URLs, credentials or tokens.
- Preserve responsive behaviour.
- Use accessible labels, semantic HTML and keyboard-friendly controls.
- Keep API calls outside presentational components as integration is introduced.

## Reporting bugs

Use the GitHub bug report template and include reproduction steps, expected behaviour, actual behaviour and screenshots where relevant.
