'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Search,
  Plus,
  KeyRound,
  Trash2,
  Edit2,
  Check,
  Copy,
  MapPin,
  Phone,
  Store,
  Database,
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // New Client Modal
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [clientModalLoading, setClientModalLoading] = useState(false);

  // Generate Key Modal for Specific Client
  const [keyModalClient, setKeyModalClient] = useState<any | null>(null);
  const [keyDeviceId, setKeyDeviceId] = useState('');
  const [keyGenerated, setKeyGenerated] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let url = '/api/clients?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (sourceFilter !== 'ALL') url += `source=${sourceFilter.toLowerCase()}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [sourceFilter]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !ownerName || !phone) return;

    setClientModalLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          ownerName,
          phone,
          email,
          address,
          notes,
          source: 'manual',
        }),
      });

      if (res.ok) {
        setIsNewClientOpen(false);
        setShopName('');
        setOwnerName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setNotes('');
        fetchClients();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save client');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClientModalLoading(false);
    }
  };

  const handleGenerateKeyForClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyModalClient || !keyDeviceId) return;

    setKeyLoading(true);
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: keyDeviceId.trim().toUpperCase(),
          clientName: keyModalClient.shopName,
          clientPhone: keyModalClient.phone,
          clientId: keyModalClient._id,
          notes: `Generated via Client Directory for ${keyModalClient.shopName}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setKeyGenerated(data.license.licenseKey);
      } else {
        alert(data.error || 'Failed to generate key');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKeyLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Clients & Auto Shops
            </h1>
            <p className="text-sm text-slate-500">
              Manage client directory and directly issue hardware activation keys.
            </p>
          </div>
          <Button
            onClick={() => setIsNewClientOpen(true)}
            className="gap-2 bg-[#23169c] hover:bg-[#1b1178] text-white"
          >
            <Plus className="h-4 w-4" />
            Add New Client
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchClients();
                }}
                className="flex flex-1 gap-2 max-w-md"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by shop name, owner, phone, address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </form>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                {['ALL', 'MIGRATED', 'MANUAL'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSourceFilter(st)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      sourceFilter === st
                        ? 'bg-white text-[#23169c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL' ? 'All Clients' : st}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Shop / Business</th>
                    <th className="px-4 py-3">Owner / Contact</th>
                    <th className="px-4 py-3">Phone & Location</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Loading client directory...
                      </td>
                    </tr>
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No clients found. Click "Add New Client" or use the Migration tool to import your online database!
                      </td>
                    </tr>
                  ) : (
                    clients.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-[#23169c] shrink-0 font-bold">
                              <Store className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{c.shopName}</div>
                              {c.notes && (
                                <div className="text-[11px] text-slate-400 line-clamp-1">
                                  {c.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium">
                          {c.ownerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </div>
                          {c.address && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-300" />
                              <span>{c.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={c.source === 'migrated' ? 'indigo' : 'default'}>
                            {c.source === 'migrated' ? 'Migrated' : 'Manual'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setKeyModalClient(c);
                                setKeyDeviceId('');
                                setKeyGenerated(null);
                              }}
                              className="h-7 text-[11px] gap-1 text-[#23169c] hover:bg-indigo-50 border-indigo-200"
                            >
                              <KeyRound className="h-3 w-3" />
                              Generate Key
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteClient(c._id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal: Create Client */}
        <Modal
          isOpen={isNewClientOpen}
          onClose={() => setIsNewClientOpen(false)}
          title="Add New Client / Auto Shop"
          description="Enter client contact details to save to your registry."
        >
          <form onSubmit={handleCreateClient} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Shop / Garage Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Speed Auto Workshop"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Owner / Manager Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. U Hla Win"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="optional@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Shop Address
              </label>
              <input
                type="text"
                placeholder="e.g. No. 45, Pyay Road, Kamayut, Yangon"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Special notes or subscription details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewClientOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={clientModalLoading}
                className="bg-[#23169c] hover:bg-[#1b1178] text-white"
              >
                {clientModalLoading ? 'Saving...' : 'Save Client'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Direct Key Generation for Client */}
        <Modal
          isOpen={!!keyModalClient}
          onClose={() => setKeyModalClient(null)}
          title={`Generate License for ${keyModalClient?.shopName}`}
          description="Enter the Device ID from the POS tablet screen to issue the activation key."
        >
          {keyGenerated ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Activation Key Generated
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white border border-emerald-200 p-3">
                  <code className="font-mono text-base font-bold text-slate-900 tracking-widest">
                    {keyGenerated}
                  </code>
                  <Button
                    size="sm"
                    variant={keyCopied ? 'secondary' : 'primary'}
                    onClick={() => {
                      navigator.clipboard.writeText(keyGenerated);
                      setKeyCopied(true);
                      setTimeout(() => setKeyCopied(false), 2000);
                    }}
                    className="h-8 gap-1 text-xs"
                  >
                    {keyCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {keyCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setKeyModalClient(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateKeyForClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Device ID (From POS Screen) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="POS-XXXX-XXXX-XXXX"
                  value={keyDeviceId}
                  onChange={(e) => setKeyDeviceId(e.target.value.toUpperCase())}
                  className="font-mono uppercase tracking-wider w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                <p>Client: <strong className="text-slate-800">{keyModalClient?.shopName}</strong></p>
                <p>Owner: {keyModalClient?.ownerName} | Phone: {keyModalClient?.phone}</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKeyModalClient(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={keyLoading}
                  className="bg-[#23169c] hover:bg-[#1b1178] text-white gap-1.5"
                >
                  <KeyRound className="h-4 w-4" />
                  {keyLoading ? 'Generating...' : 'Issue License Key'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
