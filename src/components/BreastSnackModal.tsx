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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Breast Snack</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">
            &times;
          </button>
        </div>

        {/* Quick select */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {QUICK_MINS.map((v) => (
            <button
              key={v}
              onClick={() => setMinutes(v)}
              className={`py-3 rounded-xl text-lg font-semibold transition ${
                minutes === v
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {v} min
            </button>
          ))}
        </div>

        {/* Manual input */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setMinutes(Math.max(1, minutes - 1))}
            className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-4xl font-bold text-pink-600">{minutes}</span>
            <span className="text-lg text-gray-500 ml-1">min</span>
          </div>
          <button
            onClick={() => setMinutes(minutes + 1)}
            className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onSubmit(minutes)}
          className="w-full py-4 bg-pink-500 text-white rounded-2xl text-lg font-semibold active:bg-pink-600"
        >
          Log Breast Snack
        </button>
      </div>
    </div>
  );
}
