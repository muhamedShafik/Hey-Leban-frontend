import { useQuery } from "@tanstack/react-query";
import { getBusinessReport } from "../../services/reportService";

export default function useBusinessReportQuery({ sessionId, startDate, endDate }) {
  return useQuery({
    queryKey: ["businessReport", sessionId, startDate, endDate],
    queryFn: () => getBusinessReport({ sessionId, startDate, endDate }),
    enabled: !!sessionId || !!(startDate && endDate),
  });
}
