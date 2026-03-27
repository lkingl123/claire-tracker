"use client";

import { useState } from "react";
import { Feeding, Diaper } from "@/lib/types";
import { format } from "date-fns";

function mlToOz(ml: number): string {
  return (ml / 29.5735).toFixed(1);
}

interface Props {
  entry:
    | { kind: "feeding"; data: Feeding }
    | { kind: "diaper"; data: Diaper };
  onSave: (
    kind: "feeding" | "diaper",
    id: string,
    updates: Record<string, unknown>
  ) => void;
  onClose: () => void;
}

export default function EditEntryModal({ entry, onSave, onClose }: Props) {
  const isFeeding = entry.kind === "feeding";
  const feeding = isFeeding ? (entry.data as Feeding) : null;
  const diaper = !isFeeding ? (entry.data as Diaper) : null;

  const [ml, setMl] = useState(feeding?.amount_ml || 0);
  const [diaperType, setDiaperType] = useState(diaper?.type || "wet");
  const [time, setTime] = useState(
    isFeeding
      ? format(new Date(feeding!.fed_at), "HH:mm")
      : format(new Date(diaper!.changed_at), "HH:mm")
  );
  const [date, setDate] = useState(
    isFeeding
      ? format(new Date(feeding!.fed_at), "yyyy-MM-dd")
      : format(new Date(diaper!.changed_at), "yyyy-MM-dd")
  );

  const handleSave = () => {
    const dateTime = new Date(`${date}T${time}:00`).toISOString();
    if (isFeeding) {
      onSave("feeding", feeding!.id, {
        amount_ml: ml,
        fed_at: dateTime,
      });
    } else {
      onSave("diaper", diaper!.id, {
        type: diaperType,
        changed_at: dateTime,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-brown/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-brown-lighter/30 rounded-full mx-auto mb-5" />

        <h2 className="text-xl font-extrabold text-brown mb-5">
          Edit Entry
        </h2>

        {/* Time & Date */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-bold text-brown-lighter uppercase tracking-wider block mb-1.5">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white rounded-xl px-3 py-3 text-sm font-semibold text-brown shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-brown-lighter uppercase tracking-wider block mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white rounded-xl px-3 py-3 text-sm font-semibold text-brown shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            />
          </div>
        </div>

        {/* Feeding: edit ml */}
        {isFeeding && (
          <div className="mb-5">
            <label className="text-xs font-bold text-brown-lighter uppercase tracking-wider block mb-1.5">
              Amount
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMl(Math.max(5, ml - 5))}
                className="w-12 h-12 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-xl font-bold text-brown-light active:scale-95 transition-transform"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-extrabold text-brown">{ml}</span>
                <span className="text-base font-semibold text-brown-lighter ml-1">ml</span>
                <div className="text-xs text-brown-lighter/60">{mlToOz(ml)} oz</div>
              </div>
              <button
                onClick={() => setMl(ml + 5)}
                className="w-12 h-12 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-xl font-bold text-brown-light active:scale-95 transition-transform"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Diaper: edit type */}
        {!isFeeding && (
          <div className="mb-5">
            <label className="text-xs font-bold text-brown-lighter uppercase tracking-wider block mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["wet", "dirty", "both"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDiaperType(t)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    diaperType === t
                      ? t === "wet"
                        ? "bg-sky/40 text-brown"
                        : t === "dirty"
                          ? "bg-sunny/50 text-brown"
                          : "bg-mint/40 text-brown"
                      : "bg-white text-brown-light shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  {t === "wet" ? "\uD83D\uDCA7 Pee" : t === "dirty" ? "\uD83D\uDCA9 Poop" : "Both"}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-4 bg-peach text-brown rounded-2xl text-lg font-extrabold active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(255,180,160,0.3)]"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
