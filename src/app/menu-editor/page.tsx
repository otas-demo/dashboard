'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout, useSession } from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { cn, formatDate } from '@/lib/utils';
import { customPriceOfDays, kyat, lakh, monthlyFrom } from '@/lib/menu/format';
import { HARDWARE_CATEGORIES, type MenuData, type MenuHardwareItem } from '@/lib/menu/types';
import {
  Check,
  Copy,
  ExternalLink,
  Save,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  Lock,
  AlertTriangle,
} from 'lucide-react';

const TABS = ['General', 'Packages', 'AI Order', 'Hardware', 'Custom POS'] as const;
type Tab = (typeof TABS)[number];

const BUILT_IN_IMAGES = [
  'redmi-pad-2-97-wifi.webp',
  'redmi-pad-2-97-4g.webp',
  'redmi-pad-2.webp',
  'ns03-portable-58.webp',
  'ns06-portable-80.webp',
  'xprinter-m80c.webp',
  'xprinter-c260m.webp',
  'ns310-receipt-label.webp',
  'yoko-hs25l.webp',
].map((f) => `/menu-assets/img/${f}`);

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#23169c] focus:outline-none focus:ring-2 focus:ring-[#23169c] disabled:cursor-not-allowed disabled:bg-slate-50';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5';

