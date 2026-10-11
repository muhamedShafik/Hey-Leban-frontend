import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReportStatCards from "../components/reports/ReportStatCards";
import RevenueSection from "../components/reports/RevenueSection";
import PaymentsSection from "../components/reports/PaymentsSection";
import OrdersTable from "../components/reports/OrdersTable";
import useSalesSummaryQuery from "../hooks/reports/useSalesSummaryQuery";
import useReportOrdersQuery from "../hooks/reports/useReportOrdersQuery";
import { getReportDateDetails } from "../utils/dateUtils";
import ProfileDropdown from "../components/layout/ProfileDropdown";
import { exportSummaryPdf } from "../utils/pdfExport";

export default function SummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get("sessionId");
  const startDate = queryParams.get("startDate");
  const endDate = queryParams.get("endDate");
  const dateParam = queryParams.get("date");

  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryQueryError,
  } = useSalesSummaryQuery({ sessionId, startDate, endDate });

  const filterForOrders = { sessionId, startDate, endDate, type: "custom" };

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersQueryError,
  } = useReportOrdersQuery(filterForOrders, page, 20);

  const orders = summaryData?.orders;
  const payments = summaryData?.payments;
  const orderRows = ordersData?.orders ?? [];
  const pagination = ordersData?.pagination;

  const dateDetails = getReportDateDetails({
    sessionId,
    startDate,
    endDate,
    dateParam,
    sessionObj: summaryData?.session,
    fallbackDate: orderRows[0]?.orderTime,
  });

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportSummaryPdf({ summaryData, ordersData, dateDetails });
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fef9f2] font-sans text-[#1d1c18]">
      <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-[#3d0c02] px-4 py-3 text-white shadow-md md:px-6 md:py-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95"
            aria-label="Back"
          >
            <span className="text-2xl sm:text-[28px]">←</span>
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-[24px] font-bold leading-tight text-white truncate">
              Summary
            </h1>
            <p className="text-xs sm:text-[13px] font-semibold text-white/80 flex items-center gap-1.5 mt-0.5 truncate">
              <span>📅</span> {dateDetails.formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ProfileDropdown />
        </div>
      </header>

      <main className="min-h-screen px-4 pb-24 pt-4 sm:pt-6 md:px-6">
        <div className="mx-auto max-w-6xl">
          <section className="mb-6">
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-[#54433f]/60">
              Orders
            </h2>

            {summaryLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse space-y-2 rounded-2xl border border-[#d9c1bc]/20 bg-white p-4 shadow-sm"
                  >
                    <div className="h-3 w-24 rounded bg-[#f3ede7]" />
                    <div className="h-8 w-32 rounded bg-[#f3ede7]" />
                    <div className="h-3 w-20 rounded bg-[#f3ede7]" />
                  </div>
                ))}
              </div>
            ) : summaryError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {summaryQueryError?.response?.data?.message ||
                  summaryQueryError?.message ||
                  "Failed to load summary."}
              </p>
            ) : (
              <ReportStatCards orders={orders} />
            )}
          </section>

          {!summaryLoading && !summaryError && (
            <RevenueSection orders={orders} />
          )}

          {!summaryLoading && !summaryError && (
            <PaymentsSection payments={payments} navigate={navigate} totalCogs={orders?.totalCogs ?? 0} />
          )}

          <OrdersTable
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            ordersQueryError={ordersQueryError}
            orderRows={orderRows}
            pagination={pagination}
            page={page}
            setPage={setPage}
            limit={20}
          />
        </div>
      </main>

      {/* Floating Export to PDF Button */}
      <button
        type="button"
        disabled={isExporting || summaryLoading}
        onClick={handleExportPdf}
        className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] right-6 z-50 flex items-center gap-2 rounded-full bg-[#feb234] px-5 py-3 text-sm font-extrabold text-[#3d0c02] shadow-[0_8px_24px_rgba(61,12,2,0.25)] hover:bg-[#ffd06a] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 print:hidden cursor-pointer"
        aria-label="Export to PDF"
      >
        {isExporting ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#3d0c02] border-t-transparent" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <span className="text-base">📄</span>
            <span>Export PDF</span>
          </>
        )}
      </button>
    </div>
  );
}