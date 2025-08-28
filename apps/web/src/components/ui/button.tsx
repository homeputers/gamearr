import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost';
  size?: 'default' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800',
        size === 'icon' ? 'h-9 w-9' : 'h-10 px-4 py-2',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
