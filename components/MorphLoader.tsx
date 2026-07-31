'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './MorphLoader.module.css';

/**
 * Full-screen intro loader for the landing page.
 *
 * Motion is modelled on the supplied logo-intro reference clip:
 *   1. A dot pops in the center and grows into a white disc.
 *   2. The disc inverts into a thin ring with the Markly glyph inside.
 *   3. The ring dissolves; the glyph stays and slides left.
 *   4. "Markly" reveals letter-by-letter beside it.
 *   5. Hold — then the whole curtain wipes UPWARD to reveal the page.
 * Strict black & white.
 *
 * Plays once per browser session. The first landing-page view in a tab gets
 * the full intro; navigating away and back — or refreshing — skips it. The
 * flag lives in `sessionStorage` under `markly-intro-seen`, and a pre-hydration
 * script in app/layout.tsx mirrors it onto <html data-intro="seen"> so the
 * curtain is hidden by CSS before first paint rather than flashing and then
 * unmounting. Clearing the flag is as simple as opening a new tab.
 *
 * The curtain lifts when the animation genuinely finishes, detected via the
 * Web Animations API `.finished` promise, which:
 *   - resolves at the true end of the CSS timeline (never cut short), and
 *   - resolves immediately if the animation already completed before this
 *     effect ran (e.g. hydration lagged behind the animation on a slow load).
 * A safety timeout guarantees the page is always revealed even where
 * animation events don't fire (animations disabled, hidden/background tab).
 */

const WORD = 'Markly';

export const INTRO_SEEN_KEY = 'markly-intro-seen';

function introAlreadySeen() {
  if (document.documentElement.getAttribute('data-intro') === 'seen') return true;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/* Marked as soon as the intro starts, not when it ends — a refresh mid-intro
   should not replay it either. Also mirrored onto <html> so a later
   client-side navigation back to the landing page skips the curtain without
   waiting for an effect to run. */
function markIntroSeen() {
  document.documentElement.setAttribute('data-intro', 'seen');
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    /* private mode / storage disabled — the <html> attribute still covers
       in-session navigation. */
  }
}

// Comfortably longer than the CSS timeline (2800ms). Only ever used as a
// fallback; the animation's own completion normally reveals the page first.
const SAFETY_MS = 4000;

type LetterStyle = CSSProperties & { '--i': number };

/* Markly glyph — corner brackets + center dot + wave, drawn with
   currentColor so the loader can invert it (dark on the white disc, then
   white once the disc dissolves). */
function MarklyGlyph() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 6 L8 6 L8 20" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 34 L32 34 L32 20" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
      <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function MorphLoader() {
  // Rendered on the server + first client paint so the page never flashes
  // uncovered. Stays mounted until the animation genuinely completes.
  const [visible, setVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // Shared "complete once" callback for the animationend backup handler.
  const finishRef = useRef<() => void>(() => {});
  // True once this mount has claimed the intro. Survives StrictMode's
  // double-invoked effect, which would otherwise read back its own
  // sessionStorage flag and cut the intro short in development.
  const playingRef = useRef(false);

  useEffect(() => {
    // Already played earlier in this session — unmount without locking scroll.
    // The <html data-intro> attribute has kept it invisible up to this point.
    if (!playingRef.current && introAlreadySeen()) {
      setVisible(false);
      return;
    }
    playingRef.current = true;
    markIntroSeen();

    let done = false;
    const prevOverflow = document.body.style.overflow;
    // Lock scroll while the curtain is up.
    document.body.style.overflow = 'hidden';

    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(safety);
      document.body.style.overflow = prevOverflow;
      setVisible(false);
    };
    finishRef.current = finish;

    const safety = window.setTimeout(finish, SAFETY_MS);

    // Primary signal: wait for the actual CSS animations (curtain, badge
    // pieces, every letter) to finish. `.finished` resolves immediately for
    // any that already ended before hydration.
    const el = overlayRef.current;
    const anims = el?.getAnimations({ subtree: true }) ?? [];
    if (anims.length > 0) {
      // allSettled: `.finished` rejects when an animation is cancelled (which
      // happens on unmount) — allSettled keeps that from becoming an unhandled
      // rejection and still resolves once every animation has ended.
      Promise.allSettled(anims.map((a) => a.finished)).then(finish);
    }

    return () => {
      window.clearTimeout(safety);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      // Backup for engines where getAnimations()/.finished is unavailable.
      // Only the overlay's own wipe ends the show — the badge/letter
      // animations bubbling up earlier must not lift the curtain mid-intro.
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) finishRef.current();
      }}
      aria-hidden="true"
    >
      <div className={styles.lockup}>
        <div className={styles.badge}>
          <div className={styles.disc} />
          <div className={styles.ring} />
          <div className={styles.glyph}>
            <MarklyGlyph />
          </div>
        </div>
        <span className={styles.word}>
          {WORD.split('').map((ch, i) => {
            const style: LetterStyle = { '--i': i };
            return (
              <span key={i} className={styles.letter} style={style}>
                {ch}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
