'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Loader2, Menu, Smartphone } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'super_admin' | 'staff';
}

const SessionContext = createContext<UserSession | null>(null);

/**
 * The signed-in user, for components rendered inside <DashboardLayout>.
 * The layout only renders its children once the session has loaded.
 */
export function useSession(): UserSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside <DashboardLayout>');
  }
  return session;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  // mobile navigation drawer (the sidebar is always visible from lg up)
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.replace('/login');
        }
      } catch (e) {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#23169c] text-white shadow-lg animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading Autoshop Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
        onLogout={handleLogout}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Open menu"
            aria-controls="dashboard-sidebar"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#23169c] text-white">
            <Smartphone className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">Autoshop</span>
        </header>
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-3 text-xs text-slate-400 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
          <span>Autoshop POS License Management System</span>
          <span>Offline Algorithm: SHA-256 (Bitwise Match)</span>
        </footer>
      </div>
    </div>
  );
}
