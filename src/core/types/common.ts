/** Supported application themes */
export type Theme = 'dark' | 'light';

/** Generic callback with no arguments */
export type VoidCallback = () => void;

/** Route path constants */
export const ROUTES = {
  HOME: '/',
  CHESS: '/chess',
  STATS: '/stats',
} as const;

/** Route path type */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
