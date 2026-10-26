# REST API

All endpoints except `/api/health` and Better Auth's `/api/auth/*` routes require an authenticated session cookie. Every project endpoint performs a server-side ownership check. JSON request bodies are schema validated.

## Response envelope

Success:

```json
{ "data": {} }
```

Failure:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": {} } }
```

## Implemented in Phase 1

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Database-backed health check |
| `GET/POST` | `/api/auth/*` | Better Auth session, sign-up, sign-in, sign-out |
| `GET/POST` | `/api/projects` | List or create owned projects |
| `GET/PATCH/DELETE` | `/api/projects/:projectId` | Read, update, or delete an owned project |
| `GET/POST` | `/api/projects/:projectId/pages` | List or create pages |
| `PATCH/DELETE` | `/api/projects/:projectId/pages/:pageId` | Update or delete a page |
| `GET/POST` | `/api/projects/:projectId/pages/:pageId/components` | List or create stable components |
| `PATCH/DELETE` | `/api/projects/:projectId/pages/:pageId/components/:componentId` | Update or delete a component |
| `GET/PATCH` | `/api/projects/:projectId/scene` | Read or update the typed 3D scene configuration |
| `GET/POST` | `/api/projects/:projectId/versions` | List or create immutable project snapshots |
| `GET/POST` | `/api/projects/:projectId/assets` | List assets or request a signed R2 upload |
| `POST` | `/api/projects/:projectId/assets/complete` | Verify R2 object metadata and mark an upload ready |
| `DELETE` | `/api/projects/:projectId/assets/:assetId` | Delete the R2 object and tombstone the asset |

The upload request supports JPEG, PNG, WebP, AVIF, MP4, WebM, GLB, and GLTF, with a 100 MiB maximum. It returns a ten-minute signed `PUT` URL. The browser uploads directly to R2, then calls `assets/complete`.

## Reserved for later phases

The database already models these resources, but public mutation endpoints are intentionally not exposed until their workers and state machines exist:

- `/api/projects/:projectId/generations` — Phase 2 generation queue and scoped AI edits.
- `/api/projects/:projectId/versions/:versionId/restore` — Phase 4 transactional restore.
- `/api/projects/:projectId/deployments` — Phase 5 sandboxed build and publish state.
- `/api/projects/:projectId/domains` — Phase 5 domain verification and lifecycle.

No placeholder endpoint reports success for these unfinished operations.
