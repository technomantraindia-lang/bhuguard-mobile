export const SPLASH_BACKGROUND = '#03150D';
export const SPLASH_TAGLINE_COLOR = '#0B2E1F';
export const SPLASH_GLOW_COLOR = '#E7DF7C';
export const SPLASH_RIPPLE_COLOR = 'rgba(133,201,92,0.12)';
export const SPLASH_LEAF_COLORS = ['#85C95C', '#0B2E1F'] as const;
export const SPLASH_DOT_COLOR = '#85C95C';

export const SPLASH_TAGLINE = 'CLIMATE. NATURE. FUTURE.';

/** Entrance fade from white into premium background */
export const SCREEN_FADE_MS = 300;

/** Logo scale spring duration budget */
export const LOGO_SCALE_MS = 900;

/** Logo opacity fade-in */
export const LOGO_OPACITY_MS = 700;

/** Tagline fade-in after logo settles */
export const TAGLINE_FADE_MS = 600;

/** Cross-fade out before navigation */
export const EXIT_CROSS_FADE_MS = 500;

/** Delay before leaf particles begin (after logo mount) */
export const LEAF_START_DELAY_MS = 1100;

/** Delay before tagline appears */
export const TAGLINE_START_DELAY_MS = 1400;

/**
 * Minimum time the premium splash remains visible so boot finishing early
 * never cuts the animation short.
 */
/** Matches brand preloader hold time before Language Selection. */
export const MIN_SPLASH_MS = 700;

export const MAX_SPLASH_MS = 3200;

export const PRELOADER_DURATION = MIN_SPLASH_MS;

export async function waitForMinimumSplash(startedAt: number, minimumMs: number = MIN_SPLASH_MS): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = minimumMs - elapsed;

  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, remaining);
    });
  }
}

export async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Resolve after the exit cross-fade duration so callers can navigate only
 * once the splash has visually faded out.
 */
export async function runCrossFadeOut(durationMs: number = EXIT_CROSS_FADE_MS): Promise<void> {
  await delay(durationMs);
}
