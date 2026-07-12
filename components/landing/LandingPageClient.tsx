'use client';

import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PricingPlan } from '@/types';
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const saved = (localStorage.getItem('markly-theme') as 'light' | 'dark') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('markly-theme', next);
  }
  return { theme, toggle };
}

/* LOGO COMPONENT (Option D - stacked docs + red checkmark) */
function MarklyLogo({ size = 36, forDark = false }: { size?: number; forDark?: boolean }) {
  const c = forDark ? '#f4f4f0' : '#0d0d0c';
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 38 42" fill="none">
      <rect x="8" y="6" width="24" height="30" rx="2" fill="none" stroke={c} strokeWidth="1.4" opacity="0.2"/>
      <rect x="5" y="4" width="24" height="30" rx="2" fill="none" stroke={c} strokeWidth="1.4" opacity="0.45"/>
      <rect x="2" y="2" width="24" height="30" rx="2" fill="none" stroke={c} strokeWidth="1.6"/>
      <path d="M7 10 L20 10" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
      <path d="M7 14 L18 14" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
      <path d="M7 18 L20 18" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
      <path d="M6 25 L10 29 L18 21" stroke="#e74c3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

type LandingPageClientProps = {
  initialIsAuthed: boolean;
};

type Testimonial = {
  q: string;
  name: string;
  role: string;
};

type WorkflowStep = {
  n: string;
  t: string;
  d: string;
  meta: string;
  icon: 'upload' | 'annotate' | 'share' | 'export';
};

type FeatureItem = {
  t: string;
  d: string;
  icon: ReactNode;
};

const workflowSteps: WorkflowStep[] = [
  {
    n: '01',
    t: 'Upload your PDF',
    d: 'Drag and drop any PDF. Rendered with pdf.js - multi-page, high-fidelity, instant.',
    meta: 'Drop file',
    icon: 'upload',
  },
  {
    n: '02',
    t: 'Annotate visually',
    d: 'Draw shapes, write with Virgil font, highlight sections - hand-drawn feel on every mark.',
    meta: 'Mark clearly',
    icon: 'annotate',
  },
  {
    n: '03',
    t: 'Share the link',
    d: 'Send a secure link. Your reviewer opens it instantly - no account, no download needed.',
    meta: 'Send review',
    icon: 'share',
  },
  {
    n: '04',
    t: 'Export & close',
    d: 'Download the annotated PDF for your records. Clean, professional, ready to archive.',
    meta: 'Deliver final',
    icon: 'export',
  },
];

const featureItems: FeatureItem[] = [
  {
    t: 'Hand-drawn annotations',
    d: 'Excalidraw-style shapes with Virgil font - sketch-like text and doodles that feel natural.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    t: 'Multi-page PDF support',
    d: 'Navigate long documents with page thumbnails. Annotations stay perfectly positioned at any zoom.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    t: 'One-click sharing',
    d: 'No accounts needed. Share a link with view, comment, or edit access - works instantly.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    t: 'Threaded comments',
    d: 'Attach comments to specific annotations or pages. Resolve, reply, and track feedback inline.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    t: 'Auto-save & undo/redo',
    d: 'Debounce autosave + full history. Ctrl+Z / Ctrl+Y work just like Excalidraw.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    t: 'Export annotated PDF',
    d: 'Download the final PDF with all annotations baked in. Original file stays untouched.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

function StepIcon({ icon }: { icon: WorkflowStep['icon'] }) {
  if (icon === 'upload') {
    return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    );
  }

  if (icon === 'annotate') {
    return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4l10-10a2.12 2.12 0 0 0-3-3L5 17v3Z" />
        <path d="m13.5 6.5 3 3" />
      </svg>
    );
  }

  if (icon === 'share') {
    return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 5h5v5" />
        <path d="m10 14 9-9" />
        <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12.5 10 16.5 18 7.5" />
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    </svg>
  );
}

function HowItWorksHoverGrid({ steps }: { steps: WorkflowStep[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [highlightStyle, setHighlightStyle] = useState<CSSProperties>({
    opacity: 0,
    transform: 'translate3d(0, 0, 0)',
  });

  function syncHighlight(index: number | null) {
    if (index === null) {
      setHighlightStyle((current) => ({ ...current, opacity: 0 }));
      return;
    }

    const container = containerRef.current;
    const card = cardRefs.current[index];
    if (!container || !card) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    setHighlightStyle({
      width: `${cardRect.width}px`,
      height: `${cardRect.height}px`,
      transform: `translate3d(${cardRect.left - containerRect.left}px, ${cardRect.top - containerRect.top}px, 0)`,
      opacity: 1,
    });
  }

  useEffect(() => {
    syncHighlight(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    function handleResize() {
      syncHighlight(activeIndex);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="steps-hover-grid" onMouseLeave={() => setActiveIndex(null)}>
      <div className="steps-hover-bg" style={highlightStyle} aria-hidden="true" />
      {steps.map((step, index) => (
        <div
          key={step.n}
          ref={(node) => {
            cardRefs.current[index] = node;
          }}
          className={`step-card${activeIndex === index ? ' is-active' : ''}`}
          onMouseEnter={() => setActiveIndex(index)}
          onFocus={() => setActiveIndex(index)}
          onBlur={() => setActiveIndex(null)}
          tabIndex={0}
        >
          <div className="step-card-top">
            <div className="step-icon-shell">
              <StepIcon icon={step.icon} />
            </div>
            <div className="step-meta">{step.meta}</div>
          </div>
          <div className="step-num">{step.n}</div>
          <div className="step-title">{step.t}</div>
          <div className="step-desc">{step.d}</div>
        </div>
      ))}
    </div>
  );
}

type CardTint = { x: number; y: number; rotate: number; z: number; tintA: string; tintB: string; accent: string };

const notebookCardLayout: CardTint[] = [
  { x: 12, y: 52, rotate: -16, z: 1, tintA: '#fff9f0', tintB: '#f7ecd9', accent: '#c9a876' }, // warm gold
  { x: 27, y: 72, rotate: -9, z: 2, tintA: '#f3faf6', tintB: '#e6f2ec', accent: '#7fb69a' }, // sage
  { x: 42, y: 46, rotate: -3, z: 3, tintA: '#f2f7fc', tintB: '#e4edf9', accent: '#7c96c2' }, // dusty blue
  { x: 58, y: 70, rotate: 4, z: 4, tintA: '#fdf3f3', tintB: '#f8e6e6', accent: '#d98a7f' }, // blush
  { x: 73, y: 58, rotate: 11, z: 5, tintA: '#f8f5fc', tintB: '#efe6f8', accent: '#a888c9' }, // lavender
  { x: 88, y: 78, rotate: 17, z: 6, tintA: '#fffaf0', tintB: '#fbe8cd', accent: '#d1a44f' }, // amber
];

function NotebookFeatures({ items }: { items: FeatureItem[] }) {
  return (
    <div className="notebook-fan">
      {items.map((item, index) => {
        const layout = notebookCardLayout[index];
        return (
          <article
            key={item.t}
            className="notebook-card"
            style={
              {
                '--card-x': `${layout?.x ?? 0}%`,
                '--card-y': `${layout?.y ?? 60}px`,
                '--card-rotate': `${layout?.rotate ?? 0}deg`,
                '--card-z': layout?.z ?? index + 1,
                '--card-tint-a': layout?.tintA ?? '#ffffff',
                '--card-tint-b': layout?.tintB ?? '#f6f6f6',
                '--card-accent': layout?.accent ?? '#111111',
              } as CSSProperties
            }
          >
            <div className="notebook-card-inner">
              <div className="notebook-rings" aria-hidden="true">
                {Array.from({ length: 7 }).map((_, ringIndex) => (
                  <span key={ringIndex} className="notebook-ring" />
                ))}
              </div>

              <div className="notebook-page-number">0{index + 1}</div>
              <div className="notebook-icon">{item.icon}</div>
              <h3 className="notebook-title">{item.t}</h3>
              <p className="notebook-copy">{item.d}</p>
              <div className="notebook-rule-stack" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.name
    .split(' ')
    .map((part) => part[0])
    .join('');

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 16;
    const rotateX = (0.5 - py) * 14;

    card.dataset.active = 'true';
    card.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
    card.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
    card.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
  }

  function resetTilt(event: MouseEvent<HTMLDivElement>) {
    const card = event.currentTarget;
    card.dataset.active = 'false';
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--mx', '50%');
    card.style.setProperty('--my', '50%');
  }

  return (
    <div className="testi-card-wrap">
      <div
        className="testi-card"
        data-active="false"
        onMouseMove={handlePointerMove}
        onMouseLeave={resetTilt}
        onMouseEnter={handlePointerMove}
      >
        <div className="testi-card-inner">
          <div className="testi-stars testi-layer-sm">
            {[...Array(5)].map((_, index) => (
              <span key={index} className="testi-star">&#9733;</span>
            ))}
          </div>
          <div className="testi-quote testi-layer-lg">{testimonial.q}</div>
          <div className="testi-author testi-layer-md">
            <div className="testi-avatar">{initials}</div>
            <div>
              <div className="testi-name">{testimonial.name}</div>
              <div className="testi-role">{testimonial.role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPageClient({ initialIsAuthed }: LandingPageClientProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [isAuthed, setIsAuthed] = useState(initialIsAuthed);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => setIsAuthed(res.ok))
      .catch(() => setIsAuthed(false));

    fetch('/api/pricing/plans')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load pricing');
        return res.json();
      })
      .then((data: PricingPlan[]) => setPricingPlans(data))
      .catch(() => setPricingPlans([]));
  }, []);
  useEffect(() => {
    const root = mockupRef.current;
    if (!root) return;

    // ── element refs ──────────────────────────────────────────────────────────
    const canvas  = root.querySelector<HTMLElement>('.mkly-canvas')!;
    const body = root.querySelector<HTMLElement>('.mkly-body')!;
    const world   = root.querySelector<HTMLElement>('.mkly-world')!;
    const pdfPage = root.querySelector<HTMLElement>('.mkly-pdf')!;
    const curEl   = root.querySelector<HTMLElement>('.mkly-cur')!;
    const expBtn  = root.querySelector<HTMLElement>('.mkly-exp')!;
    const tbs: Record<string, HTMLElement> = {
      arrow: root.querySelector<HTMLElement>('.mkly-tb-arrow')!,
      text:  root.querySelector<HTMLElement>('.mkly-tb-text')!,
      rect:  root.querySelector<HTMLElement>('.mkly-tb-rect')!,
    };
    const r1  = root.querySelector<SVGRectElement>('.mkly-r1')!;
    const r2  = root.querySelector<SVGRectElement>('.mkly-r2')!;
    const hl  = root.querySelector<SVGRectElement>('.mkly-hl')!;
    const tx1 = root.querySelector<SVGTextElement>('.mkly-tx1')!;
    const tx2 = root.querySelector<SVGTextElement>('.mkly-tx2')!;

    // ── state ─────────────────────────────────────────────────────────────────
    let S=1, Tx=0, Ty=0, tS=1, tTx=0, tTy=0, lerpId: number|null = null;
    let cX=0, cY=0;
    const tmrs: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    let stopped = false;

    function kill() {
      stopped = true;
      tmrs.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame);
      tmrs.length = 0; rafs.length = 0;
      if (lerpId) { cancelAnimationFrame(lerpId); lerpId = null; }
    }
    const wait = (ms: number) => new Promise<void>(res => {
      if (stopped) return; tmrs.push(setTimeout(res, ms));
    });
    const eio = (t: number) => t < .5 ? 2*t*t : -1 + (4 - 2*t)*t;
    const eo3 = (t: number) => 1 - Math.pow(1 - t, 3);

    function applyT() { world.style.transform = `matrix(${S},0,0,${S},${Tx},${Ty})`; }
    function lerpTick() {
      if (stopped) return;
      S  += (tS  - S)  * .09;
      Tx += (tTx - Tx) * .09;
      Ty += (tTy - Ty) * .09;
      applyT();
      if (Math.abs(tS-S) > .0002 || Math.abs(tTx-Tx) > .04 || Math.abs(tTy-Ty) > .04)
        lerpId = requestAnimationFrame(lerpTick);
      else { S=tS; Tx=tTx; Ty=tTy; applyT(); lerpId=null; }
    }
    function startLerp() { if (!lerpId && !stopped) lerpId = requestAnimationFrame(lerpTick); }

    // coords are canvas-relative (canvas = .mkly-canvas = the zoomable area)
    function setCur(x: number, y: number) { cX=x; cY=y; curEl.style.left=x+'px'; curEl.style.top=y+'px'; }

    function elC(el: Element) {
      const er = el.getBoundingClientRect(), br = body.getBoundingClientRect();
      return { x: er.left - br.left + er.width/2, y: er.top - br.top + er.height/2 };
    }
    function elCtl(el: Element) {
      const er = el.getBoundingClientRect(), br = body.getBoundingClientRect();
      return { x: er.left - br.left, y: er.top - br.top };
    }
    function elWorld(el: Element) {
      const er = el.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      const vx = er.left - cr.left, vy = er.top - cr.top;
      return { x: (vx-Tx)/S, y: (vy-Ty)/S, w: er.width/S, h: er.height/S };
    }
    // world → canvas px (canvas IS the viewport here, no offset needed)
    function w2c(wx: number, wy: number) {
      const cr = canvas.getBoundingClientRect(), br = body.getBoundingClientRect();
      const offX = cr.left - br.left, offY = cr.top - br.top;
      return { x: wx*S + Tx + offX, y: wy*S + Ty + offY };
    }

    function setTool(n: string|null) {
      Object.values(tbs).forEach(b => { b.style.background='transparent'; b.style.color='var(--text-3)'; });
      if (n && tbs[n]) { tbs[n].style.background='var(--accent)'; tbs[n].style.color='var(--accent-fg)'; }
    }

    function moveCur(tx: number, ty: number, dur: number, opts: { zoomInScale?: number; zoomOutFirst?: boolean } = {}): Promise<void> {
      return new Promise(resolve => {
        if (stopped) { resolve(); return; }
        const { zoomInScale, zoomOutFirst } = opts;
        const fx=cX, fy=cY, st=Date.now();
        if (zoomOutFirst) { tS=1; tTx=0; tTy=0; startLerp(); }
        function tick() {
          if (stopped) { resolve(); return; }
          const t = Math.min((Date.now()-st)/dur, 1), e = eio(t);
          setCur(fx + (tx-fx)*e, fy + (ty-fy)*e);
          if (zoomInScale !== undefined && t > 0.7) {
            const zs = (zoomOutFirst ? 1 : S) + (zoomInScale - (zoomOutFirst ? 1 : S)) * eo3((t-0.7)/0.3);
            const wx2=(tx-Tx)/S, wy2=(ty-Ty)/S;
            tS=zs; tTx=tx-wx2*zs; tTy=ty-wy2*zs; startLerp();
          }
          if (t < 1) rafs.push(requestAnimationFrame(tick)); else { setCur(tx,ty); resolve(); }
        }
        tick();
      });
    }

    function dragRect(el: SVGRectElement, wx: number, wy: number, rW: number, rH: number, dur: number): Promise<void> {
      return new Promise(resolve => {
        if (stopped) { resolve(); return; }
        el.setAttribute('x', String(wx)); el.setAttribute('y', String(wy));
        el.setAttribute('width', '0'); el.setAttribute('height', '0'); el.setAttribute('opacity', '1');
        const sb = w2c(wx, wy); setCur(sb.x, sb.y);
        const dz = tS*1.06;
        tS=dz; tTx=sb.x - ((sb.x-Tx)/S)*dz; tTy=sb.y - ((sb.y-Ty)/S)*dz; startLerp();
        const st = Date.now();
        function tick() {
          if (stopped) { resolve(); return; }
          const t = Math.min((Date.now()-st)/dur, 1), e = eo3(t);
          el.setAttribute('width', String(rW*e)); el.setAttribute('height', String(rH*e));
          const nb = w2c(wx+rW*e, wy+rH*e); setCur(nb.x, nb.y);
          if (t < 1) rafs.push(requestAnimationFrame(tick)); else resolve();
        }
        tick();
      });
    }

    function growHl(el: SVGRectElement, wx: number, wy: number, maxW: number, dur: number): Promise<void> {
      return new Promise(resolve => {
        if (stopped) { resolve(); return; }
        el.setAttribute('x', String(wx)); el.setAttribute('y', String(wy));
        el.setAttribute('width', '0'); el.setAttribute('opacity', '.42');
        const hc = w2c(wx+maxW/2, wy), hz = tS*1.05;
        tS=hz; tTx=hc.x - ((hc.x-Tx)/S)*hz; tTy=hc.y - ((hc.y-Ty)/S)*hz; startLerp();
        const st = Date.now();
        function tick() {
          if (stopped) { resolve(); return; }
          el.setAttribute('width', String(maxW * eo3(Math.min((Date.now()-st)/dur, 1))));
          if (Date.now()-st < dur) rafs.push(requestAnimationFrame(tick)); else resolve();
        }
        tick();
      });
    }

    function typeText(el: SVGTextElement, wx: number, wy: number, text: string, dur: number): Promise<void> {
      return new Promise(resolve => {
        if (stopped) { resolve(); return; }
        el.setAttribute('x', String(wx)); el.setAttribute('y', String(wy));
        el.setAttribute('opacity', '1'); el.textContent = '';
        const tc = w2c(wx, wy), tz = tS*1.06;
        tS=tz; tTx=tc.x - ((tc.x-Tx)/S)*tz; tTy=tc.y - ((tc.y-Ty)/S)*tz; startLerp();
        const chars = text.split(''); let i = 0;
        function next() {
          if (stopped) { resolve(); return; }
          el.textContent += chars[i++] ?? '';
          if (i < chars.length) tmrs.push(setTimeout(next, dur/chars.length)); else resolve();
        }
        next();
      });
    }

    function waitLerp(): Promise<void> {
      return new Promise(resolve => {
        function check() { if (!lerpId || stopped) resolve(); else tmrs.push(setTimeout(check, 30)); }
        check();
      });
    }

    async function run() {
      if (stopped) return;
      stopped = false;
      [r1,r2].forEach(e => { e.setAttribute('opacity','0'); e.setAttribute('width','0'); e.setAttribute('height','0'); });
      hl.setAttribute('opacity','0'); hl.setAttribute('width','0');
      tx1.setAttribute('opacity','0'); tx1.textContent = '';
      tx2.setAttribute('opacity','0'); tx2.textContent = '';
      S=1; Tx=0; Ty=0; tS=1; tTx=0; tTy=0; applyT();
      setTool(null);
      expBtn.style.cssText = '';

      const vpW = canvas.offsetWidth, vpH = canvas.offsetHeight;
      const pgW = pdfPage.offsetWidth, pgH = pdfPage.scrollHeight || 280;
      pdfPage.style.left = Math.round((vpW-pgW)/2) + 'px';
      pdfPage.style.top  = Math.round((vpH-pgH)/2 - 10) + 'px';

      await new Promise<void>(res => { rafs.push(requestAnimationFrame(() => rafs.push(requestAnimationFrame(() => res())))); });

      const pfCtl = elCtl(pdfPage);
      setCur(pfCtl.x + pdfPage.offsetWidth + 10, pfCtl.y + pgH - 10);
      await wait(400);

      // 1. rect tool
      await moveCur(elC(tbs.rect).x, elC(tbs.rect).y, 850);
      await wait(120); setTool('rect'); await wait(300);

      // 2. arrive on PDF → zoom in
      await moveCur(elC(root.querySelector('.mkly-ln0')!).x, elC(root.querySelector('.mkly-ln0')!).y, 1100, { zoomInScale: 1.28 });
      await waitLerp(); await wait(300);

      // 3. draw red rect
      const ln0w = elWorld(root.querySelector('.mkly-ln0')!);
      const ln1w = elWorld(root.querySelector('.mkly-ln1')!);
      const rX=ln0w.x-2, rY=ln0w.y-2, rW=Math.max(ln0w.w,ln1w.w)+4, rH=(ln1w.y+ln1w.h)-ln0w.y+4;
      await moveCur(w2c(rX,rY).x, w2c(rX,rY).y, 650); await wait(100);
      await dragRect(r1, rX, rY, rW, rH, 1200); await wait(250);

      // 4. text tool → zoom out
      await moveCur(elC(tbs.text).x, elC(tbs.text).y, 850, { zoomOutFirst: true });
      await waitLerp(); await wait(140); setTool('text'); await wait(300);

      // 5. type "Review this!"
      await moveCur(w2c(rX,rY-3).x, w2c(rX,rY-3).y, 900, { zoomInScale: 1.32 });
      await waitLerp(); await wait(130);
      await typeText(tx1, rX, rY-3, 'Review this!', 720); await wait(350);

      // 6. highlight ln3
      setTool('arrow'); await wait(80);
      const ln3w = elWorld(root.querySelector('.mkly-ln3')!);
      const hlX=ln3w.x, hlY=ln3w.y+(ln3w.h-7)/2;
      await moveCur(w2c(hlX+ln3w.w*.3,hlY).x, w2c(hlX+ln3w.w*.3,hlY).y, 1000, { zoomInScale: 1.25, zoomOutFirst: true });
      await waitLerp(); await wait(140);
      await growHl(hl, hlX, hlY, ln3w.w, 680); await wait(300);

      // 7. rect tool → zoom out
      await moveCur(elC(tbs.rect).x, elC(tbs.rect).y, 820, { zoomOutFirst: true });
      await waitLerp(); await wait(140); setTool('rect'); await wait(300);

      // 8. draw green rect
      const ln5w = elWorld(root.querySelector('.mkly-ln5')!);
      const ln6w = elWorld(root.querySelector('.mkly-ln6')!);
      const g2X=ln5w.x+ln5w.w*.42, g2Y=ln5w.y-2, g2W=ln5w.w*.55, g2H=(ln6w.y+ln6w.h)-ln5w.y+4;
      await moveCur(w2c(g2X,g2Y).x, w2c(g2X,g2Y).y, 950, { zoomInScale: 1.28 });
      await waitLerp(); await wait(110);
      await dragRect(r2, g2X, g2Y, g2W, g2H, 1000); await wait(220);

      // 9. text tool → zoom out
      await moveCur(elC(tbs.text).x, elC(tbs.text).y, 780, { zoomOutFirst: true });
      await waitLerp(); await wait(130); setTool('text'); await wait(250);

      // 10. type "Looks good ✓"
      await moveCur(w2c(g2X,g2Y+g2H+15).x, w2c(g2X,g2Y+g2H+15).y, 820, { zoomInScale: 1.32 });
      await waitLerp(); await wait(130);
      await typeText(tx2, g2X, g2Y+g2H+15, 'Looks good ✓', 600); await wait(450);

      // 11. Export button click + zoom
      setTool('arrow');
      await moveCur(elC(expBtn).x, elC(expBtn).y, 1200, { zoomOutFirst: true });
      await waitLerp(); await wait(180);
      expBtn.style.transition = 'transform .18s ease, box-shadow .18s ease';
      expBtn.style.transform = 'scale(1.08)';
      expBtn.style.boxShadow = '0 0 0 3px rgba(13,13,12,.22)';
      await wait(220); expBtn.style.transform = 'scale(0.94)';
      await wait(120); expBtn.style.transform = ''; expBtn.style.boxShadow = ''; expBtn.style.transition = '';
      const ec = elC(expBtn);
      tS=1.5; tTx=ec.x-((ec.x-Tx)/S)*1.5; tTy=ec.y-((ec.y-Ty)/S)*1.5; startLerp();
      await wait(1300);

      if (!stopped) { await wait(500); run(); }
    }

    const t = setTimeout(() => run(), 700);
    return () => { kill(); clearTimeout(t); };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setIsAuthed(false);
    router.refresh();
  }

  const visiblePlans = pricingPlans.length > 0
    ? pricingPlans
    : [
        {
          id: 'free',
          name: 'Free',
          description: 'Perfect for individuals.',
          monthlyPriceInPaise: 0,
          limits: { maxActiveProjects: 1, maxActiveDocuments: 5, softMonthlyNewDocumentsLimit: 5 },
          features: {
            canAnnotate: true,
            canComment: true,
            hasCommentStatus: false,
            hasDocumentStatus: false,
            hasEmailNotifications: false,
            hasSlackIntegration: false,
            hasBranding: false,
            hasTeamOnlyComments: false,
            hasPasswordProtectedLinks: false,
            hasAnalytics: false,
          },
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'For professionals and small teams.',
          monthlyPriceInPaise: 99900,
          limits: { maxActiveProjects: null, maxActiveDocuments: null, softMonthlyNewDocumentsLimit: 50 },
          features: {
            canAnnotate: true,
            canComment: true,
            hasCommentStatus: true,
            hasDocumentStatus: true,
            hasEmailNotifications: true,
            hasSlackIntegration: false,
            hasBranding: false,
            hasTeamOnlyComments: false,
            hasPasswordProtectedLinks: false,
            hasAnalytics: false,
          },
        },
        {
          id: 'team',
          name: 'Team',
          description: 'Everything for growing teams.',
          monthlyPriceInPaise: 299900,
          limits: { maxActiveProjects: null, maxActiveDocuments: null, softMonthlyNewDocumentsLimit: null },
          features: {
            canAnnotate: true,
            canComment: true,
            hasCommentStatus: true,
            hasDocumentStatus: true,
            hasEmailNotifications: true,
            hasSlackIntegration: true,
            hasBranding: true,
            hasTeamOnlyComments: true,
            hasPasswordProtectedLinks: true,
            hasAnalytics: true,
          },
        },
      ] satisfies PricingPlan[];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @font-face { font-family:'Virgil'; src:url('https://excalidraw.com/Virgil.woff2') format('woff2'); font-display:swap; }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:#fafaf9; --bg-2:#f4f4f2; --bg-card:#ffffff;
          --border:#e4e4e0; --border-strong:#c8c8c4;
          --text:#0d0d0c; --text-2:#5a5a58; --text-3:#9a9a96;
          --accent:#0d0d0c; --accent-fg:#fafaf9;
          --red:#e74c3c; --yellow:#f1c40f; --green:#2ecc71;
          --shadow-sm:0 1px 3px rgba(0,0,0,.06);
          --shadow-md:0 4px 16px rgba(0,0,0,.08);
          --shadow-lg:0 16px 48px rgba(0,0,0,.10);
          --shadow-xl:0 32px 80px rgba(0,0,0,.12);
          --radius-sm:6px; --radius-md:10px; --radius-lg:16px; --radius-xl:24px;
          --doc-accent: #b98a4e;
          --doc-accent-soft: rgba(185, 138, 78, 0.16);
        }
        [data-theme="dark"] {
          --bg:#0c0c0b; --bg-2:#161614; --bg-card:#1a1a18;
          --border:#2a2a28; --border-strong:#3e3e3a;
          --text:#f4f4f0; --text-2:#a8a8a4; --text-3:#505050;
          --accent:#f4f4f0; --accent-fg:#0c0c0b;
          --shadow-lg:0 16px 48px rgba(0,0,0,.4);
          --shadow-xl:0 32px 80px rgba(0,0,0,.5);
          --doc-accent: #e0b374;
          --doc-accent-soft: rgba(224, 179, 116, 0.14);
        }

        .hero-title-accent {
          color: var(--doc-accent);
          position: relative;
          font-style: normal;
        }
        .hero-title-accent::after {
          content: '';
          position: absolute;
          left: 2%;
          right: 2%;
          bottom: 0.06em;
          height: 0.14em;
          background: var(--doc-accent-soft);
          border-radius: 2px;
          z-index: -1;
        }

        html { scroll-behavior: smooth; }
        body {
          font-family: 'Instrument Sans', sans-serif;
          background: var(--bg); color: var(--text);
          line-height: 1.5; -webkit-font-smoothing: antialiased;
        }

        /*  NOISE TEXTURE  */
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          opacity: 0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /*  NAV  */
        .nav {
          position: sticky; top: 0; z-index: 200;
          background: color-mix(in srgb, var(--bg) 88%, transparent);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1120px; margin: 0 auto; padding: 0 28px;
          display: flex; align-items: center; height: 68px; gap: 0;
        }
        .nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex: 1; }
        .nav-brand-text {
          font-family: 'DM Serif Display', serif; font-size: 22px;
          color: var(--text); letter-spacing: -.02em;
        }
        .nav-links { display: flex; gap: 2px; list-style: none; margin: 0 auto; }
        .nav-links a {
          display: block; padding: 7px 14px; border-radius: var(--radius-sm);
          font-size: 14px; color: var(--text-2); text-decoration: none; transition: all .15s;
          font-weight: 500;
        }
        .nav-links a:hover { color: var(--text); background: var(--bg-2); }
        .nav-actions { display: flex; align-items: center; gap: 8px; }

        /*  BUTTONS  */
        .btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 500; font-family: 'Instrument Sans', sans-serif;
          cursor: pointer; transition: all .18s; text-decoration: none;
          border: 1px solid transparent; white-space: nowrap;
        }
        .btn-ghost {
          background: transparent; color: var(--text-2);
          border-color: transparent;
        }
        .btn-ghost:hover { background: var(--bg-2); color: var(--text); }
        .btn-outline {
          background: transparent; color: var(--text);
          border-color: var(--border-strong);
        }
        .btn-outline:hover { background: var(--bg-2); transform: translateY(-1px); }
        .btn-primary {
          background: var(--accent); color: var(--accent-fg);
          border-color: var(--accent);
        }
        .btn-primary:hover { opacity: .85; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .btn-lg { padding: 13px 26px; font-size: 15px; border-radius: var(--radius-lg); }
        .btn-icon {
          width: 38px; height: 38px; padding: 0; justify-content: center;
          background: var(--bg-2); border-color: var(--border); color: var(--text-2);
          border-radius: var(--radius-md);
        }
        .btn-icon:hover { background: var(--bg-card); color: var(--text); border-color: var(--border-strong); }

        /*  BADGE  */
        .badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 14px; border-radius: 999px;
          background: var(--bg-2); border: 1px solid var(--border);
          font-size: 12px; font-weight: 500; color: var(--text-2);
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--red); flex-shrink: 0;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--red) 20%, transparent);
        }

        /*  CONTAINER  */
        .container { max-width: 1120px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }

        /*  SECTION  */
        .section { padding: 100px 0; border-top: 1px solid var(--border); }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: .1em;
          text-transform: uppercase; color: var(--text-3);
          font-family: 'DM Mono', monospace; margin-bottom: 16px;
        }
        .section-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(28px, 4vw, 44px); letter-spacing: -.03em;
          line-height: 1.08; color: var(--text); margin-bottom: 16px;
        }
        .section-sub { color: var(--text-2); max-width: 480px; margin: 0 auto; font-size: 15px; line-height: 1.7; }

        /*  DIVIDER  */
        .divider { height: 1px; background: var(--border); }

        /*  HERO  */
        .hero {
          padding: 100px 0 80px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 0;
        }
        .hero-eyebrow { margin-bottom: 28px; }
        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(48px, 7.5vw, 82px);
          line-height: 1.04; letter-spacing: -.035em;
          color: var(--text); max-width: 860px; margin-bottom: 24px;
        }
        .hero-title em { font-style: italic; color: var(--text-2); }
        .hero-sub {
          font-size: 18px; color: var(--text-2);
          max-width: 520px; line-height: 1.7; margin-bottom: 36px;
        }
        .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 64px; }
        .hero-proof {
          display: flex; align-items: center; gap: 28px;
          flex-wrap: wrap; justify-content: center;
        }
        .hero-proof-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-3); }

        /*  MOCKUP  */
        .mockup-wrap { width: 100%; max-width: 960px; margin: 0 auto; }
        .mockup-window {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); overflow: hidden;
        }
        .mockup-titlebar {
          background: var(--bg-2); border-bottom: 1px solid var(--border);
          padding: 13px 18px; display: flex; align-items: center; gap: 14px;
        }
        .mockup-dots { display: flex; gap: 7px; }
        .mockup-dot { width: 11px; height: 11px; border-radius: 50%; }
        .mockup-url {
          flex: 1; background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 5px 14px;
          font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-3);
        }
        .mockup-actions { display: flex; gap: 8px; margin-left: auto; }
        .mockup-action {
          padding: 4px 12px; border-radius: 5px; font-size: 11px;
          font-family: 'DM Mono', monospace; cursor: default;
        }
        .mockup-body { display: flex; height: 440px; }

        /* TOOLBAR */
        .editor-toolbar {
          width: 54px; border-right: 1px solid var(--border); background: var(--bg-2);
          display: flex; flex-direction: column; align-items: center;
          padding: 14px 0; gap: 4px; flex-shrink: 0;
        }
        .tool-btn {
          width: 38px; height: 38px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-3); cursor: pointer; border: none; background: transparent;
          transition: all .15s; font-size: 13px;
        }
        .tool-btn.active { background: var(--accent); color: var(--accent-fg); }
        .tool-btn:hover:not(.active) { background: var(--border); color: var(--text); }
        .tool-sep { width: 28px; height: 1px; background: var(--border); margin: 6px 0; }

        /* CANVAS */
        .editor-canvas { flex: 1; position: relative; overflow: hidden; background: var(--bg); }
        .pdf-page {
          position: absolute; top: 28px; left: 50%; transform: translateX(-50%);
          width: 290px; background: white; box-shadow: var(--shadow-md); border-radius: 3px;
          padding: 26px 26px 34px;
        }
        [data-theme="dark"] .pdf-page { background: #1e1e1c; }
        .pdf-line { height: 7px; background: var(--border); border-radius: 2px; margin-bottom: 10px; }
        .pdf-line.title { height: 13px; width: 68%; margin-bottom: 18px; background: var(--border-strong); }
        .pdf-line.med { width: 82%; }
        .pdf-line.short { width: 58%; }
        .anno-rect { position: absolute; border: 2px solid; border-radius: 3px; }
        .anno-text { position: absolute; font-family: 'Virgil', cursive; font-size: 13px; color: var(--red); white-space: nowrap; pointer-events: none; }
        .anno-hl { position: absolute; height: 8px; border-radius: 2px; opacity: .38; }

        /* PANEL */
        .editor-panel {
          width: 196px; border-left: 1px solid var(--border); background: var(--bg-card);
          padding: 18px; font-size: 12px; display: flex; flex-direction: column; gap: 18px;
          flex-shrink: 0;
        }
        .panel-label { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-3); font-family: 'DM Mono', monospace; }
        .color-dot { width: 22px; height: 22px; border-radius: 5px; border: 1px solid var(--border); }
        .panel-input {
          background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 6px 9px; font-size: 11px; color: var(--text); font-family: 'DM Mono', monospace;
          width: 100%;
        }
        .comment-bubble {
          background: var(--bg-2); border: 1px solid var(--border);
          border-radius: 10px; padding: 11px; display: flex; gap: 9px;
        }
        .comment-avatar {
          width: 22px; height: 22px; border-radius: 50%; background: var(--text);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: var(--accent-fg); flex-shrink: 0;
          font-family: 'Instrument Sans', sans-serif; font-weight: 600;
        }

        /*  FEATURES NOTEBOOK  */
        .notebook-fan {
          position: relative;
          max-width: 940px;
          height: 300px;
          margin: -10px auto 0;
        }
        .notebook-card {
          position: absolute;
          left: var(--card-x);
          top: var(--card-y);
          width: 220px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transform: translateX(-50%) rotate(var(--card-rotate));
          transform-origin: center bottom;
          z-index: var(--card-z);
          opacity: 1;
          transition: transform .52s cubic-bezier(.22, 1, .36, 1), opacity .28s ease, filter .28s ease;
        }
        .notebook-card:focus-visible {
          outline: 2px solid #111;
          outline-offset: 8px;
        }
        .notebook-fan:hover .notebook-card {
          opacity: .48;
          filter: blur(.2px);
        }
        .notebook-fan:hover .notebook-card:hover {
          opacity: 1;
          filter: none;
          transform: translateX(-50%) translateY(-14px) rotate(0deg) scale(1.03);
          z-index: 20;
        }
        .notebook-card-inner {
          display: grid;
          position: relative;
          min-height: 220px;
          padding: 50px 24px 14px 30px;
          border: 4px solid #111;
          border-radius: 14px 18px 16px 14px;
          background:
            repeating-linear-gradient(
              to bottom,
              transparent 0 22px,
              rgba(0, 0, 0, 0.08) 22px 24px
            ),
            linear-gradient(160deg, var(--card-tint-a, #fff), var(--card-tint-b, #f6f6f6));
          box-shadow:
            0 10px 0 rgba(17, 17, 17, 0.08),
            0 18px 34px rgba(17, 17, 17, 0.12);
          overflow: hidden;
          transition: box-shadow .32s ease, border-color .32s ease;
        }
        .notebook-fan:hover .notebook-card:hover .notebook-card-inner {
          border-color: var(--card-accent, #111);
          box-shadow:
            0 10px 0 rgba(17, 17, 17, 0.08),
            0 22px 44px rgba(17, 17, 17, 0.14),
            0 0 0 3px color-mix(in srgb, var(--card-accent, #111) 22%, transparent);
        }
        .notebook-card-inner::before {
          content: '';
          position: absolute;
          inset: 10px 10px 9px 9px;
          border: 2px solid rgba(17, 17, 17, 0.88);
          border-radius: 10px 13px 12px 10px;
          pointer-events: none;
        }
        .notebook-card-inner::after {
          content: '';
          position: absolute;
          top: 0;
          left: 20px;
          bottom: 0;
          width: 2px;
          background: rgba(0, 0, 0, 0.16);
          pointer-events: none;
        }
        .notebook-rings {
          position: absolute;
          top: -16px;
          left: 18px;
          right: 14px;
          display: flex;
          justify-content: space-between;
        }
        .notebook-ring {
          width: 14px;
          height: 38px;
          border: 4px solid #111;
          border-bottom-width: 8px;
          border-radius: 12px 12px 8px 8px;
          background: transparent;
          box-shadow: inset 0 -4px 0 #111;
        }
        .notebook-page-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          height: 26px;
          border: 2px solid #111;
          border-radius: 999px;
          background: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #111;
          transition: border-color .28s ease, color .28s ease;
        }
        .notebook-fan:hover .notebook-card:hover .notebook-page-number {
          border-color: var(--card-accent, #111);
          color: var(--card-accent, #111);
        }
        .notebook-icon {
          width: 44px;
          height: 44px;
          margin-top: 10px;
          border: 2px solid #111;
          border-radius: 16px 18px 14px 16px;
          background: color-mix(in srgb, var(--card-accent, #fff) 14%, #fff);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111;
          box-shadow: 3px 4px 0 rgba(17, 17, 17, 0.08);
          transform: rotate(-3deg);
          transition: background .28s ease, transform .28s ease;
        }
        .notebook-fan:hover .notebook-card:hover .notebook-icon {
          transform: rotate(0deg) scale(1.06);
          background: color-mix(in srgb, var(--card-accent, #fff) 30%, #fff);
        }
        .notebook-title {
          margin-top: 10px;
          max-width: 10ch;
          font-family: 'DM Serif Display', serif;
          font-size: clamp(17px, 1.7vw, 24px);
          line-height: 1.08;
          letter-spacing: -.04em;
          color: #111;
        }
        .notebook-copy {
          margin-top: 7px;
          max-width: 24ch;
          font-size: 12.5px;
          line-height: 1.5;
          color: rgba(17, 17, 17, 0.9);
        }
        .notebook-rule-stack {
          position: absolute;
          left: 30px;
          right: 20px;
          bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .notebook-rule-stack span {
          display: block;
          height: 2px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.16);
        }
        .notebook-rule-stack span:nth-child(2) { width: 84%; }
        .notebook-rule-stack span:nth-child(3) { width: 68%; }

        .features-header {
          margin-bottom: 10px;
          padding-bottom: 0;
        }
        .features-header .section-sub {
          max-width: 640px;
          font-size: 14px;
          line-height: 1.5;
        }
        .features-header .section-label {
          margin-bottom: 10px;
        }
        .features-header .section-title {
          margin-bottom: 10px;
          line-height: 1;
        }

        /*  STEPS  */
        .steps-hover-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          isolation: isolate;
        }
        .steps-hover-bg {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: calc(var(--radius-xl) - 2px);
          border: 1px solid color-mix(in srgb, var(--border-strong) 52%, transparent);
          background:
            radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 11%, transparent), transparent 55%),
            linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 84%, var(--bg-2)), var(--bg-card));
          box-shadow: var(--shadow-lg);
          transition: transform .24s cubic-bezier(.22, 1, .36, 1), width .24s cubic-bezier(.22, 1, .36, 1), height .24s cubic-bezier(.22, 1, .36, 1), opacity .18s ease;
          pointer-events: none;
          z-index: 0;
        }
        .step-card {
          position: relative;
          z-index: 1;
          min-height: 252px;
          padding: 24px;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 86%, transparent), color-mix(in srgb, var(--bg-card) 92%, var(--bg-2)));
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
          outline: none;
        }
        .step-card:hover,
        .step-card.is-active {
          transform: translateY(-4px);
          border-color: color-mix(in srgb, var(--border-strong) 72%, transparent);
          background: transparent;
        }
        .step-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .step-icon-shell {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg-2) 90%, white);
          color: var(--text);
          box-shadow: inset 0 1px 0 color-mix(in srgb, white 65%, transparent);
          transition: transform .2s ease, background .2s ease, color .2s ease, border-color .2s ease;
        }
        .step-card:hover .step-icon-shell,
        .step-card.is-active .step-icon-shell {
          transform: scale(1.04);
          background: var(--accent);
          color: var(--accent-fg);
          border-color: var(--accent);
          box-shadow: none;
        }
        .step-meta {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--text-3);
          font-family: 'DM Mono', monospace;
        }
        .step-num { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-3); letter-spacing: .06em; padding-top: 4px; }
        .step-title { font-weight: 600; font-size: 20px; line-height: 1.2; letter-spacing: -.02em; color: var(--text); }
        .step-desc { font-size: 14px; color: var(--text-2); line-height: 1.75; max-width: 25ch; }

        /*  TESTIMONIALS  */
        .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .testi-card-wrap { perspective: 1400px; }
        .testi-card {
          --rx: 0deg;
          --ry: 0deg;
          --mx: 50%;
          --my: 50%;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 28px 26px;
          display: flex; flex-direction: column; gap: 22px;
          box-shadow: var(--shadow-sm); transition: box-shadow .22s, transform .22s, border-color .22s;
          position: relative; overflow: hidden; transform-style: preserve-3d;
          transform: rotateX(var(--rx)) rotateY(var(--ry)) translateY(0);
          min-height: 258px; will-change: transform;
        }
        .testi-card::before {
          background: radial-gradient(
            circle at var(--mx) var(--my),
            rgba(255, 255, 255, 0.05),  /* reduced */
            transparent 50%
          );
        }
        .testi-card::after {
          content: ''; position: absolute; inset: 1px; pointer-events: none;
          border-radius: calc(var(--radius-lg) - 1px);
          border: 1px solid color-mix(in srgb, white 48%, transparent);
          opacity: .5;
        }
        .testi-card[data-active="true"] {
          box-shadow: var(--shadow-xl);
          border-color: color-mix(in srgb, var(--border-strong) 82%, white 18%);
          transform: rotateX(var(--rx)) rotateY(var(--ry)) translateY(-10px);
        }
        .testi-card-inner {
          position: relative; z-index: 1; height: 100%;
          display: flex; flex-direction: column; gap: 22px;
          transform-style: preserve-3d;
        }
        .testi-layer-sm { transform: translateZ(28px); }
        .testi-layer-md { transform: translateZ(42px); }
        .testi-layer-lg { transform: translateZ(64px); }
        .testi-stars { display: flex; gap: 3px; }
        .testi-star { color: var(--yellow); font-size: 13px; }
        .testi-quote { font-size: 14px; color: var(--text-2); line-height: 1.75; font-style: italic; }
        .testi-author { display: flex; align-items: center; gap: 12px; }
        .testi-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--bg-2); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: var(--text-2);
        }
        .testi-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .testi-role { font-size: 11px; color: var(--text-3); margin-top: 2px; }

        /*  PRICING  */
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 900px; margin: 0 auto; }
        .price-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 32px 28px;
          display: flex; flex-direction: column; gap: 24px;
          position: relative; transition: box-shadow .2s;
        }
        .price-card:hover { box-shadow: var(--shadow-md); }
        .price-card.featured {
          background: var(--text); color: var(--accent-fg);
          border-color: var(--text); box-shadow: var(--shadow-lg);
        }
        .price-popular {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: var(--red); color: white; padding: 3px 14px; border-radius: 999px;
          font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          white-space: nowrap;
        }
        .price-plan { font-size: 12px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--text-3); font-family: 'DM Mono', monospace; }
        .price-card.featured .price-plan { color: color-mix(in srgb, var(--accent-fg) 50%, transparent); }
        .price-amount { font-family: 'DM Serif Display', serif; font-size: 46px; letter-spacing: -.03em; line-height: 1; }
        .price-per { font-size: 13px; opacity: .55; font-weight: 400; font-family: 'Instrument Sans', sans-serif; }
        .price-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; }
        .price-card.featured .price-desc { color: color-mix(in srgb, var(--accent-fg) 60%, transparent); }
        .price-divider { height: 1px; background: var(--border); }
        .price-card.featured .price-divider { background: color-mix(in srgb, var(--accent-fg) 15%, transparent); }
        .price-features { list-style: none; display: flex; flex-direction: column; gap: 11px; }
        .price-feat { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-2); }
        .price-card.featured .price-feat { color: color-mix(in srgb, var(--accent-fg) 65%, transparent); }
        .price-feat-icon { flex-shrink: 0; }

        /*  CTA  */
        .cta-wrap { padding: 0 0 100px; }
        .cta-block {
          background: var(--text); color: var(--accent-fg);
          border-radius: var(--radius-xl); padding: 80px 60px;
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-block::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(-45deg, transparent, transparent 24px,
            color-mix(in srgb, var(--accent-fg) 2.5%, transparent) 24px,
            color-mix(in srgb, var(--accent-fg) 2.5%, transparent) 25px);
        }
        .cta-inner { position: relative; z-index: 1; }
        .cta-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(30px, 4.5vw, 52px); letter-spacing: -.03em;
          line-height: 1.06; margin-bottom: 16px;
        }
        .cta-sub { opacity: .6; max-width: 420px; margin: 0 auto 36px; font-size: 15px; line-height: 1.65; }
        .cta-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        /*  FOOTER  */
        .footer { border-top: 1px solid var(--border); padding: 56px 0 44px; }
        .footer-grid { display: grid; grid-template-columns: 1.6fr repeat(3, 1fr); gap: 40px; margin-bottom: 44px; }
        .footer-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 14px; }
        .footer-brand-text { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text); letter-spacing: -.02em; }
        .footer-tagline { font-size: 13px; color: var(--text-3); line-height: 1.65; max-width: 220px; }
        .footer-col h4 { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-3); margin-bottom: 16px; font-family: 'DM Mono', monospace; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col a { font-size: 13px; color: var(--text-2); text-decoration: none; transition: color .15s; }
        .footer-col a:hover { color: var(--text); }
        .footer-bottom {
          padding-top: 24px; border-top: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; color: var(--text-3);
        }
        .footer-bottom-links { display: flex; gap: 20px; }
        .footer-bottom-links a { color: var(--text-3); text-decoration: none; transition: color .15s; }
        .footer-bottom-links a:hover { color: var(--text-2); }

        /*  ANIMATIONS  */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .anim { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
        .d1 { animation-delay: .08s; } .d2 { animation-delay: .18s; }
        .d3 { animation-delay: .28s; } .d4 { animation-delay: .40s; }

        /*  RESPONSIVE  */
        @media (max-width: 960px) {
          .testi-grid, .pricing-grid { grid-template-columns: 1fr 1fr; }
          .steps-hover-grid { grid-template-columns: 1fr 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .editor-panel { display: none; }
          .nav-links { display: none; }
          .notebook-fan {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            height: auto;
            max-width: 800px;
            margin-top: 0;
          }
          .notebook-fan:hover .notebook-card,
          .notebook-fan:hover .notebook-card:hover {
            opacity: 1;
            filter: none;
            transform: none;
          }
          .notebook-card {
            position: relative;
            left: auto;
            top: auto;
            width: auto;
            transform: none;
          }
        }
        @media (max-width: 640px) {
          .testi-grid, .pricing-grid, .steps-hover-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .cta-block { padding: 52px 28px; }
          .hero { padding: 72px 0 56px; }
          .section { padding: 72px 0; }
          .testi-card { min-height: unset; }
          .notebook-fan { grid-template-columns: 1fr; gap: 16px; margin-top: 0; }
          .notebook-card-inner {
            min-height: 220px;
            padding: 52px 20px 16px 28px;
          }
          .notebook-card-inner::after { left: 18px; }
          .notebook-rings { left: 16px; right: 12px; }
          .notebook-ring {
            width: 12px;
            height: 34px;
            border-width: 3px;
            border-bottom-width: 7px;
          }
          .features-header { margin-bottom: 20px; }
          .notebook-title { max-width: none; font-size: clamp(20px, 8vw, 28px); }
          .notebook-copy { font-size: 13px; max-width: none; }
          .step-desc { max-width: none; }
        }
        @media (hover: none) {
          .testi-card {
            transform: none !important;
            transition: box-shadow .22s, border-color .22s;
          }
          .testi-card[data-active="true"] { transform: none !important; }
          .steps-hover-bg { display: none; }
          .step-card:hover,
          .step-card.is-active { transform: none; }
          .notebook-fan:hover .notebook-card,
          .notebook-fan:hover .notebook-card:hover {
            opacity: 1;
            transform: none;
            filter: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .testi-card, .testi-card::before { transition: none; }
          .testi-card { transform: none !important; }
          .steps-hover-bg, .step-card, .step-icon-shell, .notebook-card { transition: none; }
        }
      `}</style>

      {/*  NAV  */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand">
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="20" r="3.5" fill="var(--text)"/>
    <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
</div>
            <span className="nav-brand-text">Markly</span>
          </a>

          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn btn-icon" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light'
                ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>
              }
            </button>
            {isAuthed ? (
              <>
                <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{padding:'8px 16px',fontSize:13}}>Dashboard</button>
                <button onClick={handleLogout} className="btn btn-primary" style={{padding:'8px 16px',fontSize:13}}>Log out</button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/login')} className="btn btn-outline" style={{padding:'8px 16px',fontSize:13}}>Log in</button>
                <button onClick={() => router.push('/signup')} className="btn btn-primary" style={{padding:'8px 16px',fontSize:13}}>Get started free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/*  HERO  */}
      <section className="hero">
        <div className="container" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>

          {/* <div className="hero-eyebrow anim d1">
            <span className="badge">
              <span className="badge-dot"/>
              Excalidraw for Documents
            </span>
          </div> */}

          <h1 className="hero-title anim d2">
            Annotate <span className="hero-title-accent">documents</span><br/><em>like an artist</em>
          </h1>

          <p className="hero-sub anim d3">
            Markly brings the fluidity of Excalidraw to your PDFs. Draw, write, and comment directly on documents - then share in one click.
          </p>

          <div className="hero-actions anim d3">
            <button onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')} className="btn btn-primary btn-lg">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {isAuthed ? 'Open your dashboard' : 'Start free with Google/GitHub'}
            </button>
            <button className="btn btn-outline btn-lg">
              Watch demo
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          </div>

          {/* PROOF */}
          <div className="hero-proof anim d4">
            {['Google & GitHub login','Share via link','Export as PDF','Works on any PDF'].map(t => (
              <div key={t} className="hero-proof-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </div>
            ))}
          </div>

          {/* MOCKUP */}
          <div className="mockup-wrap anim d4" style={{marginTop:56}} ref={mockupRef}>
  <style>{`
    @font-face{font-family:'Virgil';src:url('https://excalidraw.com/Virgil.woff2') format('woff2');font-display:swap;}
    .mkly-body{position:relative;}
    .mkly-canvas{position:relative;overflow:hidden;flex:1;align-self:stretch;}
    .mkly-world{position:absolute;inset:0;transform-origin:0 0;will-change:transform;}
    .mkly-pdf{position:absolute;background:white;box-shadow:0 4px 16px rgba(0,0,0,.08);border-radius:3px;padding:26px 26px 34px;width:290px;z-index:1;}
    [data-theme="dark"] .mkly-pdf{background:#1e1e1c;}
    .mkly-svg{position:absolute;top:0;left:0;width:3000px;height:3000px;pointer-events:none;overflow:visible;z-index:2;}
    .mkly-cur{position:absolute;pointer-events:none;z-index:100;transform:translate(-2px,-2px);}
    .mkly-tb-btn{width:38px;height:38px;border-radius:9px;border:none;background:transparent;color:var(--text-3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .12s,color .12s;font-size:13px;}
  `}</style>

  <div className="mockup-window">
    <div className="mockup-titlebar">
      <div className="mockup-dots">
        <div className="mockup-dot" style={{background:'#ff5f56'}}/>
        <div className="mockup-dot" style={{background:'#ffbd2e'}}/>
        <div className="mockup-dot" style={{background:'#27c93f'}}/>
      </div>
      <div className="mockup-url">markly.app/review/7bfa61e8-b98f</div>
      <div className="mockup-actions">
        <div className="mockup-action" style={{background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text-3)'}}>Share</div>
        <div
          className="mockup-action mkly-exp"
          style={{ background:'#0d0d0c',
          color:'#fafaf9', transformOrigin:'center'}}
        >Export</div>
      </div>
    </div>

    {/* mkly-body — cursor ka parent, position:relative */}
    <div className="mockup-body mkly-body">

      <div className="editor-toolbar">
        <button className="tool-btn mkly-tb-arrow">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 3l14 9-7 1-4 7z"/></svg>
        </button>
        <button className="tool-btn mkly-tb-text">
          <span style={{fontFamily:"'DM Serif Display',serif",fontSize:15,fontStyle:'italic'}}>T</span>
        </button>
        <button className="tool-btn mkly-tb-rect">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
        </button>
        <button className="tool-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>
        </button>
        <button className="tool-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
        <div className="tool-sep"/>
        <button className="tool-btn"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 17c3-3 5-5 8-5s5 5 8-1"/></svg></button>
        <button className="tool-btn"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 7l6 0M9 11h6M9 15h4" strokeLinecap="round"/></svg></button>
        <div className="tool-sep"/>
        <button className="tool-btn"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
      </div>

      <div className="mkly-canvas editor-canvas">
        <div className="mkly-world">
          <div className="mkly-pdf">
            <div className="pdf-line title"/>
            <div className="pdf-line mkly-ln0"/>
            <div className="pdf-line med mkly-ln1"/>
            <div className="pdf-line short mkly-ln2"/>
            <div className="pdf-line mkly-ln3"/>
            <div className="pdf-line med mkly-ln4"/>
            <div className="pdf-line mkly-ln5" style={{marginTop:14}}/>
            <div className="pdf-line mkly-ln6"/>
            <div className="pdf-line short mkly-ln7"/>
            <div className="pdf-line med mkly-ln8"/>
            <div className="pdf-line mkly-ln9"/>
          </div>
          <svg className="mkly-svg">
            <rect className="mkly-r1" x="0" y="0" width="0" height="0" fill="none" stroke="#e74c3c" strokeWidth="2" strokeDasharray="5,3" rx="3" opacity="0"/>
            <rect className="mkly-r2" x="0" y="0" width="0" height="0" fill="none" stroke="#2ecc71" strokeWidth="2" rx="3" opacity="0"/>
            <rect className="mkly-hl" x="0" y="0" width="0" height="8" fill="#f1c40f" opacity="0" rx="2"/>
            <text className="mkly-tx1" x="0" y="0" fill="#e74c3c" fontFamily="Virgil,cursive" fontSize="17" opacity="0"/>
            <text className="mkly-tx2" x="0" y="0" fill="#2ecc71" fontFamily="Virgil,cursive" fontSize="16" opacity="0"/>
          </svg>
        </div>
      </div>

      {/* Cursor mkly-body ka child hai — toolbar aur canvas dono tak ja sakta hai */}
      <div className="mkly-cur">
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
          <path d="M3.5 2 L3.5 18 L7.5 13.5 L12 20 L14 19 L9.5 12.5 L16.5 12.5 Z" fill="#0d0d0c" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="editor-panel">
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div className="panel-label">Stroke color</div>
          <div style={{display:'flex',gap:7}}>
            {['#e74c3c','#2ecc71','#f1c40f','var(--text)'].map((c,i) => (
              <div key={i} className="color-dot" style={{background:c}}/>
            ))}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div className="panel-label">Font</div>
          <div style={{fontSize:12,color:'var(--text-2)',fontFamily:"'Excalifont',cursive",background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 9px'}}>Excalifont</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div className="panel-label">Opacity</div>
          <input className="panel-input" value="100%" readOnly/>
        </div>
        <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:10}}>
          <div className="panel-label">Comment</div>
          <div className="comment-bubble">
            <div className="comment-avatar">AR</div>
            <div>
              <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.5}}>"Review highlighted section"</div>
              <div style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>2 min ago - Resolved</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
        </div>
      </section>

      {/*  FEATURES  */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header features-header">
            <div className="section-label">Features</div>
            <h2 className="section-title">Everything you need to<br/>review documents visually</h2>
            <p className="section-sub">From quick annotations to full-scale document reviews - Markly gives your team a shared visual language.</p>
          </div>
          <NotebookFeatures items={featureItems} />
        </div>
      </section>

      {/*  HOW IT WORKS  */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-header">
            <div className="section-label">How it works</div>
            <h2 className="section-title">From upload to sign-off<br/>in four steps</h2>
            <p className="section-sub">Markly streamlines your entire review workflow - no onboarding required.</p>
          </div>
          <HowItWorksHoverGrid steps={workflowSteps} />
        </div>
      </section>

      {/*  TESTIMONIALS  */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Testimonials</div>
            <h2 className="section-title">Trusted by teams who<br/>care about clarity</h2>
          </div>
          <div className="testi-grid">
            {[
              { q:'"Finally a review tool that feels like sketching on a whiteboard. Clients actually understand our feedback now."', name:'Sarah M.', role:'Product Designer' },
              { q:'"We replaced three tools with Markly. The hand-drawn annotations with Virgil font feel personal and readable."', name:'Rohan K.', role:'Founder, legal-tech' },
              { q:'"Our architecture team reviews drawings daily. Free-form annotation is perfect - like sketching on paper but shareable."', name:'Jenna L.', role:'Senior Architect' },
            ].map((t,i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>
        </div>
      </section>

      {/*  PRICING  */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Pricing</div>
            <h2 className="section-title">Simple, honest pricing</h2>
            <p className="section-sub">Start free. Upgrade when you need more.</p>
          </div>
          <div className="pricing-grid">
            {visiblePlans.map((p) => {
              const featured = p.id === 'pro';
              const featureRows = [
                { y: true, t: `${p.limits.softMonthlyNewDocumentsLimit ?? 'Unlimited'} new docs / month` },
                { y: true, t: p.features.hasCommentStatus ? 'Open and resolved comments' : 'Basic comments' },
                { y: p.features.hasDocumentStatus, t: 'Document approval states' },
                { y: p.features.hasAnalytics, t: 'Workspace analytics' },
              ];

              return (
              <div key={p.id} className={`price-card${featured?' featured':''}`}>
                {featured && <div className="price-popular">Most popular</div>}
                <div>
                  <div className="price-plan">{p.name}</div>
                  <div className="price-amount">
                    {new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format((p.monthlyPriceInPaise / 100) / 83)}
                    <span className="price-per">/ mo</span>
                  </div>
                  <div className="price-desc" style={{marginTop:10}}>{p.description}</div>
                </div>
                <div className="price-divider"/>
                <ul className="price-features">
                  {featureRows.map((f,j) => (
                    <li key={j} className="price-feat" style={{opacity:f.y?1:.38}}>
                      <span className="price-feat-icon">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          {f.y ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                        </svg>
                      </span>
                      {f.t}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')}
                  className="btn btn-primary"
                  style={{
                    justifyContent:'center', width:'100%', borderRadius:10,
                    background: featured ? 'var(--accent-fg)' : 'var(--accent)',
                    color: featured ? 'var(--text)' : 'var(--accent-fg)',
                    padding:'11px 0',
                  }}
                >
                  {isAuthed ? 'Open dashboard' : (featured ? 'Start Pro' : 'Get started')}
                </button>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/*  CTA  */}
      <div className="cta-wrap">
        <div className="container">
          <div className="cta-block">
            <div className="cta-inner">
              <h2 className="cta-title">Start reviewing smarter.</h2>
              <p className="cta-sub">Create your workspace, upload PDFs, and share public review links in under 30 seconds.</p>
              <div className="cta-actions">
                <button onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')} className="btn btn-lg" style={{background:'var(--accent-fg)',color:'var(--text)',border:'none'}}>
                  {isAuthed ? 'Open your workspace' : 'Create free account'}
                </button>
                <button className="btn btn-lg" style={{background:'transparent',color:'var(--accent-fg)',border:'1px solid color-mix(in srgb,var(--accent-fg) 25%,transparent)'}}>
                  View example review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  FOOTER  */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="/" className="footer-brand">
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                    <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="20" cy="20" r="3.5" fill="var(--text)"/>
                    <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="footer-brand-text">Markly</span>
              </a>
              <p className="footer-tagline">Excalidraw for Documents. Visual feedback for any PDF - draw, annotate, share.</p>
            </div>
            {[
              { h:'Product', links:['Features','Pricing','Changelog','Roadmap'] },
              { h:'Resources', links:['Documentation','API Reference','Blog','Status'] },
              { h:'Company', links:['About','Twitter / X','GitHub','Contact'] },
            ].map(col => (
              <div key={col.h} className="footer-col">
                <h4>{col.h}</h4>
                <ul>{col.links.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>Copyright 2025 Markly. All rights reserved.</span>
            <div className="footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}