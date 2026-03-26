"use client";

import { format, isToday, isYesterday, subDays, addDays } from "date-fns";

interface Props {
  date: Date;
  onChange: (date: Date) => void;
}

export default function DateNav({ date, onChange }: Props) {
  const isCurrentDay = isToday(date);

  const label = isToday(date)
    ? "Today"
    : isYesterday(date)
      ? "Yesterday"
      : format(date, "EEE, MMM d");

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onChange(subDays(date, 1))}
        className="w-10 h-10 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-brown-light font-bold active:scale-90 transition-transform"
      >
        {"\u2039"}
      </button>
      <div className="text-center">
        <div className="text-sm font-extrabold text-brown">{label}</div>
        {!isCurrentDay && (
          <div className="text-[10px] font-medium text-brown-lighter">
            {format(date, "MMMM d, yyyy")}
          </div>
        )}
      </div>
      <button
        onClick={() => !isCurrentDay && onChange(addDays(date, 1))}
        className={`w-10 h-10 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-center font-bold active:scale-90 transition-transform ${
          isCurrentDay ? "text-brown-lighter/30" : "text-brown-light"
        }`}
        disabled={isCurrentDay}
      >
        {"\u203A"}
      </button>
    </div>
  );
}
