// src/pages/InventoryPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalogueQuery } from "../hooks/items/useCatalogueQuery";
import { useInventoryQuery } from "../hooks/inventory/useInventoryQuery";
import { useInventoryMutations } from "../hooks/inventory/useInventoryMutations";

const InventoryPage = () => {
  const navigate = useNavigate();
  const { data: categories = [], isLoading: catLoading } = useCatalogueQuery();
  const { data: inventoryData = [], isLoading: invLoading } = useInventoryQuery();
  const { updateInventoryMutation } = useInventoryMutations();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    product: null,
    currentStock: 0,
    addQuantity: 0,
    note: "",
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = ({ type = "success", title, message }) => {
    setToast({
      id: Date.now(),
      type,
      title,
      message,
    });
  };

  const inventoryMap = useMemo(() => {
    const map = {};
    if (Array.isArray(inventoryData)) {
      inventoryData.forEach((inv) => {
        map[inv.productId] = inv;
      });
    }
    return map;
  }, [inventoryData]);

  // Merge products from catalogue with inventory
  const products = useMemo(() => {
    const list = [];
    categories.forEach((cat) => {
      (cat.products || []).forEach((prod) => {
        const inv = inventoryMap[prod.id] || {};
        list.push({
          ...prod,
          categoryName: cat.name,
          inHandCount: inv.inHandCount || 0,
          reorderLevel: inv.reorderLevel || 0,
          updatedAt: inv.updatedAt || null,
        });
      });
    });
    return list;
  }, [categories, inventoryMap]);

  const visibleProducts = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search);
      const matchCat = selectedCategory === "All" || p.categoryName === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const categoryNames = useMemo(() => {
    return ["All", ...categories.map((c) => c.name)];
  }, [categories]);

  const openModal = (product) => {
    setModalState({
      isOpen: true,
      product,
      currentStock: product.inHandCount,
      addQuantity: 0,
      note: "",
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      product: null,
      currentStock: 0,
      addQuantity: 0,
      note: "",
    });
  };

  const adjustQuantity = (val) => {
    setModalState((prev) => ({
      ...prev,
      addQuantity: Math.max(0, prev.addQuantity + val),
    }));
  };

  const setAdd = (val) => {
    setModalState((prev) => ({
      ...prev,
      addQuantity: val,
    }));
  };

  const handleConfirmAddStock = async () => {
    if (modalState.addQuantity <= 0) {
       showToast({ type: "error", title: "Invalid Quantity", message: "Please enter a quantity greater than 0" });
       return;
    }
    
    try {
      const payload = {
        addQuantity: modalState.addQuantity,
      };

      if (modalState.note && modalState.note.trim() !== "") {
        payload.note = modalState.note.trim();
      }

      await updateInventoryMutation.mutateAsync({
        productId: modalState.product.id,
        payload,
      });

      showToast({ type: "success", title: "Stock Added", message: `Added ${modalState.addQuantity} to ${modalState.product.name}` });
      closeModal();
    } catch (error) {
      const errorData = error?.response?.data;
      const detailMessage = errorData?.error?.[0]?.message;
      const mainMessage = errorData?.message || "Failed to update stock";
      
      showToast({
         type: "error",
         title: "Update Failed",
         message: detailMessage || mainMessage
      });
    }
  };

  const isLoading = catLoading || invLoading;

  return (
    <div className="bg-[#fef9f2] text-[#1d1c18] font-sans min-h-screen overflow-x-hidden">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#3d0c02] text-white shadow-md flex justify-between items-center w-full px-6 h-16 max-w-full mx-auto">
        <div className="flex items-center gap-4">
           <button
            type="button"
            onClick={() => navigate("/settings")}
            className="flex h-12 w-12 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="Back to Settings"
          >
            <span className="text-[28px]">←</span>
          </button>
          <span className="text-xl font-bold">Confectionery POS</span>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-[1440px] mx-auto px-6 pt-24 pb-6">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#3d0c02]">Stock Management</h1>
            <p className="text-[#54433f] text-sm font-semibold">Monitor and update your artisanal inventory levels.</p>
          </div>
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#54433f]">🔍</span>
            <input
              className="w-full h-12 pl-10 pr-4 bg-white border border-[#d9c1bc] rounded-xl focus:ring-2 focus:ring-[#3d0c02] focus:border-transparent transition-all placeholder:text-[#54433f]/60 text-base outline-none"
              placeholder="Search item names..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 h-10 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-[#feb234] text-[#6d4700] shadow-sm"
                  : "bg-[#ece7e1] text-[#54433f] hover:bg-[#e6e2db]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stock Table Container */}
        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(61,12,2,0.08)] overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f3ec] border-b border-[#ece7e1]">
                  <th className="px-6 py-4 text-sm font-semibold text-[#54433f]">#</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#54433f]">Item Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#54433f]">Category</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#54433f]">Stock (pcs)</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#54433f]">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#54433f]">Last Updated</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#54433f] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece7e1]">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-[#54433f]">Loading inventory...</td>
                  </tr>
                ) : visibleProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-[#54433f]">No items found.</td>
                    </tr>
                ) : (
                  visibleProducts.map((prod, idx) => {
                    let statusLabel = "In Stock";
                    let statusClasses = "bg-green-100 text-[#2E7D32]";
                    
                    if (prod.inHandCount <= 0) {
                       statusLabel = "Out of Stock";
                       statusClasses = "bg-red-100 text-[#C62828]";
                    } else if (prod.inHandCount <= prod.reorderLevel) {
                       statusLabel = "Low Stock";
                       statusClasses = "bg-orange-100 text-[#E65100]";
                    }

                    return (
                      <tr key={prod.id} className="hover:bg-[#ffffff] transition-colors group">
                        <td className="px-6 py-4 text-base text-[#54433f]">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#0e0100]">{prod.name}</td>
                        <td className="px-6 py-4 text-base text-[#54433f]">{prod.categoryName}</td>
                        <td className="px-6 py-4 text-xl font-semibold text-[#1d1c18]">
                          {prod.inHandCount} <span className="text-xs font-semibold opacity-60">pcs</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${statusClasses}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-base text-[#54433f]">
                            {prod.updatedAt ? new Date(prod.updatedAt).toLocaleString() : "Never"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openModal(prod)}
                            className="px-4 py-2 border border-[#3d0c02] text-[#3d0c02] rounded-lg text-sm font-semibold hover:bg-[#3d0c02] hover:text-white transition-all"
                          >
                            Add Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Stock Addition Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#0e0100]/40 backdrop-blur-[8px]" onClick={closeModal}></div>
          {/* Modal Card */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_4px_12px_rgba(61,12,2,0.08)] overflow-hidden mx-6 animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-8 pb-6 bg-[#f8f3ec] border-b border-[#ece7e1]">
              <h2 className="text-2xl font-semibold text-[#3d0c02]">Add Stock - {modalState.product?.name}</h2>
              <p className="text-[#54433f] text-base mt-1">Current: {modalState.currentStock} pcs</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Numeric Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#54433f]">Add Quantity (pcs)</label>
                <div className="flex items-center gap-4">
                  <button
                    className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-[#DED9D3] text-[#3d0c02] hover:bg-gray-50"
                    onClick={() => adjustQuantity(-1)}
                  >
                    <span className="text-2xl">−</span>
                  </button>
                  <input
                    className="flex-1 h-14 text-center text-2xl font-semibold border-2 border-[#DED9D3] rounded-xl focus:border-[#815500] outline-none transition-colors"
                    min="0"
                    type="number"
                    value={modalState.addQuantity}
                    onChange={(e) => setAdd(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <button
                    className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-[#DED9D3] text-[#3d0c02] hover:bg-gray-50"
                    onClick={() => adjustQuantity(1)}
                  >
                    <span className="text-2xl">+</span>
                  </button>
                </div>
              </div>
              {/* Quick Add Row */}
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 25, 50].map((val) => (
                  <button
                    key={val}
                    className="h-11 rounded-xl border border-[#feb234] bg-[#feb234]/10 text-[#624000] text-sm font-semibold hover:bg-[#feb234]/20 transition-colors"
                    onClick={() => setAdd(val)}
                  >
                    +{val}
                  </button>
                ))}
              </div>
              {/* Note Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#54433f]">Note (Optional)</label>
                <textarea
                  className="w-full h-24 p-4 border border-[#d9c1bc] rounded-xl focus:ring-2 focus:ring-[#3d0c02] outline-none transition-all text-base resize-none"
                  placeholder="Reason for adjustment..."
                  value={modalState.note}
                  onChange={(e) => setModalState(prev => ({...prev, note: e.target.value}))}
                ></textarea>
              </div>
              {/* Preview Banner */}
              <div className="p-4 bg-[#F8F3EC] rounded-xl border border-[#DED9D3] flex justify-between items-center">
                <span className="text-sm font-semibold text-[#54433f]">Updated Total</span>
                <span className="text-xl font-semibold text-[#0e0100]">
                  {modalState.currentStock + modalState.addQuantity} pcs
                </span>
              </div>
              {/* Modal Actions */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  className="flex-1 h-[44px] text-sm font-semibold text-[#54433f] hover:text-[#0e0100] transition-colors"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className={`flex-[2] h-[44px] rounded-xl bg-[#feb234] text-[#6d4700] text-xl font-semibold shadow-sm hover:bg-[#ffbd4d] transition-colors flex justify-center items-center ${updateInventoryMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={handleConfirmAddStock}
                  disabled={updateInventoryMutation.isPending}
                >
                  {updateInventoryMutation.isPending ? "Updating..." : "Confirm Add Stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Toast Notifications */}
       {toast && (
          <div className="pointer-events-none fixed right-6 top-20 z-[200]">
              <div
                  className={`pointer-events-auto min-w-[320px] max-w-[420px] rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur-sm transition-all ${toast.type === "success"
                          ? "border-emerald-200 bg-white text-[#3d0c02]"
                          : "border-red-200 bg-white text-[#3d0c02]"
                      }`}
              >
                  <div className="flex items-start gap-3">
                      <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toast.type === "success"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                      >
                          {toast.type === "success" ? "✓" : "!"}
                      </div>

                      <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold">{toast.title}</h4>
                          <p className="mt-1 text-sm text-[#54433f]">{toast.message}</p>
                      </div>

                      <button
                          type="button"
                          onClick={() => setToast(null)}
                          className="text-lg leading-none text-[#3d0c02]/50 hover:text-[#3d0c02]"
                      >
                          ×
                      </button>
                  </div>

                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#f3eee8]">
                      <div
                          className={`h-full rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
                              }`}
                          style={{ animation: "toastShrink 3s linear forwards" }}
                      />
                  </div>
              </div>
          </div>
       )}
       <style>{`
          @keyframes toastShrink {
            from { width: 100%; }
            to { width: 0%; }
          }
          .scrollbar-hide::-webkit-scrollbar {
              display: none;
          }
          .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
        `}</style>
    </div>
  );
};

export default InventoryPage;
