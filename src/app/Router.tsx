import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '../core/components/layout/AppShell';
import { HomePage } from '../pages/HomePage';
import { ChessPage } from '../pages/ChessPage';
import { StatsPage } from '../pages/StatsPage';
import { ROUTES } from '../core/types/common';

/** Application router with layout */
export function Router() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.CHESS} element={<ChessPage />} />
          <Route path={ROUTES.STATS} element={<StatsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
