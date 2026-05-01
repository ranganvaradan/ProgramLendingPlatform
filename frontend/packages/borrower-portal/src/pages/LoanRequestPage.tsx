import { useState } from 'react';
import { eligibilityApi, portalApi } from '@plp/shared';
import type { EligibilityResult } from '@plp/shared';

export default function LoanRequestPage() {
  const [borrowerId, setBorrowerId] = useState('');
  const [programId, setProgramId] = useState('');
  const [amount, setAmount] = useState('');
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const checkEligibility = async () => {
    if (!borrowerId || !programId || !amount) return;
    setChecking(true);
    setEligibility(null);
    try {
      const res = await eligibilityApi.check(borrowerId, programId, parseFloat(amount));
      setEligibility(res.data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Eligibility check failed';
      setResult({ success: false, message: msg });
    } finally {
      setChecking(false);
    }
  };

  const requestLoan = async () => {
    if (!eligibility?.eligible) return;
    setRequesting(true);
    try {
      await portalApi.borrowerRequestLoan({
        borrowerId,
        programId,
        productType: 'PAY_DAY_LOAN',
        requestedAmount: parseFloat(amount),
        interestRate: 18.0,
        tenureDays: 30,
      });
      setResult({ success: true, message: 'Loan request submitted successfully!' });
      setEligibility(null);
      setAmount('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Loan request failed';
      setResult({ success: false, message: msg });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Request Pay Day Loan</h1>
        <p className="text-sm text-slate-500 mt-1">Check eligibility and submit a loan request</p>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Borrower ID</label>
              <input value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white outline-none"
                placeholder="Enter your UUID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Program ID</label>
              <input value={programId} onChange={(e) => setProgramId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white outline-none"
                placeholder="Enter program UUID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Requested Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">&#8377;</span>
                <input type="number" step="100" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white outline-none" />
              </div>
            </div>
            <button onClick={checkEligibility} disabled={checking || !borrowerId || !programId || !amount}
              className="w-full bg-sky-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              {checking ? 'Checking...' : 'Check Eligibility'}
            </button>
          </div>

          {eligibility && (
            <div className={`mt-5 p-4 rounded-lg border ${eligibility.eligible ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <svg className={`w-5 h-5 ${eligibility.eligible ? 'text-emerald-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {eligibility.eligible
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  }
                </svg>
                <span className={`text-sm font-semibold ${eligibility.eligible ? 'text-emerald-700' : 'text-red-700'}`}>
                  {eligibility.eligible ? 'Eligible for Loan' : 'Not Eligible'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="bg-white/60 rounded-md p-2.5">
                  <div className="text-xs text-slate-500">Eligible Amount</div>
                  <div className="font-bold text-slate-800">&#8377;{eligibility.eligibleAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white/60 rounded-md p-2.5">
                  <div className="text-xs text-slate-500">Active Loans</div>
                  <div className="font-bold text-slate-800">{eligibility.activeLoans}</div>
                </div>
              </div>
              {eligibility.reasons.length > 0 && (
                <ul className="text-xs text-red-600 space-y-1 mb-3">
                  {eligibility.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-0.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              {eligibility.eligible && (
                <button onClick={requestLoan} disabled={requesting}
                  className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  {requesting ? 'Submitting...' : 'Submit Loan Request'}
                </button>
              )}
            </div>
          )}

          {result && (
            <div className={`mt-4 p-4 rounded-lg text-sm flex items-center gap-2 ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {result.success
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                }
              </svg>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
