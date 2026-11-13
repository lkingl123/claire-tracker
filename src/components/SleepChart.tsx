"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Sleep } from "@/lib/types";
import { dayKey, formatDuration, sleepsForDay, summarize } from "@/lib/sleep";

interface DayData {
  date: string;
  label: string;
  nightH: number;
  napH: number;
  nightMin: number;
  napMin: number;
  napCount: number;
}

function buildDailyData(sleeps: Sleep[], days: number): DayData[] {
  const now = new Date();
  const data: DayData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(now, i);
    const s = summarize(sleepsForDay(sleeps, dayKey(day)), now);
    data.push({
      date: dayKey(day),
      label: i === 0 ? "Today" : i === 1 ? "Yday" : format(day, "M/d"),
      nightH: +(s.nightMin / 60).toFixed(2),
      napH: +(s.napMin / 60).toFixed(2),
      nightMin: s.nightMin,
      napMin: s.napMin,
      napCount: s.napCount,
    });
  }
  return data;
}

const RANGES: (7 | 30 | 90)[] = [7, 30, 90];

export default function SleepChart({ sleeps }: { sleeps: Sleep[] }) {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const data = buildDailyData(sleeps, range);
  const tickInterval = range >= 90 ? 9 : range >= 30 ? 4 : 0;

  return (
    <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-end mb-3">
        <div className="flex bg-cream-dark rounded-full p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => { setRange(r); setSelectedDay(null); }}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                range === r ? "bg-white text-brown shadow-sm" : "text-brown-lighter"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

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
                setSelectedDay(selectedDay?.date === day.date ? null : day);
              }
            }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9B8585", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={[0, 16]}
              ticks={[0, 4, 8, 12, 16]}
              tick={{ fontSize: 9, fill: "#9B8585" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
            />
            <Bar dataKey="nightH" stackId="h">
              {data.map((d) => (
                <Cell
                  key={d.date}
                  fill={selectedDay?.date === d.date ? "#B98BE0" : "#D7B4F3"}
                  cursor="pointer"
                />
              ))}
            </Bar>
            <Bar dataKey="napH" stackId="h" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.date}
                  fill={selectedDay?.date === d.date ? "#8DC0E0" : "#B8D8F0"}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-lavender" />
          <span className="text-[10px] font-bold text-brown-lighter">Night</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-sky" />
          <span className="text-[10px] font-bold text-brown-lighter">Naps</span>
        </div>
      </div>

      {selectedDay && (
        <div className="mt-3 bg-cream rounded-xl p-3">
          <div className="text-xs font-extrabold text-brown mb-1">
            {selectedDay.label === "Today" || selectedDay.label === "Yday"
              ? selectedDay.label
              : format(new Date(selectedDay.date + "T12:00:00"), "EEEE, MMM d")}
          </div>
          <div className="flex gap-3 text-[11px] font-bold text-brown-light">
            <span>{"🌙"} {formatDuration(selectedDay.nightMin)}</span>
            <span>
              {"💤"} {formatDuration(selectedDay.napMin)} ({selectedDay.napCount})
            </span>
            <span className="text-brown-lighter">
              Total: {formatDuration(selectedDay.nightMin + selectedDay.napMin)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
