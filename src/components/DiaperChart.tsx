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
import { Diaper } from "@/lib/types";

interface Props {
  diapers: Diaper[];
}

interface DayData {
  date: string;
  label: string;
  wetCount: number;
  dirtyCount: number;
  totalCount: number;
}

function buildDailyData(diapers: Diaper[], days: number): DayData[] {
  const data: DayData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(subDays(now, i));
    const nextDay = startOfDay(subDays(now, i - 1));
    const dayDiapers = diapers.filter((d) => {
      const t = new Date(d.changed_at);
      return t >= day && t < nextDay;
    });

    const wetCount = dayDiapers.filter(
      (d) => d.type === "wet" || d.type === "both"
    ).length;
    const dirtyCount = dayDiapers.filter(
      (d) => d.type === "dirty" || d.type === "both"
    ).length;

    data.push({
      date: format(day, "yyyy-MM-dd"),
      label: i === 0 ? "Today" : i === 1 ? "Yday" : format(day, "M/d"),
      wetCount,
      dirtyCount,
      totalCount: dayDiapers.length,
    });
  }

  return data;
}

export default function DiaperChart({ diapers }: Props) {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [range, setRange] = useState<7 | 14>(7);

  const data = buildDailyData(diapers, range);
  const maxCount = Math.max(...data.map((d) => d.wetCount + d.dirtyCount), 4);

  return (
    <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{"\uD83D\uDCC8"}</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-brown-lighter">
            Diaper Trend
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
              domain={[0, Math.ceil(maxCount / 2) * 2]}
              tick={{ fontSize: 9, fill: "#9B8585" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Bar dataKey="wetCount" stackId="count" radius={[0, 0, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={selectedDay?.date === entry.date ? "#8DC0E0" : "#B8D8F0"}
                  cursor="pointer"
                />
              ))}
            </Bar>
            <Bar dataKey="dirtyCount" stackId="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={selectedDay?.date === entry.date ? "#FFE45C" : "#FFEE8C"}
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
          <div className="w-2.5 h-2.5 rounded-sm bg-sky" />
          <span className="text-[10px] font-bold text-brown-lighter">Wet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-sunny" />
          <span className="text-[10px] font-bold text-brown-lighter">Dirty</span>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDay.totalCount > 0 && (
        <div className="mt-3 bg-cream rounded-xl p-3">
          <div className="text-xs font-extrabold text-brown mb-1">
            {selectedDay.label === "Today" || selectedDay.label === "Yday"
              ? selectedDay.label
              : format(new Date(selectedDay.date + "T12:00:00"), "EEEE, MMM d")}
          </div>
          <div className="flex gap-3 text-[11px] font-bold text-brown-light">
            {selectedDay.wetCount > 0 && (
              <span>
                {"\uD83D\uDCA7"} {selectedDay.wetCount} wet
              </span>
            )}
            {selectedDay.dirtyCount > 0 && (
              <span>
                {"\uD83D\uDCA9"} {selectedDay.dirtyCount} dirty
              </span>
            )}
            <span className="text-brown-lighter">
              Total: {selectedDay.totalCount} changes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
