// src/components/settings/items/QuickItemCogsModal.jsx
import React, { useState, useEffect } from "react";

const PERCENTAGE_PRESETS = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
];

function QuickItemCogsModal({ isOpen, item, onClose, onSave, isLoading }) {
  const [cogs, setCogs] = useState("");
  const [percent, setPercent] = useState("");

  useEffect(() => {
    if (!item) return;
    const initialPrice = Number(item.price || 0);
    const initialCogs = item.cogs != null ? Number(item.cogs) : null;

    if (initialCogs !== null && !Number.isNaN(initialCogs)) {
      setCogs(String(initialCogs));
      if (initialPrice > 0) {
        const pct = (initialCogs / initialPrice) * 100;
        setPercent(Number.isInteger(pct) ? String(pct) : pct.toFixed(1));
      } else {
        setPercent("");
      }
    } else {
      setCogs("");
      setPercent("");
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const priceNum = Number(item.price || 0);
  const cogsNum = Number(cogs || 0);

  const handleCogsChange = (e) => {
    const val = e.target.value;
    setCogs(val);
    if (priceNum > 0 && val !== "" && !Number.isNaN(Number(val))) {
      const pct = (Number(val) / priceNum) * 100;
      setPercent(Number.isInteger(pct) ? String(pct) : pct.toFixed(1));
    } else {
      setPercent("");
    }
  };

  const applyPercent = (pctVal) => {
    setPercent(pctVal);
    if (!pctVal || Number.isNaN(Number(pctVal))) {
      setCogs("");
      return;
    }
    if (priceNum > 0) {
      const calculated = ((priceNum * Number(pctVal)) / 100).toFixed(2);
      setCogs(calculated);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const finalCogs = cogs === "" ? null : Number(cogs);
    onSave(item, finalCogs);
  };

  const grossProfit = priceNum > 0 && cogs !== "" ? (priceNum - cogsNum).toFixed(2) : null;
  const marginPct = priceNum > 0 && cogs !== "" ? ((1 - cogsNum / priceNum) * 100).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-[#ded9d3] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-[#ded9d3] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3e7cb] text-sm font-extrabold text-[#8c5307]">
                %
              </span>
              <h3 className="text-xl font-extrabold text-[#3d0c02]">Set Item COGS</h3>
            </div>
            <p className="mt-1 text-sm font-bold text-[#54433f]">{item.name}</p>
            <p className="text-xs text-[#7d6861]">
              Category: {item.categoryName || "General"} · Retail Price:{" "}
              <strong className="text-[#3d0c02]">₹{priceNum.toFixed(2)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-[#54433f] hover:bg-[#f8f3ec] hover:text-[#3d0c02] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold text-[#3d0c02]">
                Cost of Goods Sold (COGS)
              </label>
              {percent && Number(percent) > 0 ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f3e7cb] text-[#8c5307]">
                  {percent}% of Retail
                </span>
              ) : null}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8c5307]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cogs}
                  onChange={handleCogsChange}
                  placeholder="0.00"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-[#ded9d3] bg-[#fef9f2] pl-7 pr-3 outline-none focus:border-[#E8A020] text-sm font-medium"
                />
              </div>

              <div className="w-40">
                <select
                  value={percent || ""}
                  onChange={(e) => applyPercent(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#ded9d3] bg-[#fef9f2] px-3 font-semibold text-xs text-[#3d0c02] outline-none focus:border-[#E8A020] cursor-pointer"
                >
                  <option value="">Select % of Retail</option>
                  {percent && !PERCENTAGE_PRESETS.map(String).includes(String(percent)) ? (
                    <option value={percent}>Current ({percent}%)</option>
                  ) : null}
                  {PERCENTAGE_PRESETS.map((pct) => (
                    <option key={pct} value={String(pct)}>
                      {pct}% of Retail
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-[#7d6861]">
              Select a percentage or type the cost amount directly.
            </p>
          </div>

          {/* Live Profit Preview */}
          {grossProfit !== null && marginPct !== null ? (
            <div className="rounded-xl border border-[#c4e8ce] bg-[#eaf7ee] p-3 text-xs text-[#1b6b33] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold block text-[#1b6b33]/80">
                  Gross Profit
                </span>
                <strong className="text-base font-extrabold">₹{grossProfit}</strong>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider font-semibold block text-[#1b6b33]/80">
                  Profit Margin
                </span>
                <strong className="text-base font-extrabold">{marginPct}%</strong>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ded9d3]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 rounded-xl border border-[#ded9d3] bg-white px-4 text-xs font-bold text-[#54433f] hover:bg-[#f8f3ec] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 rounded-xl bg-[#3d0c02] px-5 text-xs font-bold text-white hover:bg-[#5a1204] transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save COGS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickItemCogsModal;
