import { api } from "./api";
import type { DashboardAnalytics } from "@/types";

export function getDashboard() {
  return api.get<DashboardAnalytics>("/api/analytics/dashboard").then((res) => res.data);
}
