'use client';

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  role?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, role, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
          {role === 'super_admin' && (
            <Badge variant="indigo" className="gap-1">
              <Shield className="h-3 w-3" />
              Super Admin
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">{action}</div>
    </header>
  );
}
