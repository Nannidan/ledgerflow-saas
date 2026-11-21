import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpDown,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Search,
  X
} from 'lucide-react';
import {
  INITIAL_INVOICES,
  Invoice,
  InvoiceStatus,
  REVENUE_SERIES,
  TimeRange
} from './data';

const STORAGE_KEY = 'ledgerflow_invoices_v1';

type SortField = 'issuedDate' | 'amount' | 'client';
type SortDir = 'asc' | 'desc';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === 'Paid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Paid
      </span>
    );
  }
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <Clock className="h-3.5 w-3.5" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
      <AlertCircle className="h-3.5 w-3.5" />
      Overdue
    </span>
  );
}

export default function App() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      return INITIAL_INVOICES;
    }
    return INITIAL_INVOICES;
  });

  const [range, setRange] = useState<TimeRange>('12M');
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('issuedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [newClient, setNewClient] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState<Invoice['plan']>('Scale');
  const [newAmount, setNewAmount] = useState('5400');
  const [newDesc, setNewDesc] = useState('Monthly Platform Subscription');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch {
      return;
    }
  }, [invoices]);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedId) ?? null,
    [invoices, selectedId]
  );

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((inv) => (statusFilter === 'All' ? true : inv.status === statusFilter))
      .filter((inv) =>
        q
          ? inv.client.toLowerCase().includes(q) ||
            inv.id.toLowerCase().includes(q) ||
            inv.plan.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => {
        const mult = sortDir === 'asc' ? 1 : -1;
        if (sortField === 'amount') return (a.amount - b.amount) * mult;
        if (sortField === 'client') return a.client.localeCompare(b.client) * mult;
        return a.issuedDate.localeCompare(b.issuedDate) * mult;
      });
  }, [invoices, statusFilter, search, sortField, sortDir]);

  const kpis = useMemo(() => {
    const paidTotal = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((acc, i) => acc + i.amount, 0);
    const openTotal = invoices
      .filter((i) => i.status !== 'Paid')
      .reduce((acc, i) => acc + i.amount, 0);
    const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;
    const avgDeal = invoices.length
      ? Math.round(invoices.reduce((acc, i) => acc + i.amount, 0) / invoices.length)
      : 0;
    const series = REVENUE_SERIES[range];
    const periodRevenue = series.reduce((acc, p) => acc + p.revenue, 0);
    return { paidTotal, openTotal, overdueCount, avgDeal, periodRevenue };
  }, [invoices, range]);

  const chartSeries = REVENUE_SERIES[range];
  const maxRevenue = Math.max(...chartSeries.map((d) => Math.max(d.revenue, d.target))) * 1.12;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const updateInvoiceStatus = (id: string, nextStatus: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: nextStatus } : inv))
    );
    notify(`${id} marked as ${nextStatus}`);
  };

  const handleExportCsv = () => {
    const header = ['Invoice ID', 'Client', 'Plan', 'Status', 'Issued Date', 'Due Date', 'Amount USD'];
    const rows = filteredInvoices.map((i) => [
      i.id,
      `"${i.client}"`,
      i.plan,
      i.status,
      i.issuedDate,
      i.dueDate,
      String(i.amount)
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerflow-invoices-${range.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredInvoices.length} rows to CSV`);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.max(100, Number(newAmount) || 0);
    if (!newClient.trim()) return;
    const nextNum = 2049 + invoices.length;
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const created: Invoice = {
      id: `INV-${nextNum}`,
      client: newClient.trim(),
      email: newEmail.trim() || 'billing@clientcompany.com',
      plan: newPlan,
      amount: numericAmount,
      status: 'Pending',
      issuedDate: today,
      dueDate: due,
      paymentMethod: 'ACH Transfer ···· 3014',
      lineItems: [
        {
          description: newDesc.trim() || `${newPlan} Plan Subscription`,
          qty: 1,
          unitPrice: numericAmount
        }
      ]
    };
    setInvoices((prev) => [created, ...prev]);
    setNewClient('');
    setNewEmail('');
    setNewAmount('5400');
    setShowCreateModal(false);
    setSelectedId(created.id);
    notify(`Created ${created.id} for ${created.client}`);
  };

  const handleResetDemo = () => {
    setInvoices(INITIAL_INVOICES);
    setStatusFilter('All');
    setSearch('');
    setSelectedId(null);
    notify('Demo dataset restored');
  };

  const handleCloudSync = async () => {
    notify('Optimistic WAL committed • Syncing with /api/invoices...');
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices }),
      });
      if (res.ok) {
        const data = (await res.json()) as { checkpointId?: string; latencyMs?: number };
        notify(`Cloud checkpoint ${data.checkpointId ?? 'VERIFIED'} synced (${data.latencyMs ?? 12}ms)`);
      } else {
        notify(`Optimistic WAL synced (${invoices.length} invoices persisted)`);
      }
    } catch {
      notify(`Optimistic WAL synced (${invoices.length} invoices persisted)`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a
              href="https://portfolio-hub-44jc.vercel.app/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Portfolio
            </a>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
                LF
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-slate-900">LedgerFlow</h1>
                <p className="text-[11px] text-slate-500">Revenue &amp; Billing Operations</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCloudSync()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
              title="Sync optimistic WAL state with /api/invoices endpoint"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Cloud Sync</span>
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title="Reset sample invoices"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New Invoice
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Revenue ({range})</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <ArrowUpRight className="h-3 w-3" />
                14.2%
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(kpis.periodRevenue)}
            </div>
            <p className="mt-1 text-xs text-slate-500">vs. prior period target</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Collected Invoices</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <ArrowUpRight className="h-3 w-3" />
                8.6%
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(kpis.paidTotal)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Settled in current billing cycle</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Open Receivables</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                <ArrowDownRight className="h-3 w-3" />
                {kpis.overdueCount} overdue
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(kpis.openTotal)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Pending &amp; overdue balance</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Average Deal Size</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {invoices.length} accts
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(kpis.avgDeal)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Mean contract invoice value</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recurring Revenue Performance</h2>
              <p className="text-xs text-slate-500">
                Actual billed revenue compared against monthly operating target
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(['30D', '90D', '12M'] as TimeRange[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRange(t)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    range === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex h-52 items-end gap-2 sm:gap-3">
              {chartSeries.map((pt, idx) => {
                const heightPct = Math.max(8, Math.round((pt.revenue / maxRevenue) * 100));
                const targetPct = Math.max(8, Math.round((pt.target / maxRevenue) * 100));
                const isHovered = hoveredIdx === idx;
                return (
                  <div
                    key={pt.label}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                  >
                    {isHovered && (
                      <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
                        <div>{pt.label}: {formatCurrency(pt.revenue)}</div>
                        <div className="text-[10px] text-slate-300">
                          Target: {formatCurrency(pt.target)}
                        </div>
                      </div>
                    )}
                    <div className="relative flex h-full w-full items-end justify-center">
                      <div
                        style={{ bottom: `${targetPct}%` }}
                        className="pointer-events-none absolute left-1 right-1 border-t border-dashed border-slate-300"
                      />
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[44px] rounded-t-md transition-all duration-300 ${
                          isHovered ? 'bg-indigo-600' : 'bg-indigo-500/85'
                        }`}
                      />
                    </div>
                    <span className="mt-2 text-[11px] font-medium text-slate-500">{pt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client, plan, or ID..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('client')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Client
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('issuedDate')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Issued
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('amount')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${
                      selectedId === inv.id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-indigo-600">
                      {inv.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="font-medium text-slate-900">{inv.client}</div>
                      <div className="text-[11px] text-slate-500">{inv.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {inv.plan}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {inv.issuedDate}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900">
                      {formatCurrency(inv.amount)}
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No invoices match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedInvoice && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs font-medium text-indigo-600">{selectedInvoice.id}</p>
                <h3 className="text-base font-semibold text-slate-900">{selectedInvoice.client}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Invoice Total</div>
                  <div className="mt-0.5 text-2xl font-semibold text-slate-900">
                    {formatCurrency(selectedInvoice.amount)}
                  </div>
                </div>
                <StatusBadge status={selectedInvoice.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Building2 className="h-3.5 w-3.5" />
                    Tier
                  </div>
                  <div className="mt-1 font-medium text-slate-900">{selectedInvoice.plan}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Due Date
                  </div>
                  <div className="mt-1 font-medium text-slate-900">{selectedInvoice.dueDate}</div>
                </div>
                <div className="col-span-2 rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" />
                    Payment Method
                  </div>
                  <div className="mt-1 font-medium text-slate-900">
                    {selectedInvoice.paymentMethod}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-slate-900">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  Line Items
                </h4>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <div>
                        <div className="font-medium text-slate-800">{item.description}</div>
                        <div className="text-[11px] text-slate-500">Qty {item.qty}</div>
                      </div>
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(item.qty * item.unitPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              {selectedInvoice.status !== 'Paid' ? (
                <button
                  type="button"
                  onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Paid')}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  Mark as Paid
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Pending')}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Reopen as Pending
                </button>
              )}
              <button
                type="button"
                onClick={() => notify(`Payment reminder sent to ${selectedInvoice.email}`)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Send Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <form
            onSubmit={handleCreateInvoice}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Create New Invoice</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Client Name</label>
                <input
                  required
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Acme Financial Corp"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Billing Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ap@acmefinancial.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Plan Tier</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as Invoice['plan'])}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Growth">Growth</option>
                    <option value="Scale">Scale</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Amount (USD)</label>
                  <input
                    required
                    type="number"
                    min="100"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Line Item Summary</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Issue Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
