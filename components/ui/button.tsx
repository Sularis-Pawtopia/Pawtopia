import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClass = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variantClass = variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-primary-500 text-white hover:bg-primary-600';
    const sizeClass = size === 'sm' ? 'h-9 px-3 text-sm' : size === 'lg' ? 'h-11 px-8' : 'h-10 px-4 py-2';
    
    return (
      <button
        className={`${baseClass} ${variantClass} ${sizeClass} ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';