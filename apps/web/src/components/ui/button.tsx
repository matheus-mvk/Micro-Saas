import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button className={[styles.button, styles[variant], className].filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  );
}
