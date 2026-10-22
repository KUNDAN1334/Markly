'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANDING_CSS } from '@/components/landing/landing-css';
import {
  GitHubIcon,
  LandingFooter,
  LandingNav,
  MoonIcon,
  REPO_URL,
  SunIcon,
  useTheme,
} from '@/components/landing/shared';

/* Images live in the README on GitHub — reused here so the post and the repo
   stay in sync without duplicating assets into /public. */
const IMG_EDITOR = 'https://github.com/user-attachments/assets/9d87d991-3dd4-4441-8a4c-e53eb806ea39';
const IMG_ARCHITECTURE = 'https://github.com/user-attachments/assets/eaf2b56f-562a-4292-92ca-a699bc785553';
const IMG_DATA_MODEL = 'https://github.com/user-attachments/assets/767b1dce-5f01-4427-bc1f-c4e0906d9ab9';

const USE_CASES = [
  { t: 'Students & contributors', d: 'Share a proposal, report, or thesis draft with a mentor and get inline comments back — without asking them to sign up for anything.' },
  { t: 'Design & product teams', d: 'Mark up mockups and specs where the feedback lives on the artwork, not in a disconnected comment thread.' },
  { t: 'Legal & contracts', d: 'Redline clauses visually and send a time-limited review link instead of a fifth email attachment.' },
  { t: 'Architects & engineers', d: 'Annotate plans and drawings at any zoom — marks stay pinned to document coordinates, not to the screen.' },
];

const HARD_PARTS = [
  {
    n: '01',
    t: 'Login-free review that is still secure',
    d: 'The obvious way to let anyone review a document is to loosen auth. I did the opposite and used two explicit authorization paths instead. Owners are resolved from `markly_session`, an HTTP-only Firebase session cookie verified server-side. Reviewers are resolved from the share-link token (an `x-share-token` header, or `?token=` on the PDF and export URLs the browser opens directly), which maps to a ShareLink row and is checked for expiry and for a ranked access level — VIEW < COMMENT < EDIT — against whatever the route requires. Every document-scoped route goes through one of those two paths, so there is no second, weaker auth system hiding behind the convenience.',
  },
  {
    n: '02',
    t: 'Uploads that do not choke a serverless function',
    d: 'Vercel caps serverless request bodies at 4.5 MB, and streaming a 50 MB PDF through a function is wasteful even where it is possible. So PDF bytes never touch an API route: the browser asks for a presigned URL, PUTs the file straight to Cloudflare R2, then posts back the filename. The server calls fileExists() before writing the database row, which is what stops a client from fabricating an orphaned document record.',
  },
  {
    n: '03',
    t: 'Exports that match the screen exactly',
    d: 'An annotation that lands in a different place in the exported PDF than it did in the editor is worse than no export at all. lib/fonts.ts is a single dependency-free registry shared by the canvas, the toolbar picker and the export route. Each font declares a CSS stack for the screen plus either a pdf-lib standard font or a file to embed. The export route re-implements the canvas text wrapping against the embedded font’s real metrics — which is why exported text breaks lines in exactly the same places.',
  },
  {
    n: '04',
    t: 'Feedback that never overwrites your original',
    d: 'When a reviewer sends their markup back, it branches into a hidden copy of the document and returns as a new link, rather than writing over what you had. Annotations live in the database as geometry and style JSON columns — the source file is never modified, so "the original" always means something.',
  },
];

const STACK = [
  ['Framework', 'Next.js 16 (App Router)'],
  ['UI', 'React 19 + Tailwind CSS v4'],
  ['Canvas', 'pdf.js + HTML Canvas 2D'],
  ['Export', 'pdf-lib + @pdf-lib/fontkit'],
  ['Auth', 'Firebase Auth + session cookies'],
  ['Data', 'PostgreSQL 16 + Prisma 7'],
  ['Storage', 'Cloudflare R2 (S3-compatible)'],
  ['State', 'Zustand + React state'],
];

export default function BlogPageClient() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => setIsAuthed(res.ok))
      .catch(() => setIsAuthed(false));
  }, []);

  /* Scroll reveals + reading-progress bar — same behaviour as the landing page. */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          el.style.transitionDelay = `${el.dataset.delay || 0}ms`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          io.unobserve(el);
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll<HTMLElement>('.lp-reveal').forEach((el) => io.observe(el));

    const onScroll = () => {
      const prog = document.querySelector<HTMLElement>('.lpv2-progress');
      if (!prog) return;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      prog.style.width = `${max > 0 ? ((h.scrollTop / max) * 100).toFixed(2) : 0}%`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      <style>{LANDING_CSS}</style>
      <style>{BLOG_CSS}</style>

      <div className="lpv2-root">
        <div className="lpv2-noise" aria-hidden="true" />
        <div className="lpv2-orb lpv2-orb-1" aria-hidden="true" />
        <div className="lpv2-progress" aria-hidden="true" />

        <LandingNav
          links={
            <>
              <li><a href="/#features">Features</a></li>
              <li><a href="/#how">How it works</a></li>
              <li><a href="/blog">Blog</a></li>
            </>
          }
          actions={
            <>
              <button type="button" onClick={toggle} aria-label="Toggle theme" className="lp-icon-btn">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-ghost lp-btn-sm">
                <GitHubIcon size={14} />
                GitHub
              </a>
              <button
                type="button"
                onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')}
                className="lp-btn lp-btn-primary lp-btn-sm"
              >
                {isAuthed ? 'Dashboard' : 'Get started free'}
              </button>
            </>
          }
        />

        <article className="blog-wrap">
          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <header className="blog-head">
            <a href="/" className="blog-back">← Back to Markly</a>
            
            <h1 className="blog-title">
              Why I built Markly
              <span className="blog-title-sub">— and how the review loop finally got fixed</span>
            </h1>
            <p className="blog-lede">
              Markly is a PDF annotation and async review platform I designed and built solo. It exists because I kept
              hitting the same wall myself: feedback that lives everywhere except on the document.
            </p>
            <div className="blog-meta">
              <span>Kundan</span>
              <span className="blog-dot" />
              <span>Solo build — design, frontend, backend, infra</span>
              <span className="blog-dot" />
              <span>10 min read</span>
            </div>
          </header>

          <figure className="blog-fig blog-fig-wide lp-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_EDITOR} alt="The Markly editor with hand-drawn annotations on a PDF" loading="lazy" />
            <figcaption>The editor — your document is the base layer, the canvas sits on top.</figcaption>
          </figure>

          {/* ── THE PROBLEM ─────────────────────────────────────────────── */}
          <section className="blog-section lp-reveal">
            <h2 className="blog-h2">The problem I owned end-to-end</h2>
            <p>
              During mid-review presentations and final project submissions, my team would review reports over email and
              WhatsApp — sending PDFs back and forth, discussing changes in messages that got completely disconnected
              from the actual document. Someone would say &ldquo;the second paragraph on page four is too dense&rdquo;
              and then everyone would spend a minute finding page four.
            </p>
            <p>
              I felt it again during my GSoC application days. As a contributor, I wanted a mentor to review my proposal,
              but there was no simple way to share it and get comments without making them sign up for something or
              install something. The feedback loop was always messy — and the friction always landed on the person doing
              me a favour.
            </p>
            <blockquote className="blog-quote">
              The tools that let you draw on a document lock reviewers into an account and a desktop install. The tools
              that are easy to share don&rsquo;t let you draw. I wanted the overlap.
            </blockquote>
            <p>
              Comment threads in Google Docs don&rsquo;t work for visual documents. Acrobat&rsquo;s annotation tools do,
              but they assume everyone in the loop is already a customer. Markly sits in between: real drawing tools on a
              real PDF, shared by URL.
            </p>
          </section>

          {/* ── WHAT I BUILT ────────────────────────────────────────────── */}
          <section className="blog-section lp-reveal">
            <h2 className="blog-h2">So I built exactly that</h2>
            <p>
              You upload a PDF, mark it up, and share a single link. The reviewer needs no account and no install. They
              can comment, draw, and even send their markup back with one click — which branches into a copy, so your
              original is never overwritten. When you&rsquo;re done, you export a flat PDF with every annotation baked
              into the bytes.
            </p>
            <ol className="blog-steps">
              <li><strong>Upload</strong> — drop a PDF (or a DOCX, converted server-side). Rendered with pdf.js, multi-page, high fidelity.</li>
              <li><strong>Annotate</strong> — eight tools: select, rectangle, circle, arrow, line, highlight, freehand, text. Virgil for the hand-drawn feel, plus a font picker.</li>
              <li><strong>Share</strong> — one link with VIEW, COMMENT or EDIT access, optionally time-limited. No account on the other end.</li>
              <li><strong>Export</strong> — a flat PDF with annotations embedded at the exact positions and fonts you saw on screen.</li>
            </ol>
          </section>

          {/* ── USE CASES ───────────────────────────────────────────────── */}
          <section className="blog-section lp-reveal">
            <h2 className="blog-h2">Who it&rsquo;s actually for</h2>
            <p>
              It started as my own problem, but the shape of it is common to anyone whose review loop currently lives in
              email attachments named <code>final_v3_REVISED.pdf</code>.
            </p>
            <div className="blog-cards">
              {USE_CASES.map((u) => (
                <div key={u.t} className="blog-card">
                  <h3>{u.t}</h3>
                  <p>{u.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── ARCHITECTURE ────────────────────────────────────────────── */}
          <section className="blog-section lp-reveal">
            <h2 className="blog-h2">How it&rsquo;s put together</h2>
            <p>
              One Next.js deployable holds the server components, the API routes and the editor. State splits cleanly:
              Zustand for the synchronous editor store (tools, history, viewport), and plain page-level React state for
              anything that comes from the server, kept fresh by debounced saves and a short poll. Storage is pluggable — <code>lib/storage.ts</code> picks local disk or Cloudflare R2
              from environment variables alone, so <code>npm run dev</code> works with zero cloud credentials.
            </p>
            <figure className="blog-fig lp-reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG_ARCHITECTURE} alt="Markly system architecture overview" loading="lazy" />
              <figcaption>System overview — client, API routes, storage and database.</figcaption>
            </figure>
            <div className="blog-stack">
              {STACK.map(([k, v]) => (
                <div key={k} className="blog-stack-row">
                  <span className="blog-stack-k">{k}</span>
                  <span className="blog-stack-v">{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── HARD PARTS ──────────────────────────────────────────────── */}
          <section className="blog-section lp-reveal">
            <h2 className="blog-h2">The parts that were actually hard</h2>
            <p>
              My role was everything — design, frontend, backend, infrastructure. These are the four problems I&rsquo;m
              most proud of solving, because none of them had a library I could just drop in.
            </p>
            <div className="blog-hard">
              {HARD_PARTS.map((h) => (
                <div key={h.n} className="blog-hard-item">
                  <div className="blog-hard-n">{h.n}</div>
                  <div>
                    <h3>{h.t}</h3>
                    <p>{h.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <figure className="blog-fig lp-reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG_DATA_MODEL} alt="Markly data model" loading="lazy" />
              <figcaption>
                The data model. Annotations store geometry and style as JSON columns, so a new tool type never needs a
                migration.
              </figcaption>
            </figure>
          </section>

          {/* ── IMPACT ──────────────────────────────────────────────────── */}
          <section className="blog-section lp-reveal">
            <h2 className="blog-h2">How I measure impact</h2>
            <p>
              It went from a personal frustration to a live, working product — deployed and usable end-to-end, running
              entirely on free-tier infrastructure. No paid service anywhere in the stack.
            </p>
            <p>
              But the real measure for me isn&rsquo;t the uptime or the bill. It&rsquo;s that Markly solves the exact
              review loop I struggled with in college and during GSoC, and that anyone facing that same problem can now
              use it without friction. That was the whole point: remove the friction from the person on the other end of
              the link.
            </p>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <section className="blog-section lp-reveal">
            <div className="lp-cta" style={{ padding: '56px 36px' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 className="lp-cta-title" style={{ fontSize: 'clamp(26px,3.4vw,38px)' }}>Try it on your own PDF.</h2>
                <p className="lp-cta-sub">
                  Markly is open source and MIT-licensed. Read the code, self-host it, or just upload something and share
                  a link.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')}
                    className="lp-btn lp-btn-lg lp-cta-primary"
                  >
                    {isAuthed ? 'Open dashboard' : 'Upload your first PDF — free'}
                  </button>
                  <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-lg lp-cta-ghost">
                    <GitHubIcon size={16} />
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          </section>
        </article>

        <LandingFooter />
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   STYLES — article typography layered on top of the landing tokens.
──────────────────────────────────────────────────────────────────────────── */
const BLOG_CSS = `
.blog-wrap { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 130px 28px 40px; }

.blog-back { display: inline-block; font-family: 'DM Mono', monospace; font-size: 12.5px; color: var(--text3); text-decoration: none; margin-bottom: 26px; transition: color .15s; }
.blog-back:hover { color: var(--text); }

.blog-head { margin-bottom: 46px; }
.blog-title { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(34px, 5.4vw, 58px); line-height: 1.05; letter-spacing: -.03em; color: var(--text); margin: 0 0 20px; }
.blog-title-sub { display: block; font-size: .52em; color: var(--text2); font-style: italic; letter-spacing: -.01em; margin-top: 12px; }
.blog-lede { font-size: 17px; line-height: 1.7; color: var(--text2); margin: 0 0 26px; }
.blog-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text3); padding-top: 22px; border-top: 1px solid var(--border); }
.blog-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text3); }

.blog-section { margin: 0 0 54px; }
.blog-h2 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(24px, 3.2vw, 34px); line-height: 1.15; letter-spacing: -.02em; color: var(--text); margin: 0 0 18px; }
.blog-section p { font-size: 16px; line-height: 1.78; color: var(--text2); margin: 0 0 18px; }
.blog-section code { font-family: 'DM Mono', monospace; font-size: .88em; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 1.5px 6px; color: var(--text); }

.blog-quote { margin: 28px 0; padding: 4px 0 4px 22px; border-left: 3px solid var(--gold); font-family: 'DM Serif Display', serif; font-size: 20px; line-height: 1.55; letter-spacing: -.01em; color: var(--text); font-style: italic; }

.blog-fig { margin: 34px 0; }
.blog-fig img { display: block; width: 100%; height: auto; border: 1px solid var(--border); border-radius: 16px; background: var(--card); box-shadow: var(--shMd); }
.blog-fig figcaption { font-family: 'DM Mono', monospace; font-size: 11.5px; color: var(--text3); text-align: center; margin-top: 12px; line-height: 1.6; }
.blog-fig-wide { margin: 8px 0 56px; }

.blog-steps { counter-reset: bs; list-style: none; margin: 24px 0 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.blog-steps li { counter-increment: bs; position: relative; padding: 16px 18px 16px 54px; border: 1px solid var(--border); border-radius: 14px; background: var(--card); font-size: 14.5px; line-height: 1.65; color: var(--text2); box-shadow: var(--shSm); }
.blog-steps li::before { content: counter(bs, decimal-leading-zero); position: absolute; left: 18px; top: 16px; font-family: 'DM Mono', monospace; font-size: 12px; color: var(--gold); }
.blog-steps strong { color: var(--text); font-weight: 600; }

.blog-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 24px; }
.blog-card { padding: 20px; border: 1px solid var(--border); border-radius: 16px; background: var(--card); box-shadow: var(--shSm); transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease; }
.blog-card:hover { transform: translateY(-3px); box-shadow: var(--shMd); }
.blog-card h3 { font-size: 15px; font-weight: 600; letter-spacing: -.01em; color: var(--text); margin: 0 0 8px; }
.blog-card p { font-size: 13.5px; line-height: 1.65; color: var(--text2); margin: 0; }

.blog-stack { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; margin-top: 28px; border-top: 1px solid var(--border); }
.blog-stack-row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; padding: 11px 2px; border-bottom: 1px solid var(--border); }
.blog-stack-k { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--text3); }
.blog-stack-v { font-size: 13px; color: var(--text); text-align: right; }

.blog-hard { display: flex; flex-direction: column; gap: 22px; margin-top: 26px; }
.blog-hard-item { display: flex; gap: 20px; padding: 22px 24px; border: 1px solid var(--border); border-radius: 18px; background: var(--card); box-shadow: var(--shSm); }
.blog-hard-n { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--gold); flex-shrink: 0; padding-top: 3px; }
.blog-hard-item h3 { font-size: 16.5px; font-weight: 600; letter-spacing: -.01em; color: var(--text); margin: 0 0 9px; }
.blog-hard-item p { font-size: 14.5px; line-height: 1.72; color: var(--text2); margin: 0; }

@media (max-width: 720px) {
  .blog-wrap { padding-top: 108px; }
  .blog-cards, .blog-stack { grid-template-columns: 1fr; }
  .blog-hard-item { flex-direction: column; gap: 10px; }
}
`;
