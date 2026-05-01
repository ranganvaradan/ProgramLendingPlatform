import { useEffect, useState } from 'react';
import { programApi, loanApi } from '@plp/shared';
import type { Program, Loan } from '@plp/shared';

export default function DashboardPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [progRes, loanRes] = await Promise.all([
          programApi.list(),
          loanApi.list(),
        ]);
        setPrograms(progRes.data.data || []);
        setLoans(loanRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const activePrograms = programs.filter((p) => p.status === 'ACTIVE').length;
  const activeLoans = loans.filter((l) => ['DISBURSED', 'REPAYMENT_DUE'].includes(l.status)).length;
  const overdueLoans = loans.filter((l) => l.status === 'OVERDUE').length;
  const totalDisbursed = loans.filter(l => l.status !== 'REJECTED' && l.status !== 'REQUESTED')
    .reduce((sum, l) => sum + (l.requestedAmount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your lending operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Programs"
          value={programs.length.toString()}
          subtitle={`${activePrograms} active`}
          icon={<BoxIcon />}
          color="blue"
        />
        <StatCard
          title="Active Loans"
          value={activeLoans.toString()}
          subtitle={`of ${loans.length} total`}
          icon={<CurrencyIcon />}
          color="emerald"
        />
        <StatCard
          title="Overdue"
          value={overdueLoans.toString()}
          subtitle={overdueLoans > 0 ? 'Needs attention' : 'All clear'}
          icon={<AlertIcon />}
          color={overdueLoans > 0 ? 'red' : 'slate'}
        />
        <StatCard
          title="Disbursed Value"
          value={`${(totalDisbursed / 100000).toFixed(1)}L`}
          subtitle="Total amount"
          icon={<TrendingIcon />}
          color="violet"
        />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Programs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Programs</h3>
            <span className="text-xs text-slate-400">{programs.length} total</span>
          </div>
          {programs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-400 text-sm">No programs created yet</div>
              <p className="text-xs text-slate-400 mt-1">Programs will appear here once created</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Program</th>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {programs.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 text-sm">{p.programName}</div>
                        <div className="text-xs text-slate-400 font-mono">{p.programCode}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          p.productType === 'PAY_DAY_LOAN'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}>
                          {p.productType === 'PAY_DAY_LOAN' ? 'Pay Day Loan' : 'Invoice Discounting'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent Loans</h3>
            <span className="text-xs text-slate-400">{loans.length} total</span>
          </div>
          {loans.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-400 text-sm">No loans yet</div>
              <p className="text-xs text-slate-400 mt-1">Loans will appear here once requested</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Loan</th>
                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loans.slice(0, 5).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs text-slate-700">{l.loanNumber}</div>
                        <div className="text-xs text-slate-400">{l.productType === 'PAY_DAY_LOAN' ? 'PDL' : 'ID'}</div>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(l.requestedAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <LoanStatusBadge status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string; value: string; subtitle: string; icon: React.ReactNode; color: string;
}) {
  const colors: Record<string, { bg: string; iconBg: string; text: string }> = {
    blue:    { bg: 'bg-white', iconBg: 'bg-blue-50 text-blue-600', text: 'text-blue-600' },
    emerald: { bg: 'bg-white', iconBg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600' },
    red:     { bg: 'bg-white', iconBg: 'bg-red-50 text-red-600', text: 'text-red-600' },
    slate:   { bg: 'bg-white', iconBg: 'bg-slate-100 text-slate-500', text: 'text-slate-600' },
    violet:  { bg: 'bg-white', iconBg: 'bg-violet-50 text-violet-600', text: 'text-violet-600' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`${c.bg} rounded-xl border border-slate-200 shadow-sm p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    DRAFT: 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20',
    PAUSED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    CLOSED: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${styles[status] || styles.DRAFT}`}>
      {status}
    </span>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DISBURSED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    APPROVED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    REQUESTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    OVERDUE: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
    CLOSED: 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20',
    REJECTED: 'bg-red-50 text-red-600 ring-1 ring-red-500/20',
    REPAYMENT_DUE: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-600'}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function BoxIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function CurrencyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function TrendingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
