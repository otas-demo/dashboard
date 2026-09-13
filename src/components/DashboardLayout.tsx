'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'super_admin' | 'staff';
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

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
      />
      <div className="pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6">{children}</main>
        <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-400 flex justify-between items-center">
          <span>Autoshop POS License Management System</span>
          <span>Offline Algorithm: SHA-256 (Bitwise Match)</span>
        </footer>
      </div>
    </div>
  );
}
