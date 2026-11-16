import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Consistent page title block with optional trailing actions. */
export default function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
    >
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-ink sm:text-2xl">
          {icon}
          <span className="truncate">{title}</span>
        </h1>
        {description && (
          <p className="mt-1 text-xs text-muted sm:text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
