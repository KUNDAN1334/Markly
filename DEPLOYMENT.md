# Deploying Markly (free tier)

Target architecture, all on permanently free plans:

| Layer | Service | Free allowance |
|---|---|---|
| App + API routes | Vercel Hobby | 100 GB bandwidth/mo |
| Postgres | Neon | 0.5 GB storage, 100 CU-hours/mo |
| PDF storage | Cloudflare R2 | 10 GB, zero egress |
| Auth | Firebase | already configured |

Total: **$0/month**, no trial clock.

---

## 1. Neon (database)

1. Sign up at <https://neon.tech> → create project `markly`, region closest to you.
2. Copy the **pooled** connection string (it contains `-pooler`). The pooled one
   matters: serverless functions open many short-lived connections and will
   exhaust a direct connection limit.
3. Run migrations against it from your machine:

   ```bash
   cd markly
   DATABASE_URL="<neon-pooled-url>" npx prisma migrate deploy
   ```

## 2. Cloudflare R2 (document storage)

1. Sign up at <https://dash.cloudflare.com> → **R2** → *Create bucket* → name it
   `markly-documents`. R2 asks for a card to activate even on the free tier; you
   are not charged under 10 GB.
2. **R2 → Manage API Tokens → Create API Token**, permission *Object Read & Write*,
   scoped to that bucket. Save the Access Key ID and Secret — the secret is shown once.
3. Copy your Account ID from the R2 overview page.
4. **Set bucket CORS** (Settings → CORS Policy). Without this the browser's direct
   `PUT` is blocked and every upload fails:

   ```json
   [
     {
       "AllowedOrigins": ["https://YOUR-APP.vercel.app", "http://localhost:3000"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Come back and add your real domain here after step 3.

## 3. Vercel (app)

1. <https://vercel.com> → *Add New Project* → import `KUNDAN1334/Markly`.
2. **Set the root directory to `markly`** — the repo root is one level above the app.
3. Add environment variables (all environments):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled URL |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (no trailing slash) |
   | `R2_ACCOUNT_ID` | from step 2 |
   | `R2_ACCESS_KEY_ID` | from step 2 |
   | `R2_SECRET_ACCESS_KEY` | from step 2 |
   | `R2_BUCKET` | `markly-documents` |
   | `DOCX_CONVERSION_ENABLED` | `false` |
   | `NEXT_PUBLIC_FIREBASE_*` | from your existing `.env.local` |
   | `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | from your existing `.env.local` |

   `FIREBASE_PRIVATE_KEY` must keep its `\n` escapes. Paste it wrapped in double
   quotes exactly as it appears locally.

4. Deploy.
5. **Firebase Console → Authentication → Settings → Authorized domains** → add
   `your-app.vercel.app`, or Google sign-in will fail with `auth/unauthorized-domain`.
6. Go back to R2 CORS and replace the placeholder origin with your real domain.

---

## How storage switching works

`lib/storage.ts` picks a driver from the environment:

- All four `R2_*` vars set → **R2**.
- Otherwise → **local disk** at `STORAGE_PATH`.

So `npm run dev` keeps working with no cloud credentials, and production uses R2
without any code branching at the call sites.

## How uploads work

PDFs never pass through the API:

```
browser → POST /api/documents/upload-url   (auth + project check, returns presigned PUT)
browser → PUT  https://<account>.r2.cloudflarestorage.com/...   (the actual bytes)
browser → POST /api/documents/upload       (JSON: { filename } → verifies object exists, writes DB row)
```

This exists because **Vercel caps serverless request bodies at 4.5 MB**. Streaming a
50 MB PDF through a function is impossible there, and wasteful everywhere else.

The server calls `fileExists()` before creating the row, so a client that lies
about a successful upload can't create an orphaned document record.

DOCX still uses the old multipart path because it needs server-side LibreOffice.
With `DOCX_CONVERSION_ENABLED=false` that path returns a clear 501 message
instead of crashing inside `spawn()`.

## Known free-tier limits

- **Neon** suspends compute after ~5 min idle; the next query wakes it in
  under a second. First request after a quiet period feels slightly slow.
- **Vercel** functions time out at 10 s on Hobby. PDF export on a very large
  annotated document could approach this — worth watching.
- **R2** free tier is 10 GB and 1 M writes/month.

## Restoring DOCX support later

Either move conversion to an external API (CloudConvert has a free monthly
allowance) behind the same `convertDocxToPdfBuffer` signature, or deploy the
container variant on a VM where LibreOffice is installed and set
`DOCX_CONVERSION_ENABLED=true`.
