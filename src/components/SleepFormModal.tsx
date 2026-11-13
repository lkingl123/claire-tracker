"use client";

import { useState } from "react";
import { addDays, format, subHours } from "date-fns";
import { Sleep, SleepKind } from "@/lib/types";
import { durationMin, formatDuration, kindForTime } from "@/lib/sleep";

export interface SleepInput {
  kind: SleepKind;
  started_at: string;
  ended_at: string | null;
}

interface Props {
  sleep?: Sleep; // editing when set, adding when not
  onSave: (input: SleepInput) => Promise<string | null>; // returns error message or null
  onClose: () => void;
}

const inputClass =
  "w-full bg-white rounded-xl px-3 py-3 text-sm font-semibold text-brown shadow-[0_1px_4px_rgba(0,0,0,0.04)]";
const labelClass =
  "text-xs font-bold text-brown-lighter uppercase tracking-wider block mb-1.5";

export default function SleepFormModal({ sleep, onSave, onClose }: Props) {
  // Adding: default to "fell asleep an hour ago, woke up now"
  const start = sleep ? new Date(sleep.started_at) : subHours(new Date(), 1);
  const end = sleep?.ended_at ? new Date(sleep.ended_at) : sleep ? null : new Date();

  const [kind, setKind] = useState<SleepKind>(sleep?.kind ?? kindForTime(start));
  const [date, setDate] = useState(format(start, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(start, "HH:mm"));
  const [endTime, setEndTime] = useState(end ? format(end, "HH:mm") : format(new Date(), "HH:mm"));
  const [stillAsleep, setStillAsleep] = useState(!!sleep && !sleep.ended_at);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Woke-up time earlier than fell-asleep time means it was the next morning
  const startAt = new Date(`${date}T${startTime}:00`);
  let endAt = new Date(`${date}T${endTime}:00`);
  if (endAt <= startAt) endAt = addDays(endAt, 1);
  const preview = stillAsleep
    ? null
    : durationMin({ started_at: startAt.toISOString(), ended_at: endAt.toISOString() } as Sleep);

  const handleSave = async () => {
    if (!stillAsleep && endAt > new Date()) {
      setError("Wake-up time is in the future.");
      return;
    }
    setSaving(true);
    const err = await onSave({
      kind,
      started_at: startAt.toISOString(),
      ended_at: stillAsleep ? null : endAt.toISOString(),
    });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-brown/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-6 pb-8 animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-brown-lighter/30 rounded-full mx-auto mb-5" />

        <h2 className="text-xl font-extrabold text-brown mb-5">
          {sleep ? "Edit Sleep" : "Add Sleep"}
        </h2>

        {/* Nap / Night */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {(["nap", "night"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                kind === k
                  ? "bg-lavender/50 text-brown"
                  : "bg-white text-brown-light shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              }`}
            >
              {k === "nap" ? "💤 Nap" : "🌙 Night"}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className={labelClass}>Date she fell asleep</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>Fell asleep</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Woke up</label>
            <input
              type="time"
              value={endTime}
              disabled={stillAsleep}
              onChange={(e) => setEndTime(e.target.value)}
              className={`${inputClass} ${stillAsleep ? "opacity-40" : ""}`}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold text-brown-light mb-4">
          <input
            type="checkbox"
            checked={stillAsleep}
            onChange={(e) => setStillAsleep(e.target.checked)}
            className="w-4 h-4 accent-lavender"
          />
          Still asleep
        </label>

        {preview !== null && (
          <div className="text-sm font-bold text-brown-light mb-4">
            {formatDuration(preview)} of sleep
            {format(endAt, "yyyy-MM-dd") !== date && (
              <span className="text-brown-lighter font-medium"> (woke up next day)</span>
            )}
          </div>
        )}

        {error && <div className="text-sm font-bold text-red-600 mb-3">{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-lavender/60 text-brown rounded-2xl text-lg font-extrabold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
