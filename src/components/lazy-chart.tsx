"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("./chart").then((m) => m.RevenueChart), {
  ssr: false,
  loading: () => (
    <div role="status" className="chart-empty">
      Loading chart…
    </div>
  ),
});
export function LazyChart(props: {
  data: { month: string; revenue: number; expenses: number }[];
  currency: string;
}) {
  return <Chart {...props} />;
}
