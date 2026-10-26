# Migration and deployment guide

## Current production boundary

The original `index.html`, `app.js`, and `styles.css` remain unchanged and tracked. They are the rollback source for the v0 static deployment. The Next.js application does not import them.

Do not point production traffic at the Next.js app until all required Phase 1 environment variables exist and the migration has succeeded. A successful source build alone does not prove that authentication, PostgreSQL, or R2 are configured.

## Environment setup

Required for application/authentication:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` (at least 32 random bytes)
- `BETTER_AUTH_URL` (canonical HTTPS origin)

Required for asset operations:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- optional `R2_PUBLIC_BASE_URL`

Future AI variables are documented in `.env.example` but are not consumed in Phase 1. No credential belongs in Git or a `NEXT_PUBLIC_*` variable.

## Safe rollout

1. Provision a PostgreSQL database and R2 bucket in a non-production environment.
2. Configure environment variables server-side.
3. Run `npm run db:migrate` once against the non-production database.
4. Run quality gates and deploy a preview.
5. Verify account creation, sign-in/out, tenant isolation using two accounts, project CRUD, version snapshot creation, and one R2 upload/delete.
6. Back up the current static deployment configuration and record its last working commit (`ac685bb`).
7. Apply the same append-only migration to production.
8. Deploy Next.js, verify `/api/health`, then test a real authenticated journey.
9. Only after those checks should the new deployment replace the static production alias.

Rollback application traffic to the previous static commit if runtime verification fails. Do not roll back an already applied database migration by rewriting or deleting it; ship a forward repair migration.

## Prototype data

The v0 prototype stored answers only in memory and generated a downloaded HTML file, so there is no server database to import. Existing downloaded customer HTML files are exports, not editable project records. A future import tool must parse them into the current schema and require user confirmation; Phase 1 does not pretend those files are migrated.
