# Security model

- Secrets remain server-side and are documented by name only.
- Authentication uses Better Auth's password hashing and signed sessions; production requires secure cookies and a strong secret.
- Every data mutation checks project ownership in the server service layer.
- R2 credentials never reach the browser. Upload URLs expire after ten minutes and bind key, size, MIME, and optional checksum.
- Draft asset reads require project ownership and use five-minute signed URLs; the public R2 domain is not used as an authorization mechanism.
- Allowed asset MIME types and maximum size are enforced before signing; object size and MIME are verified before readiness.
- Auth routes and product APIs have independent rate limits.
- Generated content is structured data. The renderer does not execute arbitrary code or raw HTML.
- Future AI output must pass Zod validation and must not execute in the main backend process.
- Future builds run in a sandbox with explicit resource and network limits.
- Logs are structured and must never include passwords, session tokens, API keys, signed upload URLs, or full private prompts by default.
- Database migrations are append-only and production secrets are never used in build logs.

For production readiness, add email verification/recovery, centralized observability, a distributed job queue, malware scanning for uploads, backup/restore drills, and automated tenant-isolation integration tests before broad public launch.
