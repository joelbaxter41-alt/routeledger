"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { money } from "@/lib/finance";
export function RevenueChart({
  data,
  currency,
}: {
  data: { month: string; revenue: number; expenses: number }[];
  currency: string;
}) {
  return (
    <div
      role="img"
      aria-label="Monthly revenue and expenses chart"
      style={{ height: 260, width: "100%" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, right: 8, top: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#258657" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#258657" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#edf0eb" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#66716a" }}
            dy={9}
          />
          <YAxis
            tickFormatter={(v) => money(v, currency)}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#66716a" }}
            width={70}
          />
          <Tooltip
            formatter={(v) => money(Number(v), currency)}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e8e2",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#258657"
            fill="url(#green)"
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="Expenses + labor"
            stroke="#c58a2b"
            fill="transparent"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
