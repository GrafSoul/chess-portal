import { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]',
  secondary:
    'bg-bg-tertiary text-text-primary border border-border-primary hover:bg-bg-hover hover:border-border-accent/30',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
  danger:
    'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

/** Reusable button component */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-150 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
