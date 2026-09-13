'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  KeyRound,
  Users,
  ArrowRight,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLicenses: 0,
    activeLicenses: 0,
    totalContracts: 0,
    activeContracts: 0,
  });

  const [clients, setClients] = useState<any[]>([]);
  const [recentLicenses, setRecentLicenses] = useState<any[]>([]);

  // Fetch stats & recent licenses
  const refreshData = async () => {
    try {
      const [licRes, clientRes, contractRes] = await Promise.all([
        fetch('/api/licenses'),
        fetch('/api/clients'),
        fetch('/api/contracts'),
      ]);

      if (licRes.ok) {
        const licData = await licRes.json();
        const licList = licData.licenses || [];
        setRecentLicenses(licList.slice(0, 10));
        const activeCount = licList.filter((l: any) => l.status === 'ACTIVE').length;
        setStats((prev) => ({
          ...prev,
          totalLicenses: licList.length,
          activeLicenses: activeCount,
        }));
      }

      if (clientRes.ok) {
        const cData = await clientRes.json();
        setClients(cData.clients || []);
      }

      if (contractRes.ok) {
        const conData = await contractRes.json();
        const conList = conData.contracts || [];
        const activeCon = conList.filter((c: any) => c.status === 'active').length;
        setStats((prev) => ({
          ...prev,
          totalContracts: conList.length,
          activeContracts: activeCon,
        }));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top welcome banner */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            License & Contract Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Manage client agreements, track offline licenses, and activate POS hardware devices.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Keys
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {stats.totalLicenses}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Recorded activations</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#23169c]">
                <KeyRound className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Devices
                </p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {stats.activeLicenses}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Currently enabled</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <KeyRound className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Signed Contracts
                </p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">
                  {stats.totalContracts}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{stats.activeContracts} active agreements</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Clients
                </p>
                <h3 className="text-2xl font-black text-[#23169c] mt-1">
                  {stats.totalContracts + clients.length}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Combined directory</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edeafc] text-[#23169c]">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full-width Recent Licenses Table */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base">Recent Licenses</CardTitle>
              <CardDescription>
                Latest activated devices and generating staff
              </CardDescription>
            </div>
            <Link href="/licenses">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-[#23169c]">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Client / Shop</th>
                    <th className="px-5 py-3">Device ID</th>
                    <th className="px-5 py-3">License Key</th>
                    <th className="px-5 py-3">Generated By</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        No licenses generated yet.{' '}
                        <Link href="/licenses" className="text-[#23169c] font-semibold underline">
                          Generate the first key
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    recentLicenses.map((lic) => (
                      <tr key={lic._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          <div>{lic.clientName}</div>
                          {lic.clientPhone && (
                            <span className="text-[11px] font-normal text-slate-400">
                              {lic.clientPhone}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">
                          {lic.deviceId}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-[#23169c]">
                          {lic.licenseKey}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <div className="font-medium text-slate-800">{lic.generatedByName}</div>
                          <div className="text-[10px] text-slate-400">
                            {formatDate(lic.createdAt)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={lic.status === 'ACTIVE' ? 'success' : 'destructive'}
                          >
                            {lic.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
