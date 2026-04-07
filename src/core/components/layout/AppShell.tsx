import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

/** Main application layout: sidebar + content area */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-full w-full bg-bg-primary">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">{children}</main>
    </div>
  );
}
