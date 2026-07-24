# Security Policy

## Supported versions

SU LMS Frontend is under active development. Security fixes are applied to the latest version of the `main` branch.

## Reporting a vulnerability

Do not disclose security vulnerabilities through public GitHub issues.

Send a private report to the project maintainer through GitHub with:

- a clear description of the vulnerability;
- affected pages, routes or components;
- reproduction steps;
- potential impact;
- suggested mitigation, when available.

Please avoid accessing, modifying or downloading real user data while verifying a vulnerability.

## Sensitive information

Never commit:

- passwords or access tokens;
- production API keys;
- private certificates;
- `.env` files containing real credentials;
- student, teacher or university personal data.

Only variables intended for public browser use may use the `VITE_` prefix. Secrets must remain on the backend or deployment platform.
