<p align="center">
 <img width="1306" height="893" alt="image" src="https://github.com/user-attachments/assets/c282eb48-d48c-40d3-887d-6971d65f55f7" />


</p>

<h1 align="center">Markly</h1>
<p align="center"><strong>Excalidraw for Documents — Visual PDF annotation and async review for teams.</strong></p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#quickstart">Quickstart</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## What is Markly?

Markly is an open-source, self-hostable **PDF annotation and async document review platform**. Think Excalidraw — but instead of a blank canvas, your PDF is the base layer. Annotate freehand, draw shapes, highlight text, leave threaded comments, then share a review link with zero friction. No accounts required for reviewers.

Built for designers, lawyers, architects, product teams, and anyone who reviews documents professionally.

---

## Features

### Core Annotation Engine
- **7 annotation tools** — Rectangle, Circle, Arrow, Line, Highlight, Freehand, Text
- **Virgil font** — hand-drawn aesthetic, identical to Excalidraw
- **Click-to-type anywhere** on the document with custom color and font size
- **Multi-page navigation** with rendered page thumbnails sidebar
- **Zoom in/out** with annotations staying perfectly positioned

### Collaboration & Sharing
- **Zero-login review links** — share with `VIEW`, `COMMENT`, or `EDIT` access
- **Share-back flow** — reviewer can generate a new link to send annotations back
- **Threaded comments** — attach to specific annotations or pages, resolve inline
- **Real-time save indicator** — debounced autosave + manual `Ctrl+S`

### Data & Export
- **Full undo/redo history** — `Ctrl+Z` / `Ctrl+Y` across the entire session
- **Export annotated PDF** — annotations baked into the PDF via pdf-lib
- **Original file preserved** — source PDF always untouched

### Developer Experience
- DOCX uploads supported through server-side conversion to PDF
- Type-safe end-to-end with TypeScript
- REST API with documented endpoints
- Prisma schema for easy DB migrations
- Fully self-hostable — no external services required

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PDF Viewer  │  │  Annotation  │  │   Comments    │  │
│  │  (pdf.js)   │  │   Canvas     │  │   Sidebar     │  │
│  │             │  │ (HTML Canvas)│  │               │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                  │           │
│         └────────────────┴──────────────────┘           │
│                          │                              │
│               ┌──────────▼──────────┐                   │
│               │   Zustand Store     │                   │
│               │  (editor state)     │                   │
│               └──────────┬──────────┘                   │
│                          │ React Query                  │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────┐
│                    Next.js 15 App Router                 │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │  /api/     │  │  /api/     │  │  /api/             │ │
│  │  projects  │  │  documents │  │  annotations       │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │  /api/     │  │  /api/     │  │  /api/             │ │
│  │  comments  │  │  share     │  │  export            │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
│                          │                              │
│               ┌──────────▼──────────┐                   │
│               │    Prisma ORM       │                   │
└───────────────┴──────────┬──────────┴───────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
   ┌──────▼──────┐                  ┌───────▼──────┐
   │ PostgreSQL  │                  │  Filesystem  │
   │  Database   │                  │   Storage    │
   │             │                  │  (PDFs)      │
   └─────────────┘                  └──────────────┘
```

### Data Model

```
Project (1) ──────────── (N) Document
    │                           │
    │                    ┌──────┴──────┐
    │                    │             │
    │               Annotation     Comment
    │
    └────────────── (N) ShareLink
                         │
                    access: VIEW
                           COMMENT
                           EDIT
```

### Request Flow — Annotation Save

```
User draws annotation
        │
        ▼
AnnotationCanvas.onChange()
        │
        ▼
Zustand store.pushHistory()   ←── enables undo/redo
        │
        ▼
debounce(1500ms)
        │
        ▼
POST /api/annotations
{ documentId, annotations[] }  ←── replaces all annotations for doc
        │
        ▼
Prisma: deleteMany + createMany
        │
        ▼
✓ saved indicator
```

### Request Flow — Share Link

```
Editor: "Share" button
        │
        ▼
POST /api/share
{ projectId, access: "EDIT" }
        │
        ▼
Generate cuid token
Store ShareLink in DB
        │
        ▼
Return: { token, access }
        │
        ▼
/review/[token]  ←── shareable URL

Reviewer opens link
        │
        ▼
GET /api/share?token=...
        │
        ▼
Resolve project + documents
+ annotations + comments + shareLinks
        │
        ▼
