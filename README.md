# LETAN Remix Studio

LETAN Remix Studio is evolving from a browser-only HTML prototype into an authenticated, multi-project AI website builder. Phase 1 replaces the one-off `siteHtml()` data flow with a durable project model, a component renderer, server-side ownership checks, version snapshots, and an R2 asset contract.

The original static prototype is still preserved in the repository as `index.html`, `app.js`, and `styles.css`. It is no longer the application architecture and is not imported by the Next.js app.

## Current capabilities

- Next.js App Router and strict TypeScript
- Email/password authentication through Better Auth
- PostgreSQL schema and Drizzle migrations
- Authenticated project dashboard and project creation
- Owner-isolated project, page, component, scene, asset, and version APIs
- Structured page/component renderer (no `iframe.srcdoc` and no generated HTML string)
- Public five-step Remix Builder at `/` and `/remix`, with session persistence before sign-in
- Three working WebGL scene modules with responsive quality scaling and a non-WebGL fallback
- Live theme/color editing backed by a valid `ProjectSnapshot` preview
- Authentication handoff that returns the user to the in-progress Remix brief
- Stable UUIDs for pages and components
- Theme-token and typed Three.js scene contracts
- Immutable project version snapshots
- Cloudflare R2 signed uploads with MIME/size validation and upload verification
- Persistent database-backed API rate limiting and audit records
- Health endpoint, lint, typecheck, unit tests, and production build scripts

AI generation, GLB/GLTF asset-driven scene authoring, the full visual drag/drop editor, and production publishing workers are deliberately not claimed as complete. Their tables and interfaces exist so those phases can be added without replacing the Phase 1 model. When no AI provider/worker is configured, Generate reports that state instead of producing placeholder output.

## Local setup

Requirements: Node.js 22+, PostgreSQL 16+, and an R2 bucket for asset operations.

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

For a disposable local PostgreSQL database:

```bash
docker compose up -d postgres
npm run db:migrate
```

Open `http://localhost:3000` to start the Remix Builder without an account. Authentication is requested only when the user reaches a durable operation such as Generate. The dashboard and project APIs remain authenticated. R2 variables are only required when requesting an asset upload.

Generate a strong production auth secret separately and put it in the deployment provider's server-side environment. Never commit it or expose it with a `NEXT_PUBLIC_` prefix.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Database schema changes must be made in `src/server/db/schema.ts`, followed by `npm run db:generate`. Commit both the SQL migration and Drizzle metadata; never rewrite a migration already applied in an environment.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [REST API](docs/API.md)
- [Migration and deployment](docs/MIGRATION.md)
- [Security model](docs/SECURITY.md)

## Repository map

```text
src/app/                 Next.js pages and REST route handlers
src/components/          Remix Builder, WebGL scenes, auth, and project UI components
src/domain/              Versioned Zod contracts shared by all future phases
src/renderer/            Component registry and structured React renderer
src/server/auth.ts       Better Auth server configuration
src/server/db/           Drizzle schema and lazy PostgreSQL connection
src/server/services/     Ownership-safe business operations
src/server/storage/      Server-only R2 adapter
drizzle/                 Append-only SQL migrations and metadata
docs/                    Architecture, API, security, and migration guides
index.html/app.js/css    Preserved v0 static prototype; not used by Next.js
```

## Independent implementation

The public high-level flow at `builder.peachworlds.com/remix` was used only as product reference. This repository does not use PeachWeb source code, private APIs, logos, commercial templates, or proprietary 3D assets.
