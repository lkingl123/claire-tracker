"use client";

import { useState } from "react";

const BASE = "https://claire-tracker.vercel.app/api/quick";

const SHORTCUTS = [
  {
    category: "Bottle Feeds",
    emoji: "\uD83C\uDF7C",
    bg: "bg-peach/30",
    items: [
      { say: "Log Bottle 30", url: `${BASE}?action=bottle&ml=30` },
      { say: "Log Bottle 45", url: `${BASE}?action=bottle&ml=45` },
      { say: "Log Bottle 60", url: `${BASE}?action=bottle&ml=60` },
      { say: "Log Bottle 75", url: `${BASE}?action=bottle&ml=75` },
      { say: "Log Bottle 90", url: `${BASE}?action=bottle&ml=90` },
    ],
  },
  {
    category: "Breast Snacks",
    emoji: "\uD83E\uDD31",
    bg: "bg-blush/25",
    items: [
      { say: "Log Snack 5", url: `${BASE}?action=snack&min=5` },
      { say: "Log Snack 10", url: `${BASE}?action=snack&min=10` },
      { say: "Log Snack 15", url: `${BASE}?action=snack&min=15` },
    ],
  },
  {
    category: "Diapers",
    emoji: "\uD83D\uDC76",
    bg: "bg-mint/30",
    items: [
      { say: "Log Wet Diaper", url: `${BASE}?action=diaper&type=wet` },
      { say: "Log Dirty Diaper", url: `${BASE}?action=diaper&type=dirty` },
      { say: "Log Both Diaper", url: `${BASE}?action=diaper&type=both` },
    ],
  },
  {
    category: "Check Status",
    emoji: "\uD83D\uDCCA",
    bg: "bg-lavender-light/40",
    items: [
      { say: "Claire Status", url: `${BASE}?action=status` },
      { say: "Last Feed", url: `${BASE}?action=last` },
    ],
  },
];

function ShortcutSetup({ name, url }: { name: string; url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-brown truncate">
          &ldquo;Hey Siri, {name}&rdquo;
        </div>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white text-brown-light shadow-[0_1px_4px_rgba(0,0,0,0.06)] whitespace-nowrap active:scale-95 transition-transform"
      >
        {copied ? "\u2713 Copied" : "Copy URL"}
      </button>
    </div>
  );
}

export default function SiriGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-cream z-50 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-8 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-brown">
          {"\uD83C\uDF99\uFE0F"} Siri Shortcuts
        </h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-brown-light font-bold active:scale-90 transition-transform"
        >
          {"\u2715"}
        </button>
      </div>

      {/* Setup instructions */}
      <div className="px-5 py-3">
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-xs font-extrabold text-brown-lighter uppercase tracking-wider mb-2">
            How to set up
          </div>
          <ol className="text-xs text-brown-light space-y-1.5 list-decimal list-inside">
            <li>
              Open <span className="font-bold">Shortcuts</span> app on iPhone
            </li>
            <li>
              Tap <span className="font-bold">+</span> &rarr; Add Action &rarr;
              search <span className="font-bold">&ldquo;Get Contents of URL&rdquo;</span>
            </li>
            <li>
              Tap <span className="font-bold">Copy URL</span> below and paste it
            </li>
            <li>
              Add action: <span className="font-bold">&ldquo;Get Dictionary Value&rdquo;</span> &rarr;
              key: <span className="font-bold">speech</span>
            </li>
            <li>
              Add action: <span className="font-bold">&ldquo;Speak Text&rdquo;</span> &rarr;
              select the value
            </li>
            <li>Rename the shortcut to the name shown below</li>
          </ol>
        </div>
      </div>

      {/* Shortcuts list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-8">
        <div className="space-y-4">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{group.emoji}</span>
                <span className="text-xs font-extrabold text-brown-lighter uppercase tracking-wider">
                  {group.category}
                </span>
              </div>
              <div
                className={`${group.bg} rounded-2xl px-4 py-1 divide-y divide-brown-lighter/10`}
              >
                {group.items.map((item) => (
                  <ShortcutSetup
                    key={item.say}
                    name={item.say}
                    url={item.url}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
