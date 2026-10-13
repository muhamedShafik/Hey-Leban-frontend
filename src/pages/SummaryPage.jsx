import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReportStatCards from "../components/reports/ReportStatCards";
import RevenueSection from "../components/reports/RevenueSection";
import PaymentsSection from "../components/reports/PaymentsSection";
import OrdersTable from "../components/reports/OrdersTable";
import useSalesSummaryQuery from "../hooks/reports/useSalesSummaryQuery";
import useReportOrdersQuery from "../hooks/reports/useReportOrdersQuery";
import { getReportDateDetails } from "../utils/dateUtils";
import ProfileDropdown from "../components/layout/ProfileDropdown";
import { getSalesSessionOverview } from "../services/salesSessionService";
import { fetchCatalogue } from "../services/catalogueService";

// ── Money formatter ────────────────────────────────────────────────────────────
const fmt = (v) => {
  const n = Number(v || 0);
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// ── Sales Breakdown Component ─────────────────────────────────────────────────
function SalesBreakdown({ orderRows, loading }) {
  const [mode, setMode] = useState("price"); // "price" | "cogs"
  const [catalogue, setCatalogue] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetchCatalogue()
      .then((cats) => {
        if (isMounted) setCatalogue(cats || []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const { categoryRows, productRows, hasBreakdown } = useMemo(() => {
    if (!orderRows?.length) return { categoryRows: [], productRows: [], hasBreakdown: false };

    // Build catalogue lookup: product name (lowercase) -> { categoryName, price, cogs }
    const catLookup = {};
    (catalogue || []).forEach((cat) => {
      (cat.products || []).forEach((p) => {
        const key = p.name?.trim().toLowerCase();
        if (key) {
          catLookup[key] = {
            categoryName: cat.name || "Uncategorised",
            price: Number(p.price || 0),
            cogs: Number(p.cogs || 0),
          };
        }
      });
    });

    const catMap = {};
    const prodMap = {};

    orderRows.forEach((order) => {
      if (order.status === "CANCELLED") return;

      // Support both shapes: order.items (list API) and order.orderItems (detail API)
      const items = order.items || order.orderItems || [];
      items.forEach((item) => {
        const qty = Number(item.quantity) || 0;
        if (qty <= 0) return;

        const productName = item.name || item.product?.name || "Unknown";
        const meta = catLookup[productName.trim().toLowerCase()] || {};

        const categoryName =
          item.product?.category?.name ||
          item.category ||
          item.categoryName ||
          meta.categoryName ||
          "Uncategorised";

        const pricePerUnit = Number(item.price ?? item.product?.price ?? meta.price ?? 0);
        const total = Number(item.total) || (pricePerUnit > 0 ? pricePerUnit * qty : 0);

        const cogsPerUnit = Number(item.cogs ?? item.product?.cogs ?? meta.cogs ?? 0);
        const cogsTotal = cogsPerUnit * qty;

        if (!catMap[categoryName]) catMap[categoryName] = { qty: 0, total: 0, cogsTotal: 0 };
        catMap[categoryName].qty += qty;
        catMap[categoryName].total += total;
        catMap[categoryName].cogsTotal += cogsTotal;

        const key = `${categoryName}||${productName}`;
        if (!prodMap[key]) prodMap[key] = { name: productName, category: categoryName, qty: 0, total: 0, cogsTotal: 0 };
        prodMap[key].qty += qty;
        prodMap[key].total += total;
        prodMap[key].cogsTotal += cogsTotal;
      });
    });

    const pRows = Object.values(prodMap).sort((a, b) =>
      mode === "cogs" ? b.cogsTotal - a.cogsTotal : b.total - a.total
    );
    const cRows = Object.entries(catMap).sort((a, b) =>
      mode === "cogs" ? b[1].cogsTotal - a[1].cogsTotal : b[1].total - a[1].total
    );
    return { categoryRows: cRows, productRows: pRows, hasBreakdown: pRows.length > 0 };
  }, [orderRows, catalogue, mode]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#d9c1bc]/30 bg-[#fef9f2] p-5 shadow-[0_4px_8px_rgba(61,12,2,0.08)]">
        <div className="mb-4 h-5 w-44 animate-pulse rounded bg-[#f3ede7]" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-xl bg-[#f3ede7]" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasBreakdown) return null;

  const totalQty = productRows.reduce((s, p) => s + p.qty, 0);
  const totalAmt = productRows.reduce((s, p) => s + (mode === "cogs" ? p.cogsTotal : p.total), 0);

  return (
    <div className="rounded-2xl border border-[#d9c1bc]/30 bg-[#fef9f2] p-5 shadow-[0_4px_8px_rgba(61,12,2,0.08)]">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="flex items-center gap-2 text-[18px] font-bold text-[#0e0100]">
            🗂️ Sales Breakdown
          </h2>
          <span className="rounded-full bg-[#3d0c02]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#3d0c02]">
            {orderRows?.length || 0} orders analysed
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-[#d9c1bc]/50 bg-[#f2ede6] p-1">
            {["price", "cogs"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 text-[12px] font-bold transition-all ${
                  mode === m ? "bg-[#3d0c02] text-white shadow-sm" : "text-[#54433f] hover:text-[#0e0100]"
                }`}
              >
                {m === "price" ? "💰 Price" : "🏭 COGS"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#54433f]">By Category</p>
        <div className="flex flex-wrap gap-2">
          {categoryRows.map(([cat, data]) => (
            <div key={cat} className="flex items-center gap-2 rounded-full border border-[#d9c1bc]/40 bg-[#f8f3ec] px-4 py-1.5">
              <span className="text-[13px] font-bold text-[#0e0100]">{cat}</span>
              <span className="rounded-full bg-[#3d0c02]/10 px-2 py-0.5 text-[11px] font-bold text-[#3d0c02]">
                {data.qty} sold
              </span>
              <span className="text-[13px] font-semibold text-[#54433f]">
                {fmt(mode === "cogs" ? data.cogsTotal : data.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Product breakdown */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#54433f]">By Product</p>

        {/* Mobile cards */}
        <div className="flex flex-col gap-2 sm:hidden">
          {productRows.map((p, i) => (
            <div
              key={`${p.category}-${p.name}`}
              className={`flex items-center justify-between gap-3 rounded-xl border border-[#e6e2db] px-4 py-3 ${
                i % 2 === 0 ? "bg-[#fef9f2]" : "bg-[#f8f3ec]/60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#0e0100]">{p.name}</p>
                <p className="mt-0.5 text-[11px] text-[#86736e]">{p.category}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#3d0c02]/10 px-2.5 py-0.5 text-[12px] font-bold text-[#3d0c02]">
                ×{p.qty}
              </span>
              <span className="shrink-0 text-[14px] font-bold text-[#0e0100]" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                {fmt(mode === "cogs" ? p.cogsTotal : p.total)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e6e2db] bg-[#f2ede6] px-4 py-3">
            <p className="text-[13px] font-bold text-[#0e0100]">Total</p>
            <span className="rounded-full bg-[#3d0c02]/10 px-2.5 py-0.5 text-[12px] font-bold text-[#3d0c02]">×{totalQty}</span>
            <span className="text-[14px] font-bold text-[#0e0100]" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
              {fmt(totalAmt)}
            </span>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-[#e6e2db] sm:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#f2ede6] text-left">
                <th className="whitespace-nowrap px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#54433f]">Product</th>
                <th className="whitespace-nowrap px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#54433f]">Category</th>
                <th className="whitespace-nowrap px-4 py-2 text-center text-[12px] font-bold uppercase tracking-wider text-[#54433f]">Qty</th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-[12px] font-bold uppercase tracking-wider text-[#54433f]">
                  {mode === "cogs" ? "COGS" : "Amount"}
                </th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((p, i) => (
                <tr key={`${p.category}-${p.name}`} className={i % 2 === 0 ? "bg-[#fef9f2]" : "bg-[#f8f3ec]/60"}>
                  <td className="px-4 py-2.5 font-semibold text-[#0e0100]">{p.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#54433f]">{p.category}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="rounded-full bg-[#3d0c02]/10 px-2.5 py-0.5 text-[12px] font-bold text-[#3d0c02]">×{p.qty}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold text-[#0e0100]" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                    {fmt(mode === "cogs" ? p.cogsTotal : p.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#e6e2db] bg-[#f2ede6]">
                <td colSpan={2} className="px-4 py-2.5 text-[13px] font-bold text-[#0e0100]">Total</td>
                <td className="px-4 py-2.5 text-center text-[13px] font-bold text-[#0e0100]">×{totalQty}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] font-bold text-[#0e0100]" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
                  {fmt(totalAmt)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get("sessionId");
  const startDate = queryParams.get("startDate");
  const endDate = queryParams.get("endDate");
  const dateParam = queryParams.get("date");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50); // 20, 50, 100, 200, 500, 1000

  const summaryParams = sessionId ? { sessionId } : { startDate, endDate };

  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryQueryError,
  } = useSalesSummaryQuery(summaryParams);

  const filterForOrders = sessionId
    ? { sessionId }
    : { startDate, endDate, type: "custom" };

  // Paginated orders for the orders table
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersQueryError,
  } = useReportOrdersQuery(filterForOrders, page, limit);

  const orders = summaryData?.orders;
  const payments = summaryData?.payments;
  const orderRows = ordersData?.orders ?? [];
  const pagination = ordersData?.pagination;

  // All orders with full item detail for breakdown
  // For sessionId views → use getSalesSessionOverview (has orderItems with totals + categories)
  // For date-range views → fall back to high-limit report orders
  const [overviewOrderList, setOverviewOrderList] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setOverviewOrderList(null);
      return;
    }
    let cancelled = false;
    setOverviewLoading(true);
    getSalesSessionOverview(sessionId)
      .then((data) => {
        if (!cancelled) setOverviewOrderList(data?.orderList ?? []);
      })
      .catch(() => {
        if (!cancelled) setOverviewOrderList([]);
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  // High-limit report orders for breakdown and full COGS calculation (independent of table pagination)
  const {
    data: allOrdersData,
    isLoading: allOrdersQueryLoading,
  } = useReportOrdersQuery(
    filterForOrders,
    1,
    1000
  );

  // Choose the best available data source
  const breakdownOrders = useMemo(() => {
    if (overviewOrderList && overviewOrderList.length > 0) return overviewOrderList;
    if (allOrdersData?.orders && allOrdersData.orders.length > 0) return allOrdersData.orders;
    if (ordersData?.orders && ordersData.orders.length > 0) return ordersData.orders;
    return [];
  }, [overviewOrderList, allOrdersData?.orders, ordersData?.orders]);

  const breakdownLoading = sessionId ? (overviewLoading && allOrdersQueryLoading) : allOrdersQueryLoading;

  // Calculate total COGS across breakdown or orders (excluding cancelled)
  const computedTotalCogs = useMemo(() => {
    const list = breakdownOrders?.length ? breakdownOrders : orderRows;
    return list.reduce((acc, order) => {
      if (order.status === "CANCELLED") return acc;
      const items = order.orderItems || order.items || [];
      const orderCogs = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const cogsPerUnit = Number(item.cogs ?? item.product?.cogs ?? 0);
        return sum + cogsPerUnit * qty;
      }, 0);
      return acc + orderCogs;
    }, 0);
  }, [breakdownOrders, orderRows]);

  const totalCogs = Number(
    orders?.totalCogs ??
    summaryData?.cogs ??
    summaryData?.profitAndLoss?.cogs ??
    computedTotalCogs ??
    0
  );

  const dateDetails = getReportDateDetails({
    sessionId,
    startDate,
    endDate,
    dateParam,
    sessionObj: summaryData?.session,
    fallbackDate: orderRows[0]?.orderTime,
  });

  return (
    <div className="min-h-screen bg-[#fef9f2] font-sans text-[#1d1c18]">
      <header className="fixed left-0 top-0 z-50 flex h-[80px] w-full items-center justify-between bg-[#3d0c02] px-4 text-white shadow-md md:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="Back"
          >
            <span className="text-[28px]">←</span>
          </button>

          <div className="flex flex-col">
            <h1 className="text-[24px] font-bold leading-tight text-white">Summary</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-white/80">
              <span>📅</span> {dateDetails.formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full bg-[#feb234] px-5 py-2 text-[13px] font-bold text-[#3d0c02] transition hover:bg-[#ffd06a]"
          >
            <span>⬇</span> Export PDF
          </button>
          <ProfileDropdown />
        </div>
      </header>

      <main className="min-h-screen px-4 pb-10 pt-[96px] md:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Orders stat cards */}
          <section>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-[#54433f]/60">Orders</h2>
            {summaryLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2 rounded-2xl border border-[#d9c1bc]/20 bg-white p-4 shadow-sm">
                    <div className="h-3 w-24 rounded bg-[#f3ede7]" />
                    <div className="h-8 w-32 rounded bg-[#f3ede7]" />
                    <div className="h-3 w-20 rounded bg-[#f3ede7]" />
                  </div>
                ))}
              </div>
            ) : summaryError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {summaryQueryError?.response?.data?.message || summaryQueryError?.message || "Failed to load summary."}
              </p>
            ) : (
              <ReportStatCards orders={orders} />
            )}
          </section>

          {!summaryLoading && !summaryError && <RevenueSection orders={orders} />}

          {!summaryLoading && !summaryError && (
            <PaymentsSection payments={payments} navigate={navigate} totalCogs={totalCogs} />
          )}

          {/* Sales Breakdown */}
          <SalesBreakdown
            orderRows={breakdownOrders}
            loading={breakdownLoading}
          />

          {/* Orders table */}
          <OrdersTable
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            ordersQueryError={ordersQueryError}
            orderRows={orderRows}
            pagination={pagination}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
          />
        </div>
      </main>
    </div>
  );
}