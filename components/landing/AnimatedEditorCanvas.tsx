// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: In LandingPageClient, add this import at the top:
//   import { useRef } from 'react';   ← already there if you use other refs
//
// STEP 2: Inside LandingPageClient() function body, after the existing useEffects,
//         paste this entire useEffect:
// ─────────────────────────────────────────────────────────────────────────────

const mockupRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const root = mockupRef.current;
  if (!root) return;

  // ── element refs ──────────────────────────────────────────────────────────
  const canvas  = root.querySelector<HTMLElement>('.mkly-canvas')!;
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
    const er = el.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    return { x: er.left - cr.left + er.width/2, y: er.top - cr.top + er.height/2 };
  }
  function elCtl(el: Element) {
    const er = el.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    return { x: er.left - cr.left, y: er.top - cr.top };
  }
  function elWorld(el: Element) {
    const er = el.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    const vx = er.left - cr.left, vy = er.top - cr.top;
    return { x: (vx-Tx)/S, y: (vy-Ty)/S, w: er.width/S, h: er.height/S };
  }
  // world → canvas px (canvas IS the viewport here, no offset needed)
  function w2c(wx: number, wy: number) { return { x: wx*S + Tx, y: wy*S + Ty }; }

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


// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Replace your entire {/* MOCKUP */} block with this JSX:
// ─────────────────────────────────────────────────────────────────────────────

<div className="mockup-wrap anim d4" style={{marginTop:56}} ref={mockupRef}>
  <style>{`
    @font-face{font-family:'Virgil';src:url('https://excalidraw.com/Virgil.woff2') format('woff2');font-display:swap;}
    .mkly-canvas{position:relative;overflow:hidden;flex:1;align-self:stretch;}
    .mkly-world{position:absolute;inset:0;transform-origin:0 0;will-change:transform;}
    .mkly-pdf{position:absolute;background:white;box-shadow:0 4px 16px rgba(0,0,0,.08);border-radius:3px;padding:26px 26px 34px;width:290px;}
    [data-theme="dark"] .mkly-pdf{background:#1e1e1c;}
    .mkly-cur{position:absolute;pointer-events:none;z-index:100;transform:translate(-2px,-2px);}
    .mkly-exp{
      position:absolute;top:10px;right:10px;z-index:10;
      background:var(--text);color:var(--accent-fg);
      padding:4px 11px;border-radius:5px;font-size:11px;
      font-family:'DM Mono',monospace;pointer-events:none;transform-origin:center;
    }
    .mkly-tb-btn{
      width:38px;height:38px;border-radius:9px;border:none;background:transparent;
      color:var(--text-3);display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:background .12s,color .12s;font-size:13px;
    }
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
        <div className="mockup-action" style={{background:'var(--text)',color:'var(--accent-fg)'}}>Export</div>
      </div>
    </div>

    <div className="mockup-body">
      {/* TOOLBAR — real one, animation activates its buttons */}
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

      {/* CANVAS — zoomable area */}
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
          <svg style={{position:'absolute',top:0,left:0,width:3000,height:3000,pointerEvents:'none',overflow:'visible'}}>
            <rect className="mkly-r1" x="0" y="0" width="0" height="0" fill="none" stroke="#e74c3c" strokeWidth="2" strokeDasharray="5,3" rx="3" opacity="0"/>
            <rect className="mkly-r2" x="0" y="0" width="0" height="0" fill="none" stroke="#2ecc71" strokeWidth="2" rx="3" opacity="0"/>
            <rect className="mkly-hl" x="0" y="0" width="0" height="8" fill="#f1c40f" opacity="0" rx="2"/>
            <text className="mkly-tx1" x="0" y="0" fill="#e74c3c" fontFamily="Virgil,cursive" fontSize="17" opacity="0"/>
            <text className="mkly-tx2" x="0" y="0" fill="#2ecc71" fontFamily="Virgil,cursive" fontSize="16" opacity="0"/>
          </svg>
        </div>

        {/* Cursor */}
        <div className="mkly-cur">
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
            <path d="M3.5 2 L3.5 18 L7.5 13.5 L12 20 L14 19 L9.5 12.5 L16.5 12.5 Z" fill="#0d0d0c" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Export overlay inside canvas — cursor targets this */}
        <div className="mkly-exp">Export</div>
      </div>

      {/* PANEL */}
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