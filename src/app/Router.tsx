import { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '../core/components/layout/AppShell';
import {
  LazyHomePage,
  LazyChessPage,
  LazyCheckersPage,
  LazyGoPage,
  LazyBackgammonPage,
  LazyStatsPage,
  preloadAllRoutesOnIdle,
} from '../pages/lazy';
import { ROUTES } from '../core/types/common';

/**
 * Lightweight full-viewport spinner shown while a lazy route chunk loads.
 *
 * Kept intentionally minimal so it doesn't add weight to the main bundle
 * and feels instant on fast networks.
 */
function RouteFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-border-subtle border-t-accent animate-spin" />
    </div>
  );
}

/**
 * Application router with layout and route-level code-splitting.
 *
 * Every page is loaded via `React.lazy` so the initial bundle stays small.
 * After first paint, remaining routes are warm-fetched during browser idle
 * time — see {@link preloadAllRoutesOnIdle}. Additionally, hovering a
 * sidebar link triggers a targeted preload for faster perceived navigation.
 */
export function Router() {
  useEffect(() => {
    preloadAllRoutesOnIdle();
  }, []);

  return (
    <HashRouter>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path={ROUTES.HOME} element={<LazyHomePage />} />
            <Route path={ROUTES.CHESS} element={<LazyChessPage />} />
            <Route path={ROUTES.CHECKERS} element={<LazyCheckersPage />} />
            <Route path={ROUTES.GO} element={<LazyGoPage />} />
            <Route path={ROUTES.BACKGAMMON} element={<LazyBackgammonPage />} />
            <Route path={ROUTES.STATS} element={<LazyStatsPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  );
}
