import { useQuery } from "@tanstack/react-query";
import { getSalesSummary } from "../../services/reportService";

export default function useSalesSummaryQuery({ sessionId, startDate, endDate }) {
  return useQuery({
    queryKey: ["salesSummary", sessionId, startDate, endDate],
    queryFn: () => getSalesSummary({ sessionId, startDate, endDate }),
    enabled: !!sessionId || !!(startDate && endDate),
  });
}
