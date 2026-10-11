// src/components/settings/items/CategoryCogsModal.jsx
import React, { useState, useEffect, useMemo } from "react";

const PERCENTAGE_PRESETS = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
];

function CategoryCogsModal({
  isOpen,
  initialCategory,
  categories = [],
  onClose,
  onApplyCategoryCogs,
  isLoading,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [percent, setPercent] = useState("30");
  const [customPercent, setCustomPercent] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialCategory?.id) {
      setSelectedCategoryId(initialCategory.id);
    } else if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
    setPercent("30");
    setCustomPercent("");
    setUseCustom(false);
  }, [isOpen, initialCategory, categories]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || initialCategory || null;
  }, [categories, selectedCategoryId, initialCategory]);

  const products = useMemo(() => {
    return activeCategory?.products || [];
  }, [activeCategory]);

  const effectivePercent = useMemo(() => {
    if (useCustom) {
      const num = Number(customPercent);
      return !Number.isNaN(num) && num > 0 ? num : 0;
    }
    const num = Number(percent);
    return !Number.isNaN(num) && num > 0 ? num : 0;
  }, [useCustom, customPercent, percent]);

  if (!isOpen) return null;

  const handleApply = (e) => {
    e.preventDefault();
    if (!activeCategory || effectivePercent <= 0) return;
    onApplyCategoryCogs(activeCategory, effectivePercent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-[#ded9d3] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#ded9d3] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e7cb] text-base font-extrabold text-[#8c5307]">
                %
              </span>
              <h3 className="text-xl font-extrabold text-[#3d0c02]">
                Apply Category COGS
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#54433f]">
              Bulk calculate and apply a uniform cost percentage to all products in a category.
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

        <form onSubmit={handleApply} className="flex-1 overflow-y-auto pt-4 space-y-4">
          {/* Category Selector & Percentage Inputs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#3d0c02]">
                Target Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#ded9d3] bg-[#fef9f2] px-3 text-sm font-semibold text-[#3d0c02] outline-none focus:border-[#E8A020] cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.products?.length || 0} items)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#3d0c02]">
                  COGS Percentage of Retail
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustom(!useCustom)}
                  className="text-[11px] font-semibold text-[#8c5307] hover:underline"
                >
                  {useCustom ? "Use Presets" : "Custom %"}
                </button>
              </div>

              {!useCustom ? (
                <select
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#ded9d3] bg-[#fef9f2] px-3 text-sm font-semibold text-[#3d0c02] outline-none focus:border-[#E8A020] cursor-pointer"
                >
                  {PERCENTAGE_PRESETS.map((pct) => (
                    <option key={pct} value={String(pct)}>
                      {pct}% of Retail Price
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={customPercent}
                    onChange={(e) => setCustomPercent(e.target.value)}
                    placeholder="Enter % (e.g. 28.5)"
                    autoFocus
                    className="h-11 w-full rounded-xl border border-[#ded9d3] bg-[#fef9f2] pl-3 pr-8 text-sm font-semibold outline-none focus:border-[#E8A020]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8c5307] pointer-events-none">
                    %
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-xl border border-[#e3d7cb] bg-[#fffaf3] p-3 text-xs text-[#54433f] flex items-center justify-between">
            <span>
              Applying <strong>{effectivePercent}%</strong> COGS will calculate:{" "}
              <code className="text-[#8c5307] font-semibold bg-white px-1.5 py-0.5 rounded border border-[#e3d7cb]">
                Price × {effectivePercent}%
              </code>
            </span>
            <span className="text-[#1b6b33] font-bold">
              Gross Margin: {(100 - effectivePercent).toFixed(1)}%
            </span>
          </div>

          {/* Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#7d6861]">
                Impact Preview ({products.length} Products)
              </h4>
              <span className="text-[11px] text-[#7d6861]">
                Check calculated COGS before applying
              </span>
            </div>

            <div className="rounded-xl border border-[#ded9d3] overflow-hidden bg-white max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f3ec] border-b border-[#ded9d3] text-[#54433f] sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 font-bold">Product</th>
                    <th className="px-3 py-2.5 font-bold text-right">Retail Price</th>
                    <th className="px-3 py-2.5 font-bold text-right">Current COGS</th>
                    <th className="px-3 py-2.5 font-bold text-right text-[#8c5307]">
                      New COGS ({effectivePercent}%)
                    </th>
                    <th className="px-3 py-2.5 font-bold text-right text-[#1b6b33]">
                      Est. Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece7e1]">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-6 text-center text-[#7d6861]">
                        No products in this category.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const retail = Number(p.price || 0);
                      const currentCogs = p.cogs != null ? Number(p.cogs) : null;
                      const newCogs = ((retail * effectivePercent) / 100);
                      const profit = (retail - newCogs);

                      return (
                        <tr key={p.id} className="hover:bg-[#fefcf9]">
                          <td className="px-3 py-2 font-medium text-[#3d0c02]">{p.name}</td>
                          <td className="px-3 py-2 text-right font-semibold">₹{retail.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-[#7d6861]">
                            {currentCogs !== null ? `₹${currentCogs.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-[#8c5307]">
                            ₹{newCogs.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-[#1b6b33]">
                            ₹{profit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ded9d3]">
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
              disabled={isLoading || products.length === 0 || effectivePercent <= 0}
              className="h-10 rounded-xl bg-[#3d0c02] px-5 text-xs font-bold text-white hover:bg-[#5a1204] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Applying to {products.length} Items...</span>
                </>
              ) : (
                `Apply to All ${products.length} Products`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryCogsModal;
