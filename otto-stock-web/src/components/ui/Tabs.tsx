import React from 'react';
import { NavLink } from 'react-router-dom';

export interface RouteTabItem {
  label: string;
  to: string;
  icon?: React.ReactNode;
  end?: boolean;
}

interface TabsProps {
  items: RouteTabItem[];
  className?: string;
}

export function Tabs({ items, className = '' }: TabsProps) {
  return (
    <div
      role="navigation"
      aria-label="Subnavegação do módulo"
      className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-outline-variant/40 ${className}`}
    >
      {items.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end ?? true}
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg text-label-md font-medium transition-all no-underline ${
              isActive
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-[0_1px_2px_0_rgb(15_23_42/0.06)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
            }`
          }
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
