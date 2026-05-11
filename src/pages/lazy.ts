/**
 * Lazy-loaded page components with attached `preload()` helpers.
 *
 * Each route's bundle is split out via dynamic `import()` so the initial
 * download only contains the shell + the landing page. The extra
 * `preload` function on every lazy export lets the sidebar trigger a
 * warm fetch on hover / focus, so navigation feels instant once the user
 * signals intent to visit a route.
 *
 * @example
 * ```tsx
 * import { LazyChessPage } from '../pages/lazy';
 *
 * // In a sidebar NavLink:
 * <NavLink to="/chess" onMouseEnter={LazyChessPage.preload} />
 *
 * // In the router:
 * <Route path="/chess" element={<LazyChessPage />} />
 * ```
 */

import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

/** A lazy component with an attached `preload()` method. */
export type PreloadableLazy<T extends ComponentType<unknown>> =
  LazyExoticComponent<T> & { preload: () => Promise<unknown> };

/**
 * Wrap a dynamic import into a `React.lazy` component and attach a
 * `preload()` method that triggers the same chunk fetch ahead of time.
 *
 * The returned component can be rendered inside `<Suspense>` exactly like
 * any other `React.lazy` output; calling `.preload()` starts the network
 * request without mounting the component. Subsequent calls reuse the same
 * in-flight promise, so preloading is idempotent and cheap.
 *
 * @param factory - The dynamic-import factory used by `React.lazy`.
 * @returns A `LazyExoticComponent` augmented with `preload()`.
 */
function lazyWithPreload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): PreloadableLazy<T> {
  const Component = lazy(factory) as PreloadableLazy<T>;
  Component.preload = factory;
  return Component;
}

/** Landing page (lightweight — kept eager is fine too, but split for uniformity). */
export const LazyHomePage = lazyWithPreload(() =>
  import('./HomePage').then((m) => ({ default: m.HomePage })),
);

/** Chess game page — pulls in chess.js + chess-specific R3F scene. */
export const LazyChessPage = lazyWithPreload(() =>
  import('./ChessPage').then((m) => ({ default: m.ChessPage })),
);

/** Checkers game page — pulls in the checkers worker + scene. */
export const LazyCheckersPage = lazyWithPreload(() =>
  import('./CheckersPage').then((m) => ({ default: m.CheckersPage })),
);

/** Go game page — pulls in the Go MCTS worker + scene. */
export const LazyGoPage = lazyWithPreload(() =>
  import('./GoPage').then((m) => ({ default: m.GoPage })),
);

/** Backgammon game page — pulls in the backgammon 3D scene + stores. */
export const LazyBackgammonPage = lazyWithPreload(() =>
  import('./BackgammonPage').then((m) => ({ default: m.BackgammonPage })),
);

/** Stats page — small, but split to keep vendor chunks clean. */
export const LazyStatsPage = lazyWithPreload(() =>
  import('./StatsPage').then((m) => ({ default: m.StatsPage })),
);

/**
 * Preload every route chunk during browser idle time.
 *
 * Called once from `Router` after first mount to warm the cache so
 * subsequent navigation is instant, without blocking the initial paint.
 * Falls back to a delayed timeout in environments without
 * `requestIdleCallback` (Safari).
 */
export function preloadAllRoutesOnIdle(): void {
  const run = () => {
    void LazyHomePage.preload();
    void LazyChessPage.preload();
    void LazyCheckersPage.preload();
    void LazyGoPage.preload();
    void LazyBackgammonPage.preload();
    void LazyStatsPage.preload();
  };

  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 3000 });
  } else {
    window.setTimeout(run, 2000);
  }
}