Render review page with access badge:
  VIEW    → read-only canvas, no toolbar
  COMMENT → read-only canvas + comments sidebar
  EDIT    → full toolbar + annotation canvas + save + "Share back →"
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | RSC + API routes in one repo |
| Language | TypeScript 5 | End-to-end type safety |
| Styling | Tailwind CSS v4 + CSS Variables | Design tokens, dark mode |
| State | Zustand | Lightweight editor state |
| Server State | TanStack React Query | Cache, sync, loading states |
| PDF Render | pdf.js v5 | Best-in-class PDF rendering |
| Annotation | HTML Canvas API | Full control, no dependencies |
| Hand-drawn Font | Virgil (Excalidraw) | Sketch-like text aesthetic |
| DB ORM | Prisma v7 | Type-safe queries, easy migrations |
| Database | PostgreSQL 16 | Relational, JSON columns for geometry |
| PDF Export | pdf-lib | Embed annotations into PDF bytes |
| Validation | Zod v4 | Runtime schema validation |
| Storage | Local filesystem | Simple, self-hosted first |

---

## Quickstart

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally or via Docker
- Git
- LibreOffice on the server if you want DOCX uploads

### 1. Clone

```bash
git clone https://github.com/your-org/markly.git
cd markly
```

### 2. Install

```bash
npm install
```

### 3. Environment

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/markly"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Storage — path to store uploaded PDFs
STORAGE_PATH="./storage/documents"
LIBREOFFICE_PATH="C:\\Program Files\\LibreOffice\\program\\soffice.exe"
```

> DOCX uploads are converted to PDF on the server for review. End users do not need LibreOffice installed.

> **Using Docker for Postgres?**
> ```bash
> docker run -d \
>   --name markly-db \
>   -e POSTGRES_DB=markly \
>   -e POSTGRES_USER=postgres \
>   -e POSTGRES_PASSWORD=password \
>   -p 5432:5432 \
>   postgres:16
> ```
> Then set `DATABASE_URL="postgresql://postgres:password@localhost:5432/markly"`

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to DB (creates all tables)
npx prisma db push
```

### 5. Storage Directory

```bash
mkdir -p storage/documents
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
markly/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── dashboard/
│   │   └── page.tsx              # Project dashboard
│   ├── editor/
│   │   └── [documentId]/
│   │       └── page.tsx          # Full annotation editor
│   ├── review/
│   │   └── [token]/
│   │       └── page.tsx          # Shared review link
│   └── api/
│       ├── projects/             # GET, POST projects
│       │   └── [id]/             # GET, DELETE by ID
│       ├── documents/
│       │   ├── upload/           # POST — upload PDF
│       │   ├── file/[filename]/  # GET — serve PDF bytes
│       │   └── [id]/             # GET, DELETE
│       ├── annotations/          # GET, POST (bulk replace)
│       │   └── [id]/             # PATCH, DELETE
│       ├── comments/             # GET, POST
│       │   └── [id]/             # PATCH (resolve), DELETE
│       ├── share/                # GET by token, POST create link
│       └── export/               # GET — render annotated PDF
│
├── components/
│   ├── editor/
│   │   ├── PDFViewer.tsx         # pdf.js renderer
│   │   ├── AnnotationCanvas.tsx  # HTML Canvas engine
│   │   ├── Toolbar.tsx           # Tool selector + controls
│   │   └── PageThumbnails.tsx    # Sidebar thumbnails
│   ├── comments/
│   │   └── CommentsSidebar.tsx   # Threaded comments
│   ├── documents/
│   │   └── UploadZone.tsx        # Drag & drop upload
│   └── sharing/
│       └── ShareModal.tsx        # Generate share links
│
├── lib/
│   ├── store.ts                  # Zustand editor store
│   ├── prisma.ts                 # Prisma singleton
│   ├── storage.ts                # File I/O abstraction
│   └── utils.ts                  # cn(), debounce(), generateToken()
│
├── prisma/
│   └── schema.prisma             # DB schema
├── prisma.config.ts              # Prisma v7 config
└── public/
    └── pdf.worker.min.mjs        # pdf.js worker (copied from node_modules)
```

---

## API Reference

All endpoints return JSON. Errors follow `{ error: string }`.

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create project `{ name }` |
| `GET` | `/api/projects/:id` | Get project with documents |
| `DELETE` | `/api/projects/:id` | Delete project + all data |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload PDF or DOCX (multipart, 50MB max) |
| `GET` | `/api/documents/file/:filename` | Serve review PDF file bytes |
| `GET` | `/api/documents/:id` | Get document metadata |
| `DELETE` | `/api/documents/:id` | Delete document + annotations |

### Annotations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/annotations?documentId=` | Get all annotations for a document |
| `POST` | `/api/annotations` | Bulk replace `{ documentId, annotations[] }` |
| `PATCH` | `/api/annotations/:id` | Update single annotation |
| `DELETE` | `/api/annotations/:id` | Delete single annotation |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/comments?documentId=` | Get all comments |
| `POST` | `/api/comments` | Create `{ content, documentId, pageNumber, annotationId? }` |
| `PATCH` | `/api/comments/:id` | Resolve `{ resolved: bool }` |
| `DELETE` | `/api/comments/:id` | Delete comment |

### Share Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/share?token=` | Resolve share link + full project data |
| `GET` | `/api/share?projectId=` | List share links for a project |
| `POST` | `/api/share` | Create `{ projectId, access: VIEW\|COMMENT\|EDIT }` |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/export?documentId=` | Download PDF with annotations baked in |

---

## Database Schema

```prisma
model Project {
  id         String      @id @default(cuid())
  name       String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  documents  Document[]
  shareLinks ShareLink[]
}

