"use client";

import { useState } from "react";

interface Props {
  onSubmit: (ml: number) => void;
  onClose: () => void;
}

const QUICK_ML = [15, 30, 45, 60, 75, 90];

export default function BottleFeedModal({ onSubmit, onClose }: Props) {
  const [ml, setMl] = useState<number>(60);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Bottle Feed</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">
            &times;
          </button>
        </div>

        {/* Quick select */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {QUICK_ML.map((v) => (
            <button
              key={v}
              onClick={() => setMl(v)}
              className={`py-3 rounded-xl text-lg font-semibold transition ${
                ml === v
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {v} ml
            </button>
          ))}
        </div>

        {/* Manual input */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setMl(Math.max(5, ml - 5))}
            className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-4xl font-bold text-violet-700">{ml}</span>
            <span className="text-lg text-gray-500 ml-1">ml</span>
          </div>
          <button
            onClick={() => setMl(ml + 5)}
            className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onSubmit(ml)}
          className="w-full py-4 bg-violet-600 text-white rounded-2xl text-lg font-semibold active:bg-violet-700"
        >
          Log Bottle Feed
        </button>
      </div>
    </div>
  );
}
