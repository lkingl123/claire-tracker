"use client";

import { useState } from "react";

const EXAMPLES = [
  { category: "Log a Nap", emoji: "\uD83D\uDCA4", bg: "bg-lavender-light/60", phrases: ["nap 45", "nap 30 minutes", "nap 1 hour"] },
  { category: "Check On Claire", emoji: "\uD83D\uDCCA", bg: "bg-sky/30", phrases: ["status", "undo"] },
];

export default function SiriGuide({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 bg-cream z-50 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-8 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-brown">
          {"\uD83C\uDF99\uFE0F"} Siri Setup
        </h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-brown-light font-bold active:scale-90 transition-transform"
        >
          {"\u2715"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-8">
        {/* Setup - only 4 steps */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-4">
          <div className="text-sm font-extrabold text-brown mb-3">
            Setup (only 4 steps!)
          </div>
          <ol className="text-xs text-brown-light space-y-2.5 list-decimal list-inside">
            <li>Open <span className="font-bold">Shortcuts</span> app &rarr; tap <span className="font-bold">+</span></li>
            <li>Add action: <span className="font-bold">Dictate Text</span></li>
            <li>
              Add action: <span className="font-bold">Get Contents of URL</span>
              <div className="ml-4 mt-1.5 space-y-1">
                <div>URL (tap to copy):</div>
              </div>
            </li>
          </ol>

          <div
            onClick={() => {
              navigator.clipboard.writeText("https://claire-tracker.vercel.app/api/speak");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-cream rounded-xl p-3 my-2 ml-4 active:bg-cream-dark transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono text-brown break-all">
              https://claire-tracker.vercel.app/api/speak
            </div>
            <div className="text-[10px] font-bold text-peach-dark mt-1">
              {copied ? "\u2713 Copied!" : "Tap to copy"}
            </div>
          </div>

          <div className="text-xs text-brown-light space-y-1.5 ml-8">
            <div>&bull; Method: <span className="font-bold">POST</span></div>
            <div>&bull; Request Body: <span className="font-bold">JSON</span></div>
            <div>&bull; Add field &rarr; Text &rarr; Key: <span className="font-bold">q</span> &rarr; Value: <span className="font-bold">Dictated Text</span></div>
          </div>

          <ol start={4} className="text-xs text-brown-light space-y-2 list-decimal list-inside mt-2.5">
            <li>Add action: <span className="font-bold">Speak Text</span> &rarr; select <span className="font-bold">Contents of URL</span></li>
          </ol>

          <div className="mt-3 text-xs text-brown-lighter">
            Rename the shortcut to <span className="font-bold">&ldquo;Claire&rdquo;</span> and you&apos;re done!
          </div>
        </div>

        {/* How to use */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-4">
          <div className="text-sm font-extrabold text-brown mb-1">
            Then just say:
          </div>
          <div className="text-lg font-extrabold text-peach-dark mb-2">
            &ldquo;Hey Siri, Claire&rdquo;
          </div>
          <div className="text-xs text-brown-lighter">
            Siri will listen, then speak the result back to you.
          </div>
        </div>

        {/* Example phrases */}
        <div className="space-y-3">
          {EXAMPLES.map((group) => (
            <div key={group.category} className={`${group.bg} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{group.emoji}</span>
                <span className="text-xs font-extrabold text-brown-lighter uppercase tracking-wider">
                  {group.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.phrases.map((phrase) => (
                  <span
                    key={phrase}
                    className="text-xs font-semibold text-brown bg-white/60 px-2.5 py-1 rounded-full"
                  >
                    &ldquo;{phrase}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
