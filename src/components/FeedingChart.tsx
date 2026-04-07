"use client";

import { useState } from "react";
import { format, subDays, startOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Feeding } from "@/lib/types";

interface Props {
  feedings: Feeding[];
}

interface DayData {
  date: string;
  label: string;
  bottleMl: number;
  snackMl: number;
  totalMl: number;
  bottleCount: number;
  snackCount: number;
}

function buildDailyData(feedings: Feeding[], days: number): DayData[] {
  const data: DayData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(subDays(now, i));
    const nextDay = startOfDay(subDays(now, i - 1));
    const dayFeedings = feedings.filter((f) => {
      const t = new Date(f.fed_at);
      return t >= day && t < nextDay;
    });

    const bottles = dayFeedings.filter((f) => f.type === "bottle");
    const snacks = dayFeedings.filter((f) => f.type === "breast_snack");
    const bottleMl = bottles.reduce((s, f) => s + (f.amount_ml || 0), 0);
    const snackMl = snacks.reduce((s, f) => s + (f.amount_ml || 0), 0);

    data.push({
      date: format(day, "yyyy-MM-dd"),
      label: i === 0 ? "Today" : i === 1 ? "Yday" : format(day, "M/d"),
      bottleMl,
      snackMl,
      totalMl: bottleMl + snackMl,
      bottleCount: bottles.length,
      snackCount: snacks.length,
    });
  }

  return data;
}

export default function FeedingChart({ feedings }: Props) {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [range, setRange] = useState<7 | 14>(7);

  const data = buildDailyData(feedings, range);
  const maxMl = Math.max(...data.map((d) => d.totalMl), 100);

  return (
    <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{"\uD83D\uDCC8"}</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-brown-lighter">
            Feeding Trend
          </span>
        </div>
        <div className="flex bg-cream-dark rounded-full p-0.5">
          <button
            onClick={() => { setRange(7); setSelectedDay(null); }}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
              range === 7 ? "bg-white text-brown shadow-sm" : "text-brown-lighter"
            }`}
          >
            7d
          </button>
          <button
            onClick={() => { setRange(14); setSelectedDay(null); }}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
              range === 14 ? "bg-white text-brown shadow-sm" : "text-brown-lighter"
            }`}
          >
            14d
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
            barCategoryGap="20%"
            onClick={(state: Record<string, unknown>) => {
              const payload = state?.activePayload as Array<{ payload: DayData }> | undefined;
              if (payload?.[0]) {
                const day = payload[0].payload;
                setSelectedDay(
                  selectedDay?.date === day.date ? null : day
                );
              }
            }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9B8585", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, Math.ceil(maxMl / 100) * 100]}
              tick={{ fontSize: 9, fill: "#9B8585" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Bar dataKey="bottleMl" stackId="ml" radius={[0, 0, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={selectedDay?.date === entry.date ? "#FFB8A8" : "#FFD6CC"}
                  cursor="pointer"
                />
              ))}
            </Bar>
            <Bar dataKey="snackMl" stackId="ml" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={selectedDay?.date === entry.date ? "#F09DAA" : "#F6B8C1"}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-peach" />
          <span className="text-[10px] font-bold text-brown-lighter">Bottle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blush" />
          <span className="text-[10px] font-bold text-brown-lighter">Snack</span>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDay.totalMl > 0 && (
        <div className="mt-3 bg-cream rounded-xl p-3">
          <div className="text-xs font-extrabold text-brown mb-1">
            {selectedDay.label === "Today" || selectedDay.label === "Yday"
              ? selectedDay.label
              : format(new Date(selectedDay.date + "T12:00:00"), "EEEE, MMM d")}
          </div>
          <div className="flex gap-3 text-[11px] font-bold text-brown-light">
            {selectedDay.bottleMl > 0 && (
              <span>
                {"\uD83C\uDF7C"} {selectedDay.bottleMl}ml ({selectedDay.bottleCount})
              </span>
            )}
            {selectedDay.snackMl > 0 && (
              <span>
                {"\uD83E\uDD31"} {selectedDay.snackMl}ml ({selectedDay.snackCount})
              </span>
            )}
            <span className="text-brown-lighter">
              Total: {selectedDay.totalMl}ml
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
