import { useQuery } from "@tanstack/react-query";
import { getClosedSalesSessions } from "../../services/reportService";

export default function useSalesSessionsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["salesSessions", page, limit],
    queryFn: () => getClosedSalesSessions({ page, limit }),
    keepPreviousData: true,
  });
}
