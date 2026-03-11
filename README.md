# Markly — Excalidraw for Documents

A production-quality MVP for web-based PDF annotation and review.

<img width="1699" height="907" alt="image" src="https://github.com/user-attachments/assets/3447e996-faed-4031-8eb7-2fc38615d9fb" />


## Features
- PDF Viewer (pdf.js, multi-page, zoom, thumbnails)
- Excalidraw-style annotation canvas (Rectangle, Circle, Arrow, Line, Highlight, Freehand, Text)
- Click anywhere to type text with custom color/font size
- Auto-save with debounce + manual save (Ctrl+S)
- Undo/Redo history (Ctrl+Z / Ctrl+Y)
- Comments sidebar with resolve/delete
- Share links: VIEW / COMMENT / EDIT access (no login required)
- Export annotated PDF via pdf-lib

## Tech Stack
- Next.js 15 + TypeScript + Tailwind CSS
- Zustand (editor state) + TanStack React Query (server state)
- pdf.js (rendering) + HTML Canvas (annotations)
- PostgreSQL + Prisma ORM
- pdf-lib (export)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure .env.local
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/markly"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STORAGE_PATH="./storage/documents"
```

### 3. Setup database
```bash
npx prisma generate
npx prisma db push
```

### 4. Create storage
```bash
mkdir -p storage/documents
```

### 5. Run
```bash
npm run dev
```

## URLs
- `/` — Dashboard
- `/editor/[documentId]` — Editor workspace  
- `/review/[token]` — Shared review link

## Keyboard Shortcuts
S=Select, R=Rectangle, C=Circle, A=Arrow, L=Line, H=Highlight, F=Freehand, T=Text  
Delete=Remove selected, Ctrl+Z=Undo, Ctrl+Y=Redo, Ctrl+S=Save


