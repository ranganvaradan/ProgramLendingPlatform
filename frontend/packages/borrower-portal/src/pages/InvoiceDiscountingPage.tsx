import { useState, useEffect } from 'react';
import { portalApi, programApi, apiClient } from '@plp/shared';
import type { Invoice, Program } from '@plp/shared';

export default function InvoiceDiscountingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [borrowerId, setBorrowerId] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<Record<string, unknown> | null>(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    programApi.list()
      .then((r) => setPrograms((r.data.data || []).filter((p: Program) => p.productType === 'INVOICE_DISCOUNTING')))
      .catch(console.error);
  }, []);

  const loadInvoices = async () => {
    if (!borrowerId) return;
    setLoading(true);
    try {
      const [, invoiceRes] = await Promise.all([
        portalApi.borrowerLoans(borrowerId).catch(() => null),
        apiClient.get(`/api/v1/invoices/borrower/${borrowerId}/eligible`).catch(() => ({ data: [] })),
      ]);
      setInvoices(invoiceRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!selectedInvoice || !borrowerId || !selectedProgram || !requestedAmount) return;
    setEligibilityResult(null);
    try {
      const res = await portalApi.borrowerInvoiceEligibility(
        borrowerId, selectedProgram, selectedInvoice.id, parseFloat(requestedAmount)
      );
      setEligibilityResult(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const requestDiscounting = async () => {
    if (!selectedInvoice || !borrowerId || !selectedProgram || !requestedAmount) return;
    setRequesting(true);
    setRequestMsg('');
    try {
      const program = programs.find((p) => p.id === selectedProgram);
      await portalApi.borrowerRequestLoan({
        borrowerId,
        programId: selectedProgram,
        anchorId: selectedInvoice.anchorId,
        productType: 'INVOICE_DISCOUNTING',
        requestedAmount: parseFloat(requestedAmount),
        interestRate: program?.defaultInterestRate || 12,
        tenureDays: Math.max(1, Math.ceil((new Date(selectedInvoice.dueDate).getTime() - Date.now()) / 86400000)),
        invoiceId: selectedInvoice.id,
      });
      setRequestMsg('Discounting request submitted successfully!');
      setSelectedInvoice(null);
      setRequestedAmount('');
      setEligibilityResult(null);
      loadInvoices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setRequestMsg('Error: ' + message);
    } finally {
      setRequesting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Invoice Discounting</h1>
        <p className="text-sm text-slate-500 mt-1">Discount eligible invoices for immediate funds</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Borrower ID</label>
            <div className="flex gap-2">
              <input type="text" value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white outline-none"
                placeholder="Enter borrower ID" />
              <button onClick={loadInvoices} disabled={!borrowerId || loading}
                className="px-5 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
                {loading ? 'Loading...' : 'Load'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Program</label>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white outline-none">
              <option value="">Select a program</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.programName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {requestMsg && (
        <div className={`mb-4 p-4 rounded-lg text-sm flex items-center gap-2 ${
          requestMsg.startsWith('Error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {requestMsg.startsWith('Error')
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          </svg>
          {requestMsg}
        </div>
      )}

      {/* Eligible Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Eligible Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Amount</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">No eligible invoices found. Enter your Borrower ID and click Load.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50/80 ${selectedInvoice?.id === inv.id ? 'bg-sky-50/50' : ''}`}>
                  <td className="px-5 py-3 font-mono text-xs font-medium text-slate-700">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{inv.dueDate}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(inv.netAmount)}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(inv.eligibleAmount)}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-800">{formatCurrency(inv.availableAmount)}</td>
                  <td className="px-5 py-3 text-center">
                    <InvoiceBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => { setSelectedInvoice(inv); setRequestedAmount(inv.availableAmount?.toString() || ''); setEligibilityResult(null); }}
                      className="px-3 py-1.5 text-xs font-semibold bg-sky-600 text-white rounded-md hover:bg-sky-700">
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discounting Request Form */}
      {selectedInvoice && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Request Discounting — Invoice #{selectedInvoice.invoiceNumber}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Net Amount</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{formatCurrency(selectedInvoice.netAmount)}</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="text-xs text-emerald-600">Eligible Amount</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">{formatCurrency(selectedInvoice.eligibleAmount)}</div>
            </div>
            <div className="bg-sky-50 rounded-lg p-3">
              <div className="text-xs text-sky-600">Available Amount</div>
              <div className="text-lg font-bold text-sky-700 mt-0.5">{formatCurrency(selectedInvoice.availableAmount)}</div>
            </div>
          </div>

          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Requested Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">&#8377;</span>
                <input type="number" step="0.01" value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  max={selectedInvoice.availableAmount}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white outline-none" />
              </div>
            </div>
            <button onClick={checkEligibility} disabled={!requestedAmount || !selectedProgram}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
              Check Eligibility
            </button>
            <button onClick={requestDiscounting}
              disabled={requesting || !requestedAmount || !selectedProgram || (eligibilityResult !== null && !eligibilityResult.eligible)}
              className="px-4 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              {requesting ? 'Submitting...' : 'Request Discounting'}
            </button>
          </div>

          {eligibilityResult && (
            <div className={`p-4 rounded-lg text-sm border ${
              eligibilityResult.eligible
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="font-semibold mb-1">
                {eligibilityResult.eligible ? 'Eligible for discounting' : 'Not eligible'}
              </p>
              {eligibilityResult.eligibleAmount && (
                <p className="text-xs">Max eligible: {formatCurrency(eligibilityResult.eligibleAmount as number)}</p>
              )}
              {(eligibilityResult.reasons as string[] | undefined)?.map((r: string, i: number) => (
                <p key={i} className="text-xs text-red-600 mt-1">{r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvoiceBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    VERIFIED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    ELIGIBLE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    PARTIALLY_DISCOUNTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    FULLY_DISCOUNTED: 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${styles[status] || 'bg-slate-50 text-slate-600'}`}>
      {status}
    </span>
  );
}
