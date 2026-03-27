"use client";

import { useState } from "react";

const VOICE_URL = "https://claire-tracker.vercel.app/api/voice";

const EXAMPLES = [
  { category: "Bottle Feeds", emoji: "\uD83C\uDF7C", bg: "bg-peach/30", phrases: ["bottle 60", "bottle 30", "bottle 90", "fed 45"] },
  { category: "Breast Snacks", emoji: "\uD83E\uDD31", bg: "bg-blush/25", phrases: ["snack 30", "snack 45", "snack 60"] },
  { category: "Diapers", emoji: "\uD83D\uDC76", bg: "bg-mint/30", phrases: ["wet diaper", "dirty diaper", "both diaper", "diaper"] },
  { category: "Check On Claire", emoji: "\uD83D\uDCCA", bg: "bg-lavender-light/40", phrases: ["status", "last feed"] },
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
        {/* One shortcut setup */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-4">
          <div className="text-sm font-extrabold text-brown mb-3">
            One shortcut for everything
          </div>
          <ol className="text-xs text-brown-light space-y-2 list-decimal list-inside mb-4">
            <li>Open <span className="font-bold">Shortcuts</span> app</li>
            <li>Tap <span className="font-bold">+</span> &rarr; <span className="font-bold">Add Action</span></li>
            <li>Search <span className="font-bold">&ldquo;Ask for Input&rdquo;</span> &rarr; add it. Set prompt to: <span className="font-bold">&ldquo;What do you want to log?&rdquo;</span></li>
            <li>Add action: <span className="font-bold">&ldquo;Get Contents of URL&rdquo;</span></li>
            <li>Tap the URL and paste this (tap to copy):</li>
          </ol>

          <div
            onClick={() => {
              navigator.clipboard.writeText(`${VOICE_URL}?q=`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-cream rounded-xl p-3 mb-3 active:bg-cream-dark transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono text-brown break-all">
              {VOICE_URL}?q=
            </div>
            <div className="text-[10px] font-bold text-peach-dark mt-1">
              {copied ? "\u2713 Copied!" : "Tap to copy"}
            </div>
          </div>

          <ol start={6} className="text-xs text-brown-light space-y-2 list-decimal list-inside">
            <li>After the <span className="font-bold">=</span> in the URL, tap and insert the <span className="font-bold">&ldquo;Provided Input&rdquo;</span> variable from step 3</li>
            <li>Add action: <span className="font-bold">&ldquo;Get Dictionary Value&rdquo;</span> &rarr; key: <span className="font-bold">speech</span></li>
            <li>Add action: <span className="font-bold">&ldquo;Speak Text&rdquo;</span> &rarr; select the dictionary value</li>
            <li>Rename shortcut to <span className="font-bold">&ldquo;Claire&rdquo;</span></li>
          </ol>
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
            Siri will ask &ldquo;What do you want to log?&rdquo; and you respond with any of the phrases below.
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
