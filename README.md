# LETAN Remix Studio — standalone prototype

Independent, responsive website creation wizard inspired by the high-level workflow observed at builder.peachworlds.com/remix. All source code is independently authored and uses no PeachWeb logos, proprietary 3D assets, source code or private endpoints.

## Features

- Choose industry (Agency, AI Tools, Consulting, CRM, Finance, Investor, SaaS, Sales & Marketing)
- Five-step flow: name, project description, visual style, 3D-inspired motif, color customization
- Local live preview via sandboxed iframe (`srcdoc`)
- Generate a responsive, single-file HTML website from answers
- Export a downloadable `.html` file
- Responsive mobile/tablet/desktop; reduced-motion support
- No API key, backend, build step or paid service needed for the prototype

## Run

From the project directory:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy on Vercel

Import the standalone repository as a Vercel Project. Choose **Other**, root `./`, no build command. Set output directory blank/default. No environment variables are required.

## Technical limits (important)

This is **not** a full production AI 3D website generation engine. The current generation is deterministic template-based; the preview's 3D-inspired artwork is CSS, not WebGL or copyrighted GLB assets. It does not provision hosting, persistent projects, accounts, billing, backend, AI model access, or PeachWeb's 3D template library. Contact link in generated sites is `hello@example.com`, which **must** be edited before publishing.

To build a production platform, add authenticated user workspaces, persistent database/storage, real WebGL scenes (Three.js), template editor, server-side AI generation using a configured provider and rate limits, and publishing/custom-domain workflows. Never put provider tokens in frontend code.

## Data safety

User inputs are kept only in the current browser session. No lead forms or remote APIs are called. Downloaded HTML contains the entered business details.
