# PeachWeb Remix public-reference audit

Audited on 2026-10-27 against `https://builder.peachworlds.com/remix` with Chromium/Playwright. This is a behavioral and visual study of the public experience only. No private API, authenticated area, paid action, source bundle, model, texture, HDR, shader, template, logo, cookie, or PeachWeb asset is included in this repository.

The local screenshot evidence lives under `reference-audit/screenshots/` and is intentionally ignored by Git. The committed output is this measurement/behavior report and the independent LETAN implementation.

## Coverage

47 reference screenshots were captured across the required viewports, plus 37 discrete interaction/runtime checks (84 recorded audit observations in total).

| Surface | 390×844 | 430×932 | 768×1024 | 1440×900 |
| --- | --- | --- | --- | --- |
| Initial/loading | Captured | Captured | Captured | 80 ms, 300 ms, 1 s, 3 s |
| Category selector | Captured | Captured | Captured | Captured + hover |
| Step 1 empty/valid | Captured | Captured | Captured | Captured |
| Step 2 empty/valid | Captured | Captured | Captured | Captured |
| Step 3 styles | Captured | Captured | Captured | Captured |
| Step 4 scenes/selected | Captured | Captured | Captured | Captured |
| Step 5 palette | Captured | Captured | Captured | Captured |
| Picker open/closed | Captured | Captured | Captured | Captured |
| Live preview | Observed | Observed | Captured | Captured |

All eight public categories were clicked independently: Agency, AI Tools, Consulting, CRM, Finance, Investor, SAAS, and Sales & Marketing. Each led to the same Step 1 shell in the observed public flow.

## Measured structure

The visible hierarchy is:

```text
full-screen application (overflow hidden)
├── full-screen WebGL canvas
├── intro
│   ├── Skip button
│   ├── animated heading
│   ├── glass category panel
│   └── PeachWeb brand
└── wizard workspace
    ├── fixed glass panel
    │   ├── step label
    │   ├── heading
    │   ├── sparkle + prompt
    │   ├── step-specific scroll/content area
    │   └── Exit / Back / Next-or-Generate
    └── generated-site iframe (after a 3D choice)
```

Desktop measurements at 1440×900:

| Element | Measurement / computed style |
| --- | --- |
| Wizard panel | x 64, y 72, 356×756; 32 px padding; 40 px radius |
| Panel glass | `rgba(250,241,249,.65)`; `backdrop-filter: blur(33px)`; subtle white inset |
| Step label | 12/18 px Inter-like sans; `rgba(3,2,28,.5)` |
| Step heading | 38/57 px Neue-Haas-like grotesk; weight 450; `rgb(25,26,28)` |
| Prompt | 22/33 px; 13 px gap after the sparkle |
| Step 1 input | x 96, y 672, 292×48 |
| Step 2 textarea | x 96, y 580, 292×140 |
| Catalog | x 96, y 333; two 142×96 cards; 8 px gaps |
| Actions | y 760; 36 px high; 12 px radius |
| Preview | x 468, y 72, 908×756; approximately 48 px after panel |
| Palette rows | 292×56 with 8 px vertical gaps |
| Color picker | x 458, y 350, 292×388; 24 px inner horizontal inset |
| SV field | x 482, y 402, 244×232 |
| Hue rail | x 482, y 654, 244×8 |
| HEX input | x 606, y 682, 120×32; 24 px pill radius |

The intro uses a 522×185 glass panel with a 40 px radius. Its title words enter in roughly 80 ms increments; title, panel, and logo settle in staged 300 ms transitions. The first observed frame was a dark blank screen, followed by a flat periwinkle field, staggered title text, then the canvas scene and the rest of the intro.

## Interaction behavior

- Step 1 and Step 2 disable Next only for an exactly empty value in the reference. A whitespace-only value enables it. LETAN deliberately trims whitespace before enabling Next.
- Step 3 initially disables Next. Selecting a style immediately advances to Step 4.
- Returning from Step 4 to Step 3 retains the selected style and enables Next.
- Step 4 requires a scene selection, then enables Next. Scene selection does not auto-advance.
- Back from Step 2 retains both the project name and description when moving forward again.
- Refresh in the observed reference resets to category selection. LETAN deliberately keeps the draft in session storage because persistence is a product requirement.
- Exit did not navigate from this direct-entry reference session. LETAN uses Exit to return to category selection.
- The already-settled Skip button produced no new state; its useful role appears to be fast-forwarding the intro sequence.
- Generate was tested behind a Playwright guard that aborted every non-GET request. No mutation request, redirect, or next public state was observed from the available reference session, so post-Generate behavior is not claimed.

## Responsive findings