model Document {
  id           String       @id @default(cuid())
  filename     String       // UUID filename on disk
  originalName String       // Original upload filename
  mimeType     String
  size         Int
  path         String
  projectId    String
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  annotations  Annotation[]
  comments     Comment[]
}

model Annotation {
  id         String   @id @default(cuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  pageNumber Int
  type       String   // rect | circle | arrow | line | highlight | freehand | text
  geometry   Json     // { x, y, width, height, points[], ... }
  style      Json     // { color, strokeWidth, opacity, fontSize, ... }
  content    String?  // text content for text annotations
  createdAt  DateTime @default(now())
}

model Comment {
  id           String    @id @default(cuid())
  content      String
  documentId   String
  document     Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  annotationId String?
  pageNumber   Int
  resolved     Boolean   @default(false)
  createdAt    DateTime  @default(now())
}

model ShareLink {
  id        String     @id @default(cuid())
  token     String     @unique @default(cuid())
  projectId String
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  access    AccessType
  createdAt DateTime   @default(now())
  expiresAt DateTime?
}

enum AccessType {
  VIEW
  COMMENT
  EDIT
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `S` | Select tool |
| `R` | Rectangle |
| `C` | Circle |
| `A` | Arrow |
| `L` | Line |
| `H` | Highlight |
| `F` | Freehand |
| `T` | Text |
| `Delete` / `Backspace` | Remove selected annotation |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Manual save |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |

---

## Deployment

### Vercel + Neon (Recommended for SaaS)

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Create a Postgres DB on [neon.tech](https://neon.tech) (free tier available)
4. Add environment variables in Vercel dashboard:

```env
DATABASE_URL=postgresql://...   # from Neon
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
STORAGE_PATH=/tmp               # use object storage for production (see below)
LIBREOFFICE_PATH=/usr/bin/soffice
```

5. Deploy

> **Note:** For production, replace local filesystem storage with S3 or R2. Update `lib/storage.ts` to use `@aws-sdk/client-s3` or Cloudflare R2.
>
> **DOCX note:** LibreOffice is only required on the server if you want DOCX uploads. PDF uploads do not depend on it.

### Docker (Self-hosted)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/markly
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      STORAGE_PATH: /app/storage/documents
    volumes:
      - ./storage:/app/storage
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: markly
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
docker-compose exec app npx prisma db push
```

### Railway

```bash
railway login
railway init
railway add postgresql
railway up
```

Set `DATABASE_URL` from Railway's Postgres plugin. Done.

---

## Configuration

### Storage Backends

By default, Markly stores PDFs on the local filesystem. For production SaaS, swap `lib/storage.ts`:

**Cloudflare R2 (recommended — S3-compatible, free egress)**
```bash
npm install @aws-sdk/client-s3
```

**AWS S3**
```bash
npm install @aws-sdk/client-s3
```

**Uploadthing** — drop-in Next.js file upload service

### Share Link Expiry

Share links support optional expiry. Pass `expiresAt` when creating:

```json
POST /api/share
{
  "projectId": "clx...",
  "access": "VIEW",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

---

## Roadmap

### v1.1 — Real-time
- [ ] WebSocket / SSE for live collaborative annotation
- [ ] Presence indicators (see who's viewing)
- [ ] Optimistic UI updates

### v1.2 — Auth & Teams
- [ ] Auth.js integration (email magic link + OAuth)
- [ ] Team workspaces with member roles
- [ ] Audit log for enterprise compliance

### v1.3 — Power Features
- [ ] AI-powered annotation suggestions (Claude API)
- [ ] Version history — annotate multiple PDF versions
- [ ] Bulk export (ZIP of annotated PDFs)
- [ ] Webhook integrations (Slack, Notion, Linear)

### v2.0 — Platform
- [ ] Public API with API keys
- [ ] Zapier / Make integration
- [ ] White-label / custom domain support
- [ ] Usage analytics dashboard

---

## Contributing

```bash
# Fork and clone
git clone https://github.com/your-org/markly.git

# Create feature branch
git checkout -b feat/your-feature

# Install and run
npm install && npm run dev

# Run type check
npx tsc --noEmit

# Submit PR against main
```

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  Built with ❤️ · <a href="https://markly.app">markly.app</a> · <a href="https://twitter.com/marklyapp">@marklyapp</a>
</p>
