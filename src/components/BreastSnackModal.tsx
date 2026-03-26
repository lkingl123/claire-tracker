"use client";

import { useState } from "react";

interface Props {
  onSubmit: (minutes: number) => void;
  onClose: () => void;
}

const QUICK_MINS = [2, 5, 10, 15, 20, 30];

export default function BreastSnackModal({ onSubmit, onClose }: Props) {
  const [minutes, setMinutes] = useState<number>(5);

  return (
    <div
      className="fixed inset-0 bg-brown/30 backdrop-blur-sm flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-t-[28px] w-full max-w-md p-6 pb-8 animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-brown-lighter/30 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blush/40 rounded-2xl flex items-center justify-center text-2xl">
            {"\uD83E\uDD31"}
          </div>
          <h2 className="text-xl font-extrabold text-brown">Breast Snack</h2>
        </div>

        {/* Quick select */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {QUICK_MINS.map((v) => (
            <button
              key={v}
              onClick={() => setMinutes(v)}
              className={`py-3.5 rounded-2xl text-base font-bold transition-all ${
                minutes === v
                  ? "bg-blush text-brown shadow-[0_2px_8px_rgba(240,157,170,0.4)] scale-[1.02]"
                  : "bg-white text-brown-light shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              }`}
            >
              {v} min
            </button>
          ))}
        </div>

        {/* Adjuster */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setMinutes(Math.max(1, minutes - 1))}
            className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-2xl font-bold text-brown-light active:scale-95 transition-transform"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-5xl font-extrabold text-brown">
              {minutes}
            </span>
            <span className="text-lg font-semibold text-brown-lighter ml-1">
              min
            </span>
          </div>
          <button
            onClick={() => setMinutes(minutes + 1)}
            className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-2xl font-bold text-brown-light active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onSubmit(minutes)}
          className="w-full py-4 bg-blush text-brown rounded-2xl text-lg font-extrabold active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(240,157,170,0.3)]"
        >
          Log Snack {"\uD83E\uDD31"}
        </button>
      </div>
    </div>
  );
}
