<p align="center">
 <img width="1885" height="904" alt="image" src="https://github.com/user-attachments/assets/9d87d991-3dd4-4441-8a4c-e53eb806ea39" />
</p>

<h1 align="center">Markly</h1>

<p align="center"><strong>Excalidraw for documents — visual PDF annotation and async review for teams.</strong></p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#usage-guide">Usage</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## Overview

Markly is a self-hostable **PDF annotation and async document review platform**. Think Excalidraw, except the canvas isn't blank — your document is the base layer.

Upload a PDF (or a DOCX, converted server-side), mark it up freehand, drop shapes and text anywhere, leave threaded comments, then hand someone a link. Reviewers don't need an account, don't need to install anything, and can send their markup back to you with one click. When you're done, export a flat PDF with every annotation baked into the bytes — fonts embedded, positions identical to what you saw on screen.

**Who it's for:** designers collecting feedback on mockups, lawyers redlining contracts, architects marking up plans, product teams reviewing specs — anyone whose review loop currently lives in email attachments named `final_v3_REVISED.pdf`.

**Why it exists.** Comment threads in Google Docs don't work for visual documents. Acrobat's annotation tools do, but they lock reviewers into an account and a desktop install. Markly sits in between: real drawing tools on a real PDF, shared by URL, running entirely on free-tier infrastructure.

---

## Features

### Annotation engine

