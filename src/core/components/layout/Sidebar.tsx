import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/useUIStore';
import { ROUTES } from '../../types/common';

const navItems = [
  {
    path: ROUTES.HOME,
    label: 'Portal',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: ROUTES.CHESS,
    label: 'Chess',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 16l-1.447.724a1 1 0 0 0-.553.894V20h12v-2.382a1 1 0 0 0-.553-.894L16 16" />
        <path d="M8.5 16h7a1 1 0 0 0 .916-.6L18 12H6l1.584 3.4a1 1 0 0 0 .916.6z" />
        <path d="M9 12V8a3 3 0 0 1 6 0v4" />
        <path d="M12 8V4" />
        <path d="M10 4h4" />
      </svg>
    ),
  },
  {
    path: ROUTES.STATS,
    label: 'Statistics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
] as const;

/** Collapsible sidebar navigation — Linear/Figma style */
export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      className="h-full bg-bg-secondary flex flex-col z-20 overflow-hidden border-r border-border-subtle"
      animate={{ width: sidebarOpen ? 220 : 56 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center h-[52px] px-3 gap-2.5 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-md
            text-text-muted hover:text-text-primary hover:bg-bg-hover
            transition-colors cursor-pointer flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="flex items-center gap-2 overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-sm font-semibold text-text-primary whitespace-nowrap tracking-tight">
                Chess Portal
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-border-subtle" />

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 h-9 rounded-md transition-all duration-150
              ${sidebarOpen ? 'px-2.5' : 'justify-center'}
              ${
                isActive
                  ? 'bg-bg-hover text-text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-accent"
                    layoutId="sidebar-indicator"
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                )}
                <span className="flex-shrink-0 w-[18px] h-[18px]">{item.icon}</span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      className="whitespace-nowrap text-[13px] font-medium"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mx-3 h-px bg-border-subtle" />
      <div className="py-3 px-3 flex-shrink-0">
        <div className={`flex items-center gap-2 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                className="text-[11px] text-text-muted whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                Ready
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
