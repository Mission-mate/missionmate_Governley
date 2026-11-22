import React from 'react';

export default function ChartCard({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`border border-border rounded-xl bg-white dark:bg-card p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}