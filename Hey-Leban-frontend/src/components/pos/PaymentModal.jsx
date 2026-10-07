import { useState, useEffect, useCallback, useMemo } from "react";
import { useCartStore } from "../../store/cartStore";

// ── Icons (inline SVG helpers) ──────────────────────────────────────────────
const CashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M2 9h2M20 9h2M2 15h2M20 15h2" />
  </svg>
);

const UpiIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <path d="M8 7v10M12 7v10M16 7v10" />
  </svg>
);

const CardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const NotPaidIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ── Unique ID generator ─────────────────────────────────────────────────────
let _uid = 0;
const uid = () => `pay_${++_uid}_${Date.now()}`;

// ── Method metadata ─────────────────────────────────────────────────────────
const METHODS = [
  { key: "CASH", label: "Cash", Icon: CashIcon },
  { key: "UPI", label: "UPI", Icon: UpiIcon },
  { key: "CARD", label: "Card", Icon: CardIcon },
];

function PaymentModal({ open, onClose, onConfirm, loading = false }) {
  const getTotal = useCartStore((state) => state.getTotal);

  // ── Local state ─────────────────────────────────────────────────────────
  // mode: null (choose method) | "PAY" | "UNPAID"
  const [mode, setMode] = useState(null);
  // Each entry: { id, method, tender (string), referenceNo }
  // - CASH:     tender = cash the customer hands over (may be < or > amountDue)
  // - UPI/CARD: tender = amount paid digitally (auto-set to amountDue, editable)
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  const total = Number(getTotal());

  // ── Compute derived per-row data ────────────────────────────────────────
  // amountDue for each row = whatever is still remaining after prior rows.
  // actualPaid = min(tender, amountDue)  — can't pay more than what's due.
  // change     = tender − amountDue      — only for CASH when tender > due.
  const { computedRows, remaining, totalCollected, totalChange } = useMemo(() => {
    let runningRemaining = total;
    let collected = 0;
    let change = 0;

    const rows = payments.map((p) => {
      const amountDue = Math.max(0, runningRemaining);
      const tender = Math.max(0, Number(p.tender) || 0);
      const actualPaid = Math.min(tender, amountDue);
      const rowChange =
        p.method === "CASH" ? Math.max(0, tender - amountDue) : 0;

      collected += actualPaid;
      change += rowChange;
      runningRemaining = Math.max(0, runningRemaining - actualPaid);

      return { ...p, amountDue, actualPaid, rowChange };
    });

    return {
      computedRows: rows,
      remaining: Math.max(0, runningRemaining),
      totalCollected: collected,
      totalChange: change,
    };
  }, [payments, total]);

  // ── Reset on open ───────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setMode(null);
      setPayments([]);
      setError("");
    }
  }, [open]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const addPayment = useCallback(
    (method) => {
      setError("");
      // remaining is computed *before* this new row exists
      if (remaining <= 0 && payments.length > 0) {
        setError("Full amount is already covered.");
        return;
      }

      const defaultTender = method === "CASH" ? "" : String(remaining > 0 ? remaining : total);

      setPayments((prev) => [
        ...prev,
        { id: uid(), method, tender: defaultTender, referenceNo: "" },
      ]);
    },
    [remaining, payments.length, total],
  );

  const updatePayment = useCallback((id, field, value) => {
    setError("");
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }, []);

  const removePayment = useCallback((id) => {
    setError("");
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const quickCash = useCallback((id, addAmt) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, tender: String(Number(p.tender || 0) + addAmt) }
          : p,
      ),
    );
  }, []);

  // ── Validation & submit ─────────────────────────────────────────────────
  const submitPayment = async () => {
    setError("");

    // --- UNPAID ---
    if (mode === "UNPAID") {
      try {
        await onConfirm({ type: "UNPAID" });
        onClose();
      } catch {}
      return;
    }

    // --- PAY validations ---
    if (computedRows.length === 0) {
      setError("Add at least one payment method.");
      return;
    }

    for (const row of computedRows) {
      const tender = Number(row.tender);
      if (!row.tender || Number.isNaN(tender) || tender <= 0) {
        setError(`Enter a valid ${row.method === "CASH" ? "cash tendered" : "pay"} amount.`);
        return;
      }
      if (row.actualPaid <= 0) {
        setError(`${row.method} payment is collecting ₹0. Remove it or adjust previous entries.`);
        return;
      }
    }

    if (remaining > 0) {
      setError(
        `₹${remaining.toFixed(2)} still remaining. Full payment is required.`,
      );
      return;
    }

    // --- Build API payload ---
    const apiPayments = computedRows.map((row) => {
      const entry = { method: row.method, amount: row.actualPaid };
      if (row.method === "CASH") {
        entry.cashTendered = Number(row.tender);
      }
      if (row.referenceNo?.trim()) {
        entry.referenceNo = row.referenceNo.trim();
      }
      return entry;
    });

    try {
      await onConfirm({ type: "PAID", payments: apiPayments });
      onClose();
    } catch {}
  };

  // ── Guard ───────────────────────────────────────────────────────────────
  if (!open) return null;

  const isFullyCovered = remaining <= 0 && payments.length > 0;
  const showSplitOption = mode === "PAY" && payments.length > 0 && remaining > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3d0c02]/60 p-4">
      <div className="w-full max-w-[460px] rounded-2xl bg-[#fef9f2] shadow-2xl flex flex-col max-h-[90vh]">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="p-6 pb-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#3d0c02]">
              Collect Payment
            </h2>
            <p className="mt-2 text-[44px] font-extrabold text-[#3d0c02] leading-none">
              ₹{total.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-[#3d0c02] hover:opacity-70 transition-opacity"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 pb-2">
          {/* ── Mode selector (initial screen) ─────────────────────────── */}
          {mode === null && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {METHODS.map(({ key, label, Icon }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setMode("PAY");
                    addPayment(key);
                  }}
                  disabled={loading}
                  className="rounded-xl border border-[#ded9d3] bg-white p-4 text-sm font-bold flex flex-col items-center gap-2 shadow-sm hover:border-[#815500] hover:bg-[#fff8eb] transition-all active:scale-[0.97]"
                >
                  <Icon />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMode("UNPAID")}
                disabled={loading}
                className="rounded-xl border border-[#ded9d3] bg-white p-4 text-sm font-bold flex flex-col items-center gap-2 shadow-sm hover:border-[#815500] hover:bg-[#fff8eb] transition-all active:scale-[0.97]"
              >
                <NotPaidIcon />
                Not Paid
              </button>
            </div>
          )}

          {/* ── UNPAID mode ───────────────────────────────────────────── */}
          {mode === "UNPAID" && (
            <div className="mb-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This order will be saved as unpaid. You can collect payment later
                from Orders.
              </div>
            </div>
          )}

          {/* ── PAY mode ──────────────────────────────────────────────── */}
          {mode === "PAY" && (
            <div className="space-y-3 mb-4">
              {computedRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-[#ded9d3] bg-white p-4 shadow-sm"
                >
                  {/* ── Row header ────────────────────────────────────── */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#feb234] text-xs font-bold text-[#3d0c02]">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-[#3d0c02]">
                        {row.method} Payment
                      </span>
                    </div>
                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayment(row.id)}
                        disabled={loading}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                      >
                        <TrashIcon />
                        Remove
                      </button>
                    )}
                  </div>

                  {/* ── Amount Due (read-only) ───────────────────────── */}
                  <div className="mb-3 rounded-xl bg-[#f8f3ec] border border-[#ded9d3] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#54433f]">
                      Amount Due
                    </span>
                    <span className="text-xl font-extrabold text-[#3d0c02]">
                      ₹{row.amountDue.toFixed(2)}
                    </span>
                  </div>

                  {/* ── CASH: tender input + quick-add + change ──────── */}
                  {row.method === "CASH" && (
                    <>
                      <div className="mb-2">
                        <label className="mb-1 block text-xs font-bold text-[#54433f]">
                          Cash Tendered
                        </label>
                        <input
                          value={row.tender}
                          onChange={(e) =>
                            updatePayment(row.id, "tender", e.target.value)
                          }
                          className="h-12 w-full rounded-xl border border-[#3d0c02] px-4 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#feb234]"
                          placeholder="₹0"
                          type="number"
                          min="0"
                          disabled={loading}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {[50, 100, 200, 500, 1000].map((amt) => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => quickCash(row.id, amt)}
                            disabled={loading}
                            className="rounded-full border border-[#ded9d3] bg-[#fef9f2] px-3 py-1.5 text-xs font-bold hover:bg-[#feb234]/20 transition-colors"
                          >
                            +₹{amt}
                          </button>
                        ))}
                      </div>

                      {/* Change (tender > amountDue) */}
                      {row.rowChange > 0 && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center">
                          <span className="text-sm font-bold text-emerald-600">
                            Change: ₹{row.rowChange.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Partial cash info (tender < amountDue) */}
                      {Number(row.tender) > 0 &&
                        Number(row.tender) < row.amountDue && (
                          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-center">
                            <span className="text-xs font-semibold text-amber-700">
                              Collecting ₹{row.actualPaid.toFixed(2)} via Cash
                              &nbsp;·&nbsp; ₹
                              {(row.amountDue - row.actualPaid).toFixed(2)}{" "}
                              needs another method
                            </span>
                          </div>
                        )}
                    </>
                  )}

                  {/* ── UPI / CARD: pay amount + reference ───────────── */}
                  {(row.method === "UPI" || row.method === "CARD") && (
                    <>
                      <div className="mb-3">
                        <label className="mb-1 block text-xs font-bold text-[#54433f]">
                          Pay Amount
                        </label>
                        <input
                          value={row.tender}
                          onChange={(e) => {
                            // Don't allow exceeding amountDue
                            const val = e.target.value;
                            if (
                              val === "" ||
                              Number(val) <= row.amountDue
                            ) {
                              updatePayment(row.id, "tender", val);
                            }
                          }}
                          className="h-12 w-full rounded-xl border border-[#3d0c02] px-4 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#feb234]"
                          placeholder="₹0"
                          type="number"
                          min="0"
                          max={row.amountDue}
                          disabled={loading}
                        />
                      </div>

                      {/* Partial digital info */}
                      {Number(row.tender) > 0 &&
                        Number(row.tender) < row.amountDue && (
                          <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-2 text-center">
                            <span className="text-xs font-semibold text-amber-700">
                              Collecting ₹{row.actualPaid.toFixed(2)} via{" "}
                              {row.method}
                              &nbsp;·&nbsp; ₹
                              {(row.amountDue - row.actualPaid).toFixed(2)}{" "}
                              needs another method
                            </span>
                          </div>
                        )}

                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#54433f]">
                          Ref No. (Optional)
                        </label>
                        <input
                          value={row.referenceNo}
                          onChange={(e) =>
                            updatePayment(row.id, "referenceNo", e.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-[#ded9d3] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#feb234]"
                          placeholder="UPI Ref / Last 4 Digits"
                          type="text"
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* ── Add split payment (when there's remaining) ────────── */}
              {showSplitOption && (
                <div className="rounded-xl border-2 border-dashed border-[#E8A020]/50 bg-[#fff8eb] p-3">
                  <p className="mb-2 text-xs font-semibold text-[#815500] text-center">
                    ₹{remaining.toFixed(2)} remaining — Add another method to
                    complete payment
                  </p>
                  <div className="flex gap-2 justify-center">
                    {METHODS.map(({ key, label, Icon }) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => addPayment(key)}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-lg border border-[#ded9d3] bg-white px-3 py-2 text-xs font-bold shadow-sm hover:border-[#815500] hover:bg-[#fff8eb] transition-all active:scale-[0.97]"
                      >
                        <Icon />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Live summary ─────────────────────────────────────── */}
              {payments.length > 0 && (
                <div className="rounded-xl border border-[#ded9d3] bg-[#f8f3ec] p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#54433f]">Order Total</span>
                    <span className="font-bold">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#54433f]">Collected</span>
                    <span className="font-bold">
                      ₹{totalCollected.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-dashed border-[#ded9d3] pt-1">
                    <span className="text-[#54433f]">Remaining</span>
                    <span
                      className={`font-extrabold ${
                        remaining > 0 ? "text-amber-600" : "text-green-600"
                      }`}
                    >
                      ₹{remaining.toFixed(2)}
                    </span>
                  </div>
                  {totalChange > 0 && (
                    <div className="flex justify-between text-xs border-t border-dashed border-[#ded9d3] pt-1">
                      <span className="text-[#54433f]">Change to Return</span>
                      <span className="font-extrabold text-green-600">
                        ₹{totalChange.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────────── */}
          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* ── Footer buttons ──────────────────────────────────────────── */}
        <div className="shrink-0 px-6 pb-6 pt-2 flex flex-col gap-3">
          {mode !== null && (
            <>
              <button
                type="button"
                onClick={submitPayment}
                disabled={loading || (mode === "PAY" && !isFullyCovered)}
                className={`h-14 rounded-xl text-lg font-extrabold transition-all ${
                  loading || (mode === "PAY" && !isFullyCovered)
                    ? "cursor-not-allowed bg-gray-300 text-gray-500"
                    : "bg-[#feb234] text-[#3d0c02] hover:bg-[#e9a020] active:scale-[0.98]"
                }`}
              >
                {loading
                  ? "Processing..."
                  : mode === "UNPAID"
                    ? "Save as Unpaid"
                    : isFullyCovered
                      ? "Confirm Payment ✓"
                      : `₹${remaining.toFixed(2)} Remaining`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(null);
                  setPayments([]);
                  setError("");
                }}
                disabled={loading}
                className="h-12 rounded-xl border border-[#ded9d3] text-sm font-medium text-[#3d0c02] hover:bg-[#f8f3ec] transition-colors"
              >
                ← Back to Methods
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-xl border border-[#3d0c02] text-lg font-medium text-[#3d0c02] hover:bg-[#f8f3ec] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;