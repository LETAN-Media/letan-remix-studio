# Architecture

## Decision summary

LETAN Remix Studio uses a modular monolith for synchronous product APIs and separate worker boundaries for long-running generation and publishing jobs. Phase 1 ships the modular monolith; later workers consume the same database contracts and immutable version snapshots.

```text
Browser
  ├─ public Remix Builder / structured live preview
  ├─ authenticated dashboard / project workspace
  └─ REST API
       ├─ Better Auth session
       ├─ ownership + validation + rate limit
       ├─ project/editor services ── PostgreSQL
       └─ signed asset service ───── Cloudflare R2

Future workers
  ├─ generation worker ── claims generation_jobs
  └─ build worker ─────── validates ProjectSnapshot, builds in sandbox, deploys
```

### Why PostgreSQL

Projects have ownership, ordered pages, component trees, assets, jobs, versions, deployments, and domains. PostgreSQL provides transactions, foreign keys, row locking for job claims, JSONB for evolving validated props, and portable managed hosting. D1 remains viable for smaller workloads, but this product's queue and relational/version workload is a better fit for PostgreSQL.

### Why a modular monolith first

Authentication and project CRUD remain simple to deploy on Vercel. Generation and build execution are explicitly modeled as asynchronous jobs and will run outside request handlers when introduced. This avoids a premature microservice split while preserving a hard boundary around long-running or untrusted work.

## Canonical project model

`siteHtml()` is not a generation engine. The canonical model is:

- `projects`: ownership, identity, status, schema version, and theme tokens.
- `pages`: ordered routes and SEO metadata.
- `components`: stable UUID, parent UUID, type, order, validated props, and responsive style overrides.
- `scene_configurations`: module ID plus asset, quality, camera, lighting, material, and animation settings.
- `assets`: project-scoped R2 objects and upload lifecycle.
- `project_versions`: immutable `ProjectSnapshot` JSONB records.

The React renderer consumes a validated snapshot. Future editor operations update records, then snapshots create version boundaries. Future generators produce proposed operations or a validated snapshot; they do not return executable server code.

## Data boundaries for later phases

### Generation

`generation_jobs` already records job kind, input, state, progress, attempts, result, timestamps, and errors. `generation_logs` stores structured events. A worker will claim rows with row locking, call a provider configured only through server environment, validate output using the versioned Zod contracts, and write changes transactionally.

### 3D

`SceneConfig` is renderer-neutral and supports module selection, GLB/GLTF asset reference, quality, camera, lighting, material, and animation. The public builder currently ships three independent procedural Three.js modules (`orbital-glass`, `prism-bloom`, and `kinetic-rings`) with responsive pixel density, reduced-motion handling, resource disposal, and a non-WebGL fallback. Phase 3 extends that registry with licensed GLB/GLTF assets and editor-level camera, light, material, and performance controls; the database contract does not change.

The anonymous five-step brief is stored in session storage and converted to a validated `ProjectSnapshot` for live preview. It does not become a durable project until the authenticated generation workflow succeeds. Authentication is checked on demand at that boundary, so the public Builder does not depend on a database session merely to render.

### Visual editor and AI edits

Stable component UUIDs allow selection, patches, undo/redo, and targeted AI changes. Editor commands will use typed operations such as `component.update`, `component.move`, and `page.insert`; preview-before-apply is an operation set, not a DOM mutation. Autosave updates the project model and periodically creates an immutable version.

### Publishing

Publishing consumes a specific `project_versions.id`, never mutable draft rows. A separate worker validates the snapshot, renders/builds in a constrained sandbox, records a `deployments` row, and only changes project/live URL state after the provider reports success. `domains` stores verification state independently.

## Tenant isolation

Every service starts with the authenticated user ID and scopes the first query to `projects.owner_id`. Nested page/component operations join back to the owned project before mutation. R2 keys are prefixed with both user and project IDs. Browser-supplied owner IDs are never accepted.

The service layer is the authorization boundary; UI visibility is not authorization.

## API and validation

- Zod validates all mutable public input.
- API responses use `{ data }` or `{ error: { code, message, details? } }`.
- Database-backed fixed-window rate limiting is keyed by authenticated user.
- Better Auth applies an additional tighter limit to authentication routes.
- Audit rows capture material project mutations without storing secrets.

## Renderer safety

Structured values are rendered as React text/props. The current renderer does not accept raw HTML and does not use `dangerouslySetInnerHTML`, `iframe.srcdoc`, `eval`, dynamic system commands, or AI-authored server modules. Phase 5 builds must remain sandboxed with CPU, memory, time, and network limits.
