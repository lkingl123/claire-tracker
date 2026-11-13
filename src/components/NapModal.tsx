"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Nap } from "@/lib/types";
import { formatMinutes, napMinutes, parseWokeAt } from "@/lib/naps";

const QUICK = [15, 30, 45, 60, 90, 120];

interface Props {
  nap?: Nap; // editing when set, adding when not
  onSave: (minutes: number, wokeAt: Date) => void;
  onClose: () => void;
}

export default function NapModal({ nap, onSave, onClose }: Props) {
  const woke = nap ? new Date(nap.ended_at) : new Date();
  const [minutes, setMinutes] = useState(nap ? napMinutes(nap) : 45);
  const [date, setDate] = useState(format(woke, "yyyy-MM-dd"));
  const [time, setTime] = useState(format(woke, "HH:mm"));

  const wokeAt = parseWokeAt(date, time);
  const valid = wokeAt !== null && minutes > 0;

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

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-lavender-light rounded-2xl flex items-center justify-center text-2xl">
            {"💤"}
          </div>
          <h2 className="text-xl font-extrabold text-brown">{nap ? "Edit Nap" : "Log a Nap"}</h2>
        </div>

        {/* Quick picks */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {QUICK.map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                minutes === m
                  ? "bg-lavender/60 text-brown"
                  : "bg-white text-brown-light shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              }`}
            >
              {formatMinutes(m)}
            </button>
          ))}
        </div>

        {/* Fine adjust */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setMinutes(Math.max(5, minutes - 5))}
            className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-2xl font-bold text-brown-light active:scale-95 transition-transform"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-5xl font-extrabold text-brown">{minutes}</span>
            <span className="text-lg font-semibold text-brown-lighter ml-1">min</span>
          </div>
          <button
            onClick={() => setMinutes(minutes + 5)}
            className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-2xl font-bold text-brown-light active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        {/* When she woke (defaults to now) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-bold text-brown-lighter uppercase tracking-wider block mb-1.5">
              Woke up at
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

        <button
          onClick={() => wokeAt && minutes > 0 && onSave(minutes, wokeAt)}
          disabled={!valid}
          className="w-full py-4 bg-lavender/60 text-brown rounded-2xl text-lg font-extrabold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          Save {minutes} min nap
        </button>
      </div>
    </div>
  );
}
