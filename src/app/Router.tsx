import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '../core/components/layout/AppShell';
import { HomePage } from '../pages/HomePage';
import { ChessPage } from '../pages/ChessPage';
import { CheckersPage } from '../pages/CheckersPage';
import { GoPage } from '../pages/GoPage';
import { StatsPage } from '../pages/StatsPage';
import { ROUTES } from '../core/types/common';

/** Application router with layout */
export function Router() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.CHESS} element={<ChessPage />} />
          <Route path={ROUTES.CHECKERS} element={<CheckersPage />} />
          <Route path={ROUTES.GO} element={<GoPage />} />
          <Route path={ROUTES.STATS} element={<StatsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
