'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  Users,
  ShieldCheck,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

export function Sidebar({ userRole, userName, userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Contracts (စာချုပ်)', href: '/contracts', icon: FileText },
    { name: 'License Keys', href: '/licenses', icon: KeyRound },
    { name: 'Clients / Shops', href: '/clients', icon: Users },
    ...(userRole === 'super_admin'
      ? [{ name: 'Staff & Roles', href: '/users', icon: ShieldCheck }]
      : []),
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23169c] text-white shadow-sm">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900">Autoshop</h1>
          <p className="text-xs font-medium text-slate-400">License Management</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#edeafc] text-[#23169c] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-[#23169c]' : 'text-slate-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#23169c] text-sm font-bold text-white uppercase">
            {(userName || 'A').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">{userName || 'User'}</p>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  userRole === 'super_admin' ? 'bg-indigo-600' : 'bg-emerald-500'
                )}
              />
              <span className="truncate text-[11px] font-medium text-slate-500 capitalize">
                {userRole === 'super_admin' ? 'Super Admin' : 'Staff'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