/** Number inputs keep '' while the field is being cleared; the server rejects it if saved that way. */
function toNum(value: string): number {
  return value === '' ? ('' as unknown as number) : Number(value);
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
  preview,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  preview?: (v: number) => string;
  hint?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          value={value}
          onChange={(e) => onChange(toNum(e.target.value))}
          disabled={disabled}
          className={cn(inputClass, 'pr-14')}
        />
        <span className="pointer-events-none absolute right-3 top-2 text-xs text-slate-400">ကျပ်</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {isAmount(value) ? (
          <>
            Shows as <span className="font-semibold text-[#23169c]">{(preview ?? ((v) => `${kyat(v)} ကျပ်`))(value)}</span>
          </>
        ) : (
          <span className="text-red-500">Enter an amount</span>
        )}
        {hint && <span className="text-slate-400"> · {hint}</span>}
      </p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function VisibleToggle({ visible, onChange, disabled }: { visible: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={visible ? 'outline' : 'secondary'}
      onClick={() => onChange(!visible)}
      disabled={disabled}
      className="gap-1"
      title={visible ? 'Shown on the menu' : 'Hidden from the menu'}
    >
      {visible ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
      {visible ? 'Shown' : 'Hidden'}
    </Button>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

const EMPTY_ITEM: MenuHardwareItem = {
  slug: '',
  category: HARDWARE_CATEGORIES[0].name,
  name: '',
  spec: '',
  bestFor: '',
  price: 0,
  image: BUILT_IN_IMAGES[0],
  samplePhoto: false,
  visible: true,
};

function HardwareItemModal({
  item,
  isNew,
  takenSlugs,
  uploadsEnabled,
  onClose,
  onSave,
}: {
  item: MenuHardwareItem;
  isNew: boolean;
  takenSlugs: string[];
  uploadsEnabled: boolean;
  onClose: () => void;
  onSave: (item: MenuHardwareItem) => void;
}) {
  const [form, setForm] = useState(item);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof MenuHardwareItem>(key: K, value: MenuHardwareItem[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (file: File) => {
    setError('');
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be 2 MB or smaller');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/menu/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      set('image', data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (form.slug || slugify(form.name)).trim();
    if (!form.name.trim()) return setError('Name is required');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return setError('Link id may only use a–z, 0–9 and dashes');
    if (takenSlugs.includes(slug)) return setError(`Another item already uses the link id "${slug}"`);
    if (!isAmount(form.price)) return setError('Enter a price');
    onSave({
      ...form,
      slug,
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? 'Add Hardware Item' : `Edit ${item.name}`}
      description="Shown on the menu index and the Hardware page."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Name *"
            value={form.name}
            onChange={(v) => {
              set('name', v);
              if (!slugTouched) set('slug', slugify(v));
            }}
            disabled={false}
            placeholder="e.g. Redmi Pad 2 (SIM)"
          />
          <div>
            <label className={labelClass}>Category *</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
              {HARDWARE_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TextField label="Spec" value={form.spec} onChange={(v) => set('spec', v)} disabled={false} placeholder="e.g. ၉.၇ လက်မ · 4GB / 64GB · Wi-Fi" />

        <TextField label="Best for" value={form.bestFor} onChange={(v) => set('bestFor', v)} disabled={false} placeholder="ဥပမာ Wi-Fi ရှိတဲ့ ကောင်တာ" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MoneyField label="Price *" value={form.price} onChange={(v) => set('price', v)} disabled={false} />
          <div>
            <label className={labelClass}>Link id</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value.toLowerCase());
              }}
              placeholder="auto from name"
              className={cn(inputClass, 'font-mono')}
            />
            <p className="mt-1 text-xs text-slate-400 truncate">/menu/hardware#{form.slug || slugify(form.name) || '…'}</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Photo</label>
          <div className="flex gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {form.image && <img src={form.image} alt="" className="h-full w-full object-contain" />}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <label
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50',
                  (!uploadsEnabled || uploading) && 'pointer-events-none opacity-50'
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading…' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={!uploadsEnabled || uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
              {!uploadsEnabled && <p className="text-[11px] text-amber-600">Upload needs the R2 settings on the server.</p>}
              <select
                value={BUILT_IN_IMAGES.includes(form.image) ? form.image : ''}
                onChange={(e) => e.target.value && set('image', e.target.value)}
                className={cn(inputClass, 'py-1.5 text-xs')}
              >
                <option value="">— or pick a built-in photo —</option>
                {BUILT_IN_IMAGES.map((src) => (
                  <option key={src} value={src}>
                    {src.split('/').pop()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={form.samplePhoto} onChange={(e) => set('samplePhoto', e.target.checked)} />
            Mark as sample photo (ပုံသည် နမူနာပုံ)
          </label>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {isNew ? 'Add Item' : 'Apply'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MenuEditorContent() {
  const isSuperAdmin = useSession().role === 'super_admin';
  const readOnly = !isSuperAdmin;

  const [draft, setDraft] = useState<MenuData | null>(null);
  const [savedJson, setSavedJson] = useState('');
  const [migrated, setMigrated] = useState(false);
  const [meta, setMeta] = useState<{ updatedAt: string | null; updatedByName: string | null }>({ updatedAt: null, updatedByName: null });
  const [uploadsEnabled, setUploadsEnabled] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>('General');
  const [editing, setEditing] = useState<{ index: number | null; item: MenuHardwareItem } | null>(null);

  // only super admins can save, so only they are asked to save a migrated menu
  const needsMigrationSave = migrated && isSuperAdmin;
  const dirty = draft !== null && (needsMigrationSave || JSON.stringify(draft) !== savedJson);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load menu');
        setDraft(data.data);
        setSavedJson(JSON.stringify(data.data));
        setMigrated(Boolean(data.migrated));
        setMeta({ updatedAt: data.updatedAt, updatedByName: data.updatedByName });
        setUploadsEnabled(data.uploadsEnabled);
      } catch (err: any) {
        setLoadError(err.message);
      }
    }
    load();
  }, []);

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu';

  const update = (fn: (d: MenuData) => MenuData) => setDraft((d) => (d ? fn(d) : d));

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setDraft(data.data);
      setSavedJson(JSON.stringify(data.data));
      setMigrated(false);
      setMeta({ updatedAt: data.updatedAt, updatedByName: data.updatedByName });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const customBase = useMemo(
    () => (draft ? customPriceOfDays(Number(draft.custom.base.days), Number(draft.custom.rate), Number(draft.custom.round) || 1) : 0),
    [draft]
  );

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-red-600">{loadError}</CardContent>
      </Card>
    );
  }

  if (!draft) {
    return <div className="py-16 text-center text-sm text-slate-400">Loading price menu…</div>;
  }

  const moveHardware = (index: number, delta: number) =>
    update((d) => {
      const list = [...d.hardware];
      const [item] = list.splice(index, 1);
      list.splice(index + delta, 0, item);
      return { ...d, hardware: list };
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Price Menu</h1>
          <p className="text-sm text-slate-500">
            Public price list for customers. Changes go live as soon as you save.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {meta.updatedAt
              ? `Last saved ${formatDate(meta.updatedAt)}${meta.updatedByName ? ` by ${meta.updatedByName}` : ''}`
              : 'Not saved yet — showing the original October 2026 price list'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy public link'}
          </Button>
          <a href="/menu" target="_blank" rel="noopener">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Open menu
            </Button>
          </a>
          {isSuperAdmin && (
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving} className="gap-1.5">
              {savedFlash ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving…' : savedFlash ? 'Saved' : 'Save changes'}
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <Lock className="h-4 w-4 text-slate-400" />
          View only — a Super Admin can change menu prices.
        </div>
      )}
      {needsMigrationSave && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          The menu was updated to the new design. Review the prices and press Save.
        </div>
      )}
      {dirty && !needsMigrationSave && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          You have unsaved changes. Customers still see the last saved menu.
        </div>
      )}
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">{saveError}</div>
      )}

      {/* Tabs */}
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
              tab === t ? 'bg-white text-[#23169c] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'General' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Shown in the footer of every menu page.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2">
            <TextField
              label="Price list date"
              value={draft.general.priceDate}
              onChange={(v) => update((d) => ({ ...d, general: { ...d.general, priceDate: v } }))}
              disabled={readOnly}
              placeholder="၂၀၂၆ အောက်တိုဘာ"
            />
            <TextField
              label="Phone"
              value={draft.general.phone}
              onChange={(v) => update((d) => ({ ...d, general: { ...d.general, phone: v } }))}
              disabled={readOnly}
            />
            <TextField
              label="Email"
              value={draft.general.email}
              onChange={(v) => update((d) => ({ ...d, general: { ...d.general, email: v } }))}
              disabled={readOnly}
            />
            <TextField
              label="Website"
              value={draft.general.website}
              onChange={(v) => update((d) => ({ ...d, general: { ...d.general, website: v } }))}
              disabled={readOnly}
              placeholder="https://"
            />
          </CardContent>
        </Card>
      )}

      {tab === 'Packages' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">POS Packages</CardTitle>
            <CardDescription>Monthly prices. The Custom POS starting price comes from the Custom POS tab.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-3">
            <MoneyField
              label="Commercial (per month)"
              value={draft.packages.commercial}
              onChange={(v) => update((d) => ({ ...d, packages: { ...d.packages, commercial: v } }))}
              disabled={readOnly}
              preview={(v) => `${kyat(v)} ကျပ် / လ`}
            />
            <MoneyField
              label="Enterprise (per month)"
              value={draft.packages.enterprise}
              onChange={(v) => update((d) => ({ ...d, packages: { ...d.packages, enterprise: v } }))}
              disabled={readOnly}
              preview={(v) => `${kyat(v)} ကျပ် / လ`}
            />
            <div>
              <label className={labelClass}>Custom POS (from)</label>
              <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                {lakh(customBase)} သိန်း
              </div>
              <p className="mt-1 text-xs text-slate-400">Base days × price per day — edit in Custom POS</p>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'AI Order' && (
        <div className="space-y-4">
          {draft.aiChannels.map((c, i) => {
            const setChannel = (patch: Partial<typeof c>) =>
              update((d) => ({ ...d, aiChannels: d.aiChannels.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
            return (
              <Card key={c.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <CardDescription>
                      {c.subtitle} · /menu/ai-{c.id}
                    </CardDescription>
                  </div>
                  <VisibleToggle visible={c.visible} onChange={(v) => setChannel({ visible: v })} disabled={readOnly} />
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-3">
                  <MoneyField
                    label="Setup fee (one-time)"
                    value={c.setupFee}
                    onChange={(v) => setChannel({ setupFee: v })}
                    disabled={readOnly}
                    preview={(v) => `${lakh(v)} သိန်း`}
                    hint="paid 60% + 40%"
                  />
                  <MoneyField
                    label="Monthly (from)"
                    value={c.monthlyFrom}
                    onChange={(v) => setChannel({ monthlyFrom: v })}
                    disabled={readOnly}
                    preview={(v) => monthlyFrom(v)}
                  />
                  {c.inboxOnlyFee !== null && (
                    <MoneyField
                      label="Staff Inbox only (no AI)"
                      value={c.inboxOnlyFee}
                      onChange={(v) => setChannel({ inboxOnlyFee: v })}
                      disabled={readOnly}
                      preview={(v) => `${lakh(v)} သိန်း`}
                    />
                  )}
                  <TextField label="Waiting time" value={c.wait} onChange={(v) => setChannel({ wait: v })} disabled={readOnly} placeholder="၁–၂ ပတ်" />
                </CardContent>
              </Card>
            );
          })}
          <p className="text-xs text-slate-400">Hidden channels are left off the menu index; their own page link still works.</p>
        </div>
      )}

      {tab === 'Hardware' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 gap-3">
            <div>
              <CardTitle className="text-base">Hardware</CardTitle>
              <CardDescription>Order here is the order on the menu.</CardDescription>
            </div>
            {isSuperAdmin && (
              <Button size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" onClick={() => setEditing({ index: null, item: { ...EMPTY_ITEM } })}>
                <Plus className="h-3.5 w-3.5" />
                Add item
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {draft.hardware.map((h, i) => (
                <li key={h.slug} className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 sm:flex-nowrap sm:px-6', !h.visible && 'opacity-60')}>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img src={h.image} alt="" className="h-full w-full object-contain" />
                  </div>
                  {/* on phones the name takes the first line and the buttons wrap below */}
                  <div className="min-w-0 flex-1 basis-[calc(100%-3.75rem)] sm:basis-auto">
                    <div className="truncate text-sm font-semibold text-slate-900">{h.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {h.category} · {isAmount(h.price) ? `${kyat(h.price)} ကျပ်` : '—'}
                    </div>
                  </div>
                  {!h.visible && <Badge variant="default">Hidden</Badge>}
                  {isSuperAdmin && (
                    <div className="ml-auto flex shrink-0 items-center gap-0.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => moveHardware(i, -1)} title="Move up">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        disabled={i === draft.hardware.length - 1}
                        onClick={() => moveHardware(i, 1)}
                        title="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          update((d) => ({ ...d, hardware: d.hardware.map((x, j) => (j === i ? { ...x, visible: !x.visible } : x)) }))
                        }
                        title={h.visible ? 'Hide from menu' : 'Show on menu'}
                      >
                        {h.visible ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing({ index: i, item: h })} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:text-red-600"
                        onClick={() => {
                          if (confirm(`Remove "${h.name}" from the menu? This takes effect when you save.`)) {
                            update((d) => ({ ...d, hardware: d.hardware.filter((_, j) => j !== i) }));
                          }
                        }}
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
              {draft.hardware.length === 0 && <li className="px-6 py-8 text-center text-sm text-slate-400">No hardware items.</li>}
            </ul>
          </CardContent>
        </Card>
      )}

      {tab === 'Custom POS' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calculator settings</CardTitle>
              <CardDescription>
                Features without a fixed price cost days × price per day, rounded. Base package now:{' '}
                <span className="font-semibold text-[#23169c]">
                  {lakh(customBase)} သိန်း ({kyat(customBase)} ကျပ်)
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-0 lg:grid-cols-4">
              <MoneyField
                label="Price per day"
                value={draft.custom.rate}
                onChange={(v) => update((d) => ({ ...d, custom: { ...d.custom, rate: v } }))}
                disabled={readOnly}
              />
              <MoneyField
                label="Round to"
                value={draft.custom.round}
                onChange={(v) => update((d) => ({ ...d, custom: { ...d.custom, round: v } }))}
                disabled={readOnly}
              />
              <Input
                label="Base package days"
                type="number"
                min={0}
                step={0.5}
                value={draft.custom.base.days}
                onChange={(e) => update((d) => ({ ...d, custom: { ...d.custom, base: { ...d.custom.base, days: toNum(e.target.value) } } }))}
                disabled={readOnly}
              />
              <Input
                label="Base setup weeks"
                type="number"
                min={0}
                value={draft.custom.weeksBase}
                onChange={(e) => update((d) => ({ ...d, custom: { ...d.custom, weeksBase: toNum(e.target.value) } }))}
                disabled={readOnly}
              />
              <Input
                label="Working days / week"
                type="number"
                min={1}
                max={7}
                value={draft.custom.daysPerWeek}
                onChange={(e) => update((d) => ({ ...d, custom: { ...d.custom, daysPerWeek: toNum(e.target.value) } }))}
                disabled={readOnly}
              />
              {draft.custom.payment.map(([label, pct], i) => (
                <Input
                  key={label}
                  label={`Payment ${i + 1} %`}
                  type="number"
                  min={0}
                  max={100}
                  value={pct}
                  title={label}
                  onChange={(e) =>
                    update((d) => ({
                      ...d,
                      custom: {
                        ...d.custom,
                        payment: d.custom.payment.map((p, j) => (j === i ? [p[0], toNum(e.target.value)] : p)) as [string, number][],
                      },
                    }))
                  }
                  disabled={readOnly}
                />
              ))}
            </CardContent>
          </Card>

          {draft.custom.cats.map((cat, ci) => (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{cat.name}</CardTitle>
                <CardDescription>{cat.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="border-y border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Feature</th>
                        <th className="px-4 py-2.5 w-24">Days</th>
                        <th className="px-4 py-2.5 w-40">Fixed price</th>
                        <th className="px-4 py-2.5">Shows as</th>
                        <th className="px-4 py-2.5 w-28 text-right">Menu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cat.items.map((it, ii) => {
                        const setItem = (patch: Partial<typeof it>) =>
                          update((d) => ({
                            ...d,
                            custom: {
                              ...d.custom,
                              cats: d.custom.cats.map((c, cj) =>
                                cj === ci ? { ...c, items: c.items.map((x, ij) => (ij === ii ? { ...x, ...patch } : x)) } : c
                              ),
                            },
                          }));
                        const auto = customPriceOfDays(Number(it.days), Number(draft.custom.rate), Number(draft.custom.round) || 1);
                        const effective = it.price ?? auto;
                        return (
                          <React.Fragment key={it.id}>
                            <tr className={cn(it.hidden && 'opacity-60')}>
                              <td className="px-4 py-2.5 font-medium text-slate-800">
                                {it.name}
                                {it.qty && <span className="ml-1 text-[11px] text-slate-400">({it.qty.per})</span>}
                              </td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  value={it.days}
                                  onChange={(e) => setItem({ days: toNum(e.target.value) })}
                                  disabled={readOnly}
                                  className={cn(inputClass, 'h-8 px-2 py-1 text-xs')}
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                {it.quote ? (
                                  <span className="text-slate-400">Quoted separately</span>
                                ) : (
                                  <input
                                    type="number"
                                    min={0}
                                    step={50000}
                                    value={it.price ?? ''}
                                    placeholder={`auto ${auto.toLocaleString()}`}
                                    onChange={(e) =>
                                      setItem({ price: e.target.value === '' ? undefined : Number(e.target.value) })
                                    }
                                    disabled={readOnly}
                                    className={cn(inputClass, 'h-8 px-2 py-1 text-xs')}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-[#23169c]">
                                {it.quote ? 'သီးသန့်တွက်' : isAmount(effective) ? `${lakh(effective)} သိန်း` : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <VisibleToggle visible={!it.hidden} onChange={(v) => setItem({ hidden: !v })} disabled={readOnly} />
                              </td>
                            </tr>
                            {it.option && (
                              <tr className={cn('bg-slate-50/60', it.hidden && 'opacity-60')}>
                                <td className="px-4 py-2 pl-8 text-slate-600">↳ Option: {it.option.short}</td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={it.option.days}
                                    onChange={(e) => setItem({ option: { ...it.option!, days: toNum(e.target.value) } })}
                                    disabled={readOnly}
                                    className={cn(inputClass, 'h-8 px-2 py-1 text-xs')}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min={0}
                                    step={50000}
                                    value={it.option.price}
                                    onChange={(e) => setItem({ option: { ...it.option!, price: toNum(e.target.value) } })}
                                    disabled={readOnly}
                                    className={cn(inputClass, 'h-8 px-2 py-1 text-xs')}
                                  />
                                </td>
                                <td className="px-4 py-2 font-semibold text-[#23169c]">
                                  {isAmount(it.option.price) ? `${lakh(it.option.price)} သိန်း` : '—'}
                                </td>
                                <td />
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <HardwareItemModal
          item={editing.item}
          isNew={editing.index === null}
          uploadsEnabled={uploadsEnabled}
          takenSlugs={draft.hardware.filter((_, j) => j !== editing.index).map((h) => h.slug)}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            update((d) => ({
              ...d,
              hardware:
                editing.index === null ? [...d.hardware, item] : d.hardware.map((x, j) => (j === editing.index ? item : x)),
            }));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

export default function MenuEditorPage() {
  return (
    <DashboardLayout>
      <MenuEditorContent />
    </DashboardLayout>
  );
}
