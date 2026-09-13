'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Search,
  KeyRound,
  CheckCircle2,
  Clock,
  Ban,
  FileCheck,
  Calendar,
  Phone,
  Store,
  User,
  Eye,
  Plus,
  Copy,
  Check,
  Award,
} from 'lucide-react';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');

  // View Contract Modal
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  // Issue License Key Modal from Contract
  const [licenseContract, setLicenseContract] = useState<any | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);

  // New Contract Modal
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPosition, setNewPosition] = useState('Owner / Manager');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newPlan, setNewPlan] = useState('basic');
  const [newDuration, setNewDuration] = useState(1);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newNotes, setNewNotes] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      let url = '/api/contracts?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter !== 'ALL') url += `status=${statusFilter.toLowerCase()}&`;
      if (planFilter !== 'ALL') url += `plan=${planFilter.toLowerCase()}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, planFilter]);

  const updateContractStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchContracts();
        if (selectedContract && selectedContract._id === id) {
          setSelectedContract((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName,
          phoneNumber: newPhoneNumber,
          position: newPosition,
          businessName: newBusinessName,
          plan: newPlan,
          duration: newDuration,
          startDate: newStartDate,
          agreed: true,
          notes: newNotes,
        }),
      });

      if (res.ok) {
        setIsNewContractOpen(false);
        setNewFullName('');
        setNewPhoneNumber('');
        setNewBusinessName('');
        setNewNotes('');
        fetchContracts();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create contract');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleIssueLicenseKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseContract || !deviceId.trim()) return;

    setLicenseLoading(true);
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: deviceId.trim().toUpperCase(),
          clientName: licenseContract.businessName,
          clientPhone: licenseContract.phoneNumber,
          notes: `Contract Plan: ${licenseContract.plan.toUpperCase()} | Signer: ${licenseContract.fullName}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedKey(data.license.licenseKey);
      } else {
        alert(data.error || 'Failed to issue key');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLicenseLoading(false);
    }
  };

  const totalCount = contracts.length;
  const activeCount = contracts.filter((c) => c.status === 'active').length;
  const pendingCount = contracts.filter((c) => c.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Contract & Agreement Management
            </h1>
            <p className="text-sm text-slate-500">
              Review signed e-sign agreements, manage client subscriptions, and issue POS offline license keys.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsNewContractOpen(true)}
              className="gap-2 bg-[#23169c] hover:bg-[#1b1178] text-white"
            >
              <Plus className="h-4 w-4" />
              New Agreement
            </Button>
          </div>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Agreements
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCount}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Signed & recorded contracts</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#23169c]">
                <FileText className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Subscriptions
                </p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Approved & active shops</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pending Approval
                </p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Awaiting verification</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchContracts();
                }}
                className="flex flex-1 gap-2 max-w-md"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by business, signer name, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {['ALL', 'ACTIVE', 'PENDING', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        statusFilter === st
                          ? 'bg-white text-[#23169c] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'ALL' ? 'All Status' : st}
                    </button>
                  ))}
                </div>

                {/* Plan Filter */}
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#23169c] focus:outline-none"
                >
                  <option value="ALL">All Plans</option>
                  <option value="basic">Basic Plan</option>
                  <option value="premium">Premium Plan</option>
                  <option value="investment">Investment</option>
                  <option value="commercial">Commercial</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Business / Shop</th>
                    <th className="px-4 py-3">Signer & Contact</th>
                    <th className="px-4 py-3">Plan & Duration</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Loading contracts...
                      </td>
                    </tr>
                  ) : contracts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No agreements found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-[#23169c] font-bold shrink-0">
                              <Store className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{c.businessName}</div>
                              <div className="text-[11px] text-slate-400">
                                Ref: #{c._id.slice(-6).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            <span>{c.fullName}</span>
                            <span className="text-[10px] text-slate-400">({c.position})</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{c.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="indigo" className="uppercase font-bold text-[10px]">
                              {c.plan}
                            </Badge>
                            <span className="text-[11px] text-slate-600 font-medium">
                              {c.duration} {c.duration === 1 ? 'year' : 'years'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{c.startDate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              c.status === 'active'
                                ? 'success'
                                : c.status === 'pending'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="capitalize"
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedContract(c)}
                              className="h-7 px-2 text-[11px] gap-1 text-slate-700"
                              title="View full contract and digital signature"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>

                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setLicenseContract(c);
                                setDeviceId('');
                                setGeneratedKey(null);
                              }}
                              className="h-7 px-2 text-[11px] gap-1 bg-[#23169c] text-white hover:bg-[#1b1178]"
                              title="Generate offline license key for this shop"
                            >
                              <KeyRound className="h-3 w-3" />
                              POS Key
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

        {/* Modal: View Contract & E-Signature */}
        <Modal
          isOpen={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          title={`Contract Agreement: ${selectedContract?.businessName}`}
          description={`Agreement ID: #${selectedContract?._id}`}
          className="max-w-xl"
        >
          {selectedContract && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business / Workshop</span>
                  <span className="font-bold text-sm text-slate-900">{selectedContract.businessName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Signer Name & Role</span>
                  <span className="font-bold text-sm text-slate-900">{selectedContract.fullName} ({selectedContract.position})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone Number</span>
                  <span className="font-mono text-slate-800 font-medium">{selectedContract.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subscription Plan</span>
                  <span className="font-bold text-[#23169c] uppercase">{selectedContract.plan} ({selectedContract.duration} yr)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Start Date</span>
                  <span className="text-slate-800 font-medium">{selectedContract.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Agreement Status</span>
                  <div className="mt-0.5">
                    <Badge
                      variant={
                        selectedContract.status === 'active'
                          ? 'success'
                          : selectedContract.status === 'pending'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="capitalize"
                    >
                      {selectedContract.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Digital E-Signature Preview */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Digital E-Signature
                </span>
                {selectedContract.signature ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-center min-h-24">
                    <img
                      src={selectedContract.signature}
                      alt="Digital Signature"
                      className="max-h-24 object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400">
                    No digital signature image attached
                  </div>
                )}
              </div>

              {/* Status Toggle Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Change Status:</span>
                  <Button
                    size="sm"
                    variant={selectedContract.status === 'active' ? 'primary' : 'outline'}
                    onClick={() => updateContractStatus(selectedContract._id, 'active')}
                    className="h-7 text-xs"
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedContract.status === 'pending' ? 'primary' : 'outline'}
                    onClick={() => updateContractStatus(selectedContract._id, 'pending')}
                    className="h-7 text-xs"
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedContract.status === 'cancelled' ? 'destructive' : 'outline'}
                    onClick={() => updateContractStatus(selectedContract._id, 'cancelled')}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setLicenseContract(selectedContract);
                    setSelectedContract(null);
                    setDeviceId('');
                    setGeneratedKey(null);
                  }}
                  className="bg-[#23169c] text-white hover:bg-[#1b1178] gap-1"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Issue POS Key
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Issue POS Hardware Key directly from Contract */}
        <Modal
          isOpen={!!licenseContract}
          onClose={() => setLicenseContract(null)}
          title={`Generate POS License for ${licenseContract?.businessName}`}
          description={`Contract: ${licenseContract?.fullName} | Plan: ${licenseContract?.plan?.toUpperCase()}`}
        >
          {generatedKey ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Activation Key Ready
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white border border-emerald-200 p-3">
                  <code className="font-mono text-base font-bold text-slate-900 tracking-widest">
                    {generatedKey}
                  </code>
                  <Button
                    size="sm"
                    variant={copied ? 'secondary' : 'primary'}
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-8 gap-1 text-xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setLicenseContract(null)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleIssueLicenseKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Device ID (From POS Screen) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="POS-XXXX-XXXX-XXXX"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                  className="font-mono uppercase tracking-wider w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                <p>Shop: <strong className="text-slate-800">{licenseContract?.businessName}</strong></p>
                <p>Signer: {licenseContract?.fullName} | Phone: {licenseContract?.phoneNumber}</p>
                <p>Subscription: <span className="font-semibold text-[#23169c]">{licenseContract?.plan?.toUpperCase()}</span> ({licenseContract?.duration} Year)</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLicenseContract(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={licenseLoading}
                  className="bg-[#23169c] hover:bg-[#1b1178] text-white gap-1.5"
                >
                  <KeyRound className="h-4 w-4" />
                  {licenseLoading ? 'Generating...' : 'Issue License Key'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: Create New Contract */}
        <Modal
          isOpen={isNewContractOpen}
          onClose={() => setIsNewContractOpen(false)}
          title="Create New Agreement / Contract"
          description="Fill in client details to register a new service agreement."
        >
          <form onSubmit={handleCreateContract} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Business / Workshop Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Master Car Care"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Owner / Signer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. U Kyaw"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Position / Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Managing Director"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>
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
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Plan *
                </label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="investment">Investment</option>
                  <option value="commercial">Commercial</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Duration (Years) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional remarks"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNewContractOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="bg-[#23169c] hover:bg-[#1b1178] text-white"
              >
                {createLoading ? 'Saving...' : 'Register Contract'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
