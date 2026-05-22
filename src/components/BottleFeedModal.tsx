"use client";

import { useState } from "react";

interface Props {
  onSubmit: (ml: number) => void;
  onClose: () => void;
}

const ML_PER_OZ = 29.5735;
const STEP_OZ = 0.25;
const MIN_OZ = 0.25;

// Quick-select presets in oz, centered on Claire's current ~3 oz feed.
const QUICK_OZ = [1, 2, 2.5, 3, 3.5, 4];

function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_OZ);
}

function fmtOz(oz: number): string {
  // Drop trailing ".00" but keep meaningful quarters (e.g. 3, 3.25, 3.5).
  return Number.isInteger(oz) ? `${oz}` : oz.toFixed(2).replace(/0$/, "");
}

export default function BottleFeedModal({ onSubmit, onClose }: Props) {
  const [oz, setOz] = useState<number>(3);

  // Round to nearest quarter to avoid float drift across many taps.
  const setOzSafe = (next: number) =>
    setOz(Math.max(MIN_OZ, Math.round(next / STEP_OZ) * STEP_OZ));

  const ml = ozToMl(oz);

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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-peach/50 rounded-2xl flex items-center justify-center text-2xl">
            {"🍼"}
          </div>
          <h2 className="text-xl font-extrabold text-brown">Bottle Feed</h2>
        </div>

        {/* Quick select */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {QUICK_OZ.map((v) => (
            <button
              key={v}
              onClick={() => setOz(v)}
              className={`py-3 rounded-2xl text-base font-bold transition-all flex flex-col items-center gap-0.5 ${
                oz === v
                  ? "bg-peach text-brown shadow-[0_2px_8px_rgba(255,180,160,0.4)] scale-[1.02]"
                  : "bg-white text-brown-light shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              }`}
            >
              <span>{fmtOz(v)} oz</span>
              <span className="text-[10px] opacity-60">{ozToMl(v)} ml</span>
            </button>
          ))}
        </div>

        {/* Adjuster */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setOzSafe(oz - STEP_OZ)}
            className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-2xl font-bold text-brown-light active:scale-95 transition-transform"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <div>
              <span className="text-5xl font-extrabold text-brown">
                {fmtOz(oz)}
              </span>
              <span className="text-lg font-semibold text-brown-lighter ml-1">
                oz
              </span>
            </div>
            <div className="text-sm font-semibold text-brown-lighter/60 mt-0.5">
              {ml} ml
            </div>
          </div>
          <button
            onClick={() => setOzSafe(oz + STEP_OZ)}
            className="w-14 h-14 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-2xl font-bold text-brown-light active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onSubmit(ml)}
          className="w-full py-4 bg-peach text-brown rounded-2xl text-lg font-extrabold active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(255,180,160,0.3)]"
        >
          Log Feed {"🍼"}
        </button>
      </div>
    </div>
  );
}
