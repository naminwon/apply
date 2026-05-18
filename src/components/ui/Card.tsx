import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({
  title,
  subtitle,
  actions,
  className,
  children,
}: CardProps) {
  return (
    <section
      className={`flex flex-col rounded-md bg-bg-base p-4 shadow-sm ${className ?? ''}`}
    >
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-h2 text-text-primary">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-caption text-text-tertiary">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}