- **Eight tools** — select, rectangle, circle, arrow, line, highlight, freehand, text
- **Click-to-type anywhere** with live inline editing and per-annotation color and size
- **Multiple fonts** — Virgil (Excalidraw's hand-drawn face), Helvetica, Times, Courier — chosen from a font picker and preserved through export
- **Multi-page navigation** with a rendered thumbnail sidebar
- **Zoom** that keeps annotations locked to their document coordinates
- **Full undo/redo** across the session (`Ctrl+Z` / `Ctrl+Y`)

### Collaboration

- **Zero-login review links** with `VIEW`, `COMMENT`, or `EDIT` access, optionally time-limited
- **Share-back flow** — a reviewer's markup branches into a copy of the document and returns as a new link, so the original is never overwritten
- **Threaded comments** anchored to a specific annotation or page, resolvable inline
- **Debounced autosave** with a live save indicator, plus manual `Ctrl+S`

### Documents and export

- **PDF and DOCX uploads** — DOCX is converted to PDF server-side via LibreOffice where available
- **Direct-to-storage uploads** via presigned URLs, so large files never pass through a serverless function
- **Annotated PDF export** through `pdf-lib`, with custom fonts embedded and text wrapping that mirrors the editor canvas
- **Originals stay untouched** — annotations live in the database, never written into the source file

### Platform

- Firebase Authentication with server-verified session cookies
- Per-user workspaces and projects
- Pluggable storage: local disk in development, Cloudflare R2 in production, selected from env alone
- End-to-end TypeScript with Zod-validated request bodies
- **Runs entirely on free tiers** — no paid service anywhere in the stack

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components and API routes in one deployable |
| UI | React 19 + Tailwind CSS v4 | Minimal black-and-white design system via CSS variables |
| Language | TypeScript 5 | Type safety across client, server, and DB |
| Client state | Zustand | Small, synchronous editor store (tools, history, viewport) |
| Server state | TanStack React Query | Caching, refetching, mutation lifecycle |
| PDF rendering | pdf.js (`pdfjs-dist` v5) | The reference PDF renderer |
| Annotation canvas | HTML Canvas + Konva + Rough.js | Direct pixel control, hand-drawn stroke styling |
| PDF export | `pdf-lib` + `@pdf-lib/fontkit` | Byte-level PDF authoring with font embedding |
| Auth | Firebase Auth + Firebase Admin | Client sign-in, server-side session cookie verification |
| ORM | Prisma 7 | Typed queries, migrations, JSON columns |
| Database | PostgreSQL 16 (Neon free tier) | Relational data with JSON geometry/style columns |
| Object storage | Cloudflare R2 via AWS S3 SDK | S3-compatible, 10 GB free, zero egress fees |
| Validation | Zod v4 | Runtime schema validation at API boundaries |

---

## Architecture

### System overview

<img width="654" height="805" alt="image" src="https://github.com/user-attachments/assets/eaf2b56f-562a-4292-92ca-a699bc785553" />



### Data model

<img width="865" height="139" alt="image" src="https://github.com/user-attachments/assets/767b1dce-5f01-4427-bc1f-c4e0906d9ab9" />



Annotations store `geometry` and `style` as JSON columns, so new tool types don't require a migration. Documents carry an `isVisible` flag — share-back branches are created hidden until the owner accepts them.

### Two authorization paths

Every document-scoped route resolves access through one of two paths:

1. **Session cookie** — `markly_session`, an HTTP-only Firebase session cookie (5-day lifetime) verified server-side by Firebase Admin, then matched against document ownership.
2. **Share token** — a `?token=` query param resolved to a `ShareLink`, checked for expiry and ranked access level (`VIEW` < `COMMENT` < `EDIT`) against what the route requires.

This is what makes login-free review possible without introducing a second, weaker auth system.

### Upload flow

PDF bytes never pass through an API route:

```
browser → POST /api/documents/upload-url   auth + project check → presigned PUT
browser → PUT  https://<account>.r2.cloudflarestorage.com/…    the actual bytes
browser → POST /api/documents/upload       { filename } → verify object exists → DB row
```

Serverless request bodies are capped at 4.5 MB on Vercel; streaming a 50 MB PDF through a function is impossible there and wasteful everywhere else. The server calls `fileExists()` before writing the row, so a client can't fabricate an orphaned document record. DOCX still uses the multipart path because it needs server-side LibreOffice.

### Storage driver selection

`lib/storage.ts` picks a driver from the environment — all four `R2_*` variables set means R2, otherwise local disk at `STORAGE_PATH`. Call sites never branch, so `npm run dev` works with zero cloud credentials.

### Font consistency

`lib/fonts.ts` is a single dependency-free registry shared by the canvas, the toolbar picker, and the export route. Each font declares a CSS stack for on-screen rendering plus either a `pdf-lib` standard font or a file under `public/fonts` to embed. The export route re-implements the canvas's text wrapping against the embedded font's real metrics, which is why exported text breaks lines in the same places the editor did.

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 14+** — local, Docker, or a free Neon project
- A **Firebase project** with Authentication enabled (Google and/or email sign-in)
- *Optional:* **LibreOffice** on the host if you want DOCX uploads

### 1. Clone and install

```bash
git clone https://github.com/KUNDAN1334/Markly.git
cd Markly/markly
npm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Configure the environment

```bash
cp .env.local.example .env.local
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string. Use the **pooled** URL on Neon. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public origin, no trailing slash. Share links are built from this. |
| `NEXT_PUBLIC_FIREBASE_*` | ✅ | Web app config from the Firebase console |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | ✅ | Service account for server-side verification. Keep the `\n` escapes in the key and wrap it in quotes. |
| `STORAGE_PATH` | — | Local upload directory. Ignored when R2 is configured. |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | — | Setting all four switches storage to Cloudflare R2. |
| `DOCX_CONVERSION_ENABLED` | — | Set `false` on serverless hosts with no LibreOffice binary. |
| `LIBREOFFICE_PATH` | — | Explicit path to `soffice` if it isn't on `PATH`. |

<details>
<summary>Running Postgres in Docker</summary>

```bash
docker run -d --name markly-db \
  -e POSTGRES_DB=markly \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:16
```

Then set `DATABASE_URL="postgresql://postgres:password@localhost:5432/markly"`.
</details>

### 3. Set up the database

```bash
npx prisma migrate deploy   # apply migrations
npx prisma generate         # regenerate the client if needed
```

### 4. Create the local storage directory

```bash
mkdir -p storage/documents
```

Skip this if you're using R2.

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

### Available scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

### Deployment

[`DEPLOYMENT.md`](./DEPLOYMENT.md) walks through the full free-tier deployment — Neon for Postgres, Cloudflare R2 for documents, Vercel for the app, Firebase for auth — including the R2 CORS policy that presigned uploads need and the Firebase authorized-domain step that Google sign-in needs.

---

## Usage Guide

**1. Sign in.** Google or email via Firebase. A workspace is created on first sign-in, and any orphaned projects are adopted into it.

**2. Create a project and upload.** Drag a PDF or DOCX onto the upload zone on the dashboard. DOCX is converted to PDF server-side; the original is preserved either way.

**3. Annotate.** Pick a tool from the toolbar and draw. Text annotations are created by clicking anywhere and typing — set font, size, and color before or after. Changes autosave on a debounce, the header shows save state, and `Ctrl+S` forces a save.

**4. Comment.** Open the sidebar to leave a comment on the current page, or attach one to a selected annotation. Resolve threads inline as they're addressed.

**5. Share.** Use the share modal to mint a link with the access level you want. Reviewers open `/review/<token>` — no account, no install. `VIEW` is read-only, `COMMENT` adds the sidebar, `EDIT` gives the full toolbar.

**6. Collect and export.** A reviewer with `EDIT` access can share their markup back, which branches the document so your original stays intact. When you're finished, export a flat PDF with every annotation embedded.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `S` | Select |
| `R` | Rectangle |
| `C` | Circle |
| `A` | Arrow |
| `L` | Line |
| `H` | Highlight |
| `F` | Freehand |
| `T` | Text |
| `Delete` / `Backspace` | Delete selection |
| `Ctrl/⌘ + Z` | Undo |
| `Ctrl/⌘ + Y` or `Ctrl/⌘ + Shift + Z` | Redo |
| `Ctrl/⌘ + S` | Save now |
| `Ctrl/⌘ + Enter` | Commit inline text edit |
| `Esc` | Cancel inline text edit |

---

## Folder Structure

```
markly/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── login/ · signup/             # Firebase auth screens
│   ├── dashboard/page.tsx           # Projects and documents
│   ├── editor/[documentId]/         # Full annotation editor
│   ├── review/[token]/              # Login-free share view
│   └── api/
│       ├── auth/session/            # Session cookie mint / read / clear
│       ├── workspaces/current/      # Current user's workspace
│       ├── projects/                # List, create, read, delete
│       ├── documents/
│       │   ├── upload-url/          # Presigned PUT for direct upload
│       │   ├── upload/              # Finalize upload / DOCX multipart path
│       │   ├── file/[filename]/     # Stream document bytes
│       │   └── [id]/                # Document metadata
│       ├── annotations/             # Bulk replace + per-annotation ops
│       ├── comments/                # Create, list, resolve, delete
│       ├── share/                   # Create, resolve, revoke share links
│       └── export/                  # Annotated PDF generation
│
├── components/
│   ├── editor/                      # PDFViewer, AnnotationCanvas, Toolbar, PageThumbnails
│   ├── comments/CommentsSidebar.tsx
│   ├── documents/UploadZone.tsx
│   ├── sharing/ShareModal.tsx
│   ├── auth/AuthScreen.tsx
│   ├── landing/LandingPageClient.tsx
│   ├── MorphLoader.tsx              # Shared route/transition loader
│   └── Providers.tsx                # React Query provider
│
├── lib/
│   ├── auth.ts                      # Session verification + access authorization
│   ├── share-link-auth.ts           # Share token validation and access ranking
│   ├── storage.ts                   # R2 / local-disk storage driver
│   ├── fonts.ts                     # Shared font registry (canvas + export)
│   ├── document-conversion.ts       # DOCX → PDF via LibreOffice
│   ├── document-branch.ts           # Share-back document branching
│   ├── workspace.ts                 # Workspace bootstrap for a user
│   ├── store.ts                     # Zustand editor store
│   ├── prisma.ts · firebase-*.ts    # Client singletons
│   └── utils.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/fonts/                    # Virgil.otf / Virgil.woff2
├── public/pdf.worker.min.mjs        # pdf.js worker
└── types/index.ts                   # Shared domain types
```

---

## API Reference

All endpoints return JSON; errors take the shape `{ error: string }`. Document-scoped routes accept either a session cookie or a `?token=` share token.

### Auth & workspace

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/session` | Exchange a Firebase ID token for a session cookie |
| `GET` | `/api/auth/session` | Current session user |
| `DELETE` | `/api/auth/session` | Sign out |
| `GET` | `/api/workspaces/current` | Current user's workspace |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List the caller's projects |
| `POST` | `/api/projects` | Create — `{ name }` |
| `GET` | `/api/projects/:id` | Project with documents |
| `DELETE` | `/api/projects/:id` | Delete project and all nested data |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload-url` | Presigned PUT URL for direct-to-storage upload |
| `POST` | `/api/documents/upload` | Finalize an upload, or multipart DOCX upload |
| `GET` | `/api/documents/file/:filename?documentId=&token=` | Stream document bytes |
| `GET` | `/api/documents/:id` | Document metadata with annotations and comments |

### Annotations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/annotations?documentId=` | All annotations for a document |
| `POST` | `/api/annotations` | Bulk replace — `{ documentId, annotations[] }` |
| `PATCH` | `/api/annotations/:id` | Update one annotation |
| `DELETE` | `/api/annotations/:id` | Delete one annotation |

### Comments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/comments?documentId=` | All comments for a document |
| `POST` | `/api/comments` | Create — `{ content, documentId, pageNumber, annotationId? }` |
| `PATCH` | `/api/comments/:id` | Resolve / update |
| `DELETE` | `/api/comments/:id` | Delete |

### Sharing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/share?token=` | Resolve a share link to its project and documents |
| `GET` | `/api/share?projectId=` or `?documentId=` | List existing links |
| `POST` | `/api/share` | Create — `{ projectId, documentId?, access, expiresAt? }` |
| `DELETE` | `/api/share/:id` | Revoke a link |

### Export

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/export?documentId=&token=` | Download a PDF with annotations embedded |

---

## Roadmap

- **Real-time collaboration** — live cursors and shared presence over WebSockets
- **Selection polish** — multi-select, group move, snap-to-grid
- **Version history** — diff two branches of a document side by side
- **Comment mentions and notifications** — `@user` with email digests
- **More export targets** — flattened PNG per page, annotation-only overlays
- **DOCX conversion without LibreOffice** — external conversion API behind the existing `convertDocxToPdfBuffer` signature, so serverless deployments regain DOCX support
- **Mobile and tablet editing** — touch-first toolbar, stylus pressure support
- **Accessibility pass** — full keyboard navigation of the canvas, screen-reader annotation summaries

---

## Contributing

Issues and pull requests are welcome. If you're picking up an open issue, a quick comment claiming it saves duplicate work. Keep changes focused, match the existing patterns, and run `npm run lint` before opening a PR.

## License

MIT