The reference keeps the 356 px wizard at x=64 and y=72 across the tested sizes. Its document has a minimum effective width of 828 px (`scrollWidth=828`) at 390, 430, and 768 px, which causes horizontal cropping on phones and tablets. The 390 px intro category panel measured x=-66 and width 522.

LETAN copies the measured desktop rhythm but intentionally does not reproduce that defect. At 760 px and below it uses a 16 px viewport inset, an internal scrolling content area, pinned usable actions, and a separate mobile preview mode. The color picker is constrained to the viewport.

## Public 3D observations

- A full-screen WebGL2 canvas is present; the measured buffer matches 1440×900 at device scale factor 1.
- Context flags: alpha, depth, stencil, and antialias enabled; high-performance preference; `preserveDrawingBuffer=false`.
- Public resource metadata shows one GLB, one HDR environment, and Draco WASM decoder resources. Their URLs were recorded for architecture analysis only; none are reused by LETAN.
- Frame hashes changed over time, confirming continuous rendering. Pointer and scroll samples also differed, but continuous animation prevents attributing those differences solely to input.
- Headless Chromium used SwiftShader and delivered non-representative frame timing. Physical-iPhone performance was not verified and is not marked PASS.

LETAN uses independently-authored Three.js geometry, materials, lights, camera behavior, pointer response, responsive pixel-ratio limits, reduced-motion handling, visibility throttling, resource disposal, and a no-WebGL fallback.

## Coverage matrix after reconstruction

| Feature | PeachWeb behavior | LETAN behavior | Status |
| --- | --- | --- | --- |
| Loading/intro | Staged dark → periwinkle → words/panel/logo/scene | Dark hydration shell; staged words, panel, brand, independent scene | PASS with independent visuals |
| Category selection | 8 choices lead to Step 1 | 8 requested choices lead to Step 1 | PASS |
| Step 1 | Empty-only validation, fixed glass shell | Trimmed non-empty validation, measured shell | PASS, stricter validation |
| Step 2 | Same heading, textarea, persistence through Back | Same heading/copy pattern; persists through Back and refresh | PASS |
| Step 3 | Seven 2-column thumbnails; auto-advance | Seven independent CSS thumbnails; auto-advance | PASS |
| Step 4 | Eight reference cards, five free and three paid | Three genuinely working independent WebGL modules only | PARTIAL catalog, honest runtime |
| Step 5 | Four palette rows and 292×388 picker | Four mapped scene colors and full SV/hue/HEX picker | PASS |
| Live preview | Structured iframe appears after scene choice | Structured React `ProjectSnapshot` renderer; no `srcdoc` | PASS, independent implementation |
| Back / data retention | Retained in in-memory navigation | Retained through navigation and session refresh | PASS |
| Mobile | Reference overflows to 828 px | No horizontal overflow; separate preview mode | PASS, intentional repair |
| Generate | No next state available under guarded public test | Auth handoff works; no fake generation if worker/provider unavailable | PARTIAL by design |

## Access and parity limits

- No authenticated, paid, private, or post-generation PeachWeb area was accessed.
- The reference preview occasionally exposed a placeholder `/logo` while its generated preview initialized; this was treated as a loading limitation, not copied.
- PeachWeb catalog thumbnails, GLB/HDR files, shaders, fonts, templates, and branding are not redistributed.
- Exact 3D asset parity is intentionally impossible without licensed source assets. The target is comparable depth, lighting, motion, and interaction using LETAN-owned procedural scenes.
- Physical device performance, paid scene flows, and the reference's post-Generate state remain unverified.

## LETAN E2E verification

The reconstructed flow was replayed at all four required viewports. Assertions passed for all eight categories, empty-field validation, Step 1→5 navigation, style auto-advance, explicit scene selection, Back persistence, session refresh persistence, live structured preview content, real-time color updates, mobile preview mode, zero horizontal overflow, full-size canvas buffers, and unauthenticated Generate handoff to `/sign-up?returnTo=/remix?resume=1`.

At 390×844 and 430×932 the viewport was programmatically reduced to 520 px while the Step 1 input was focused. Both the input and action bar remained inside the resized visual viewport. This is a browser viewport simulation, not a physical-keyboard test.

ImageMagick RMSE diffs were generated locally for 19 same-viewport state pairs. Mean normalized RMSE was 0.207388. The largest delta was desktop Step 5 closed (0.415173), dominated by LETAN rendering a live, populated structured project while one captured reference frame was still a dark/placeholder preview. The diff review drove the fixed 356 px wizard, 48 px desktop gap, 142×96 catalogs, heading/prompt rhythm, picker geometry, and mobile overflow repairs. Diff images remain local-only under the ignored `reference-audit/diffs/` directory.
