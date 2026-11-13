"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Nap } from "@/lib/types";
import { dayKey, fetchRecentNaps, logNap, napDayKey, napRow } from "@/lib/naps";
import Dashboard from "@/components/Dashboard";
import NapRow from "@/components/NapRow";
import NapModal from "@/components/NapModal";
import HistoryView from "@/components/HistoryView";
import SiriGuide from "@/components/SiriGuide";

// "new" = log a nap, Nap = edit that one
type ModalTarget = "new" | Nap | null;

export default function Home() {
  const [naps, setNaps] = useState<Nap[]>([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSiri, setShowSiri] = useState(false);
  const [modal, setModal] = useState<ModalTarget>(null);

  const loadData = useCallback(async () => {
    setNaps(await fetchRecentNaps());
    setNow(new Date());
    setLoading(false);
  }, []);

  // Refresh every 30s so "awake" ticks and both phones stay in sync
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSave = async (minutes: number, wokeAt: Date) => {
    const target = modal;
    setModal(null);
    if (target === "new") await logNap(minutes, wokeAt);
    else if (target) await supabase.from("sleeps").update(napRow(minutes, wokeAt)).eq("id", target.id);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("sleeps").delete().eq("id", id);
    loadData();
  };

  const todayNaps = naps.filter((n) => napDayKey(n) === dayKey(now));

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-bounce">{"💤"}</div>
        <div className="text-brown-lighter font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full pb-6">
      {/* Header */}
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-brown">Hi, Claire {"🌸"}</h1>
          <button
            onClick={() => setShowSiri(true)}
            className="text-xs font-bold text-brown-light bg-lavender-light/50 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            {"🎙️"} Siri
          </button>
        </div>
      </div>

      <div className="px-5 pt-3 pb-5">
        <Dashboard naps={naps} now={now} onLogNap={() => setModal("new")} />
      </div>

      {/* Today's naps */}
      <div className="flex-1 px-5 overflow-y-auto hide-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold text-brown-lighter uppercase tracking-wider">
            Today&apos;s Naps
          </h2>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs font-bold text-brown-light bg-lavender-light/60 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            {"📋"} History
          </button>
        </div>
        {todayNaps.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">{"🌟"}</div>
            <div className="text-brown-lighter font-semibold">No naps logged today</div>
            <div className="text-brown-lighter/60 text-sm mt-1">Tap &ldquo;Log a nap&rdquo; when she wakes up</div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayNaps.map((n) => (
              <NapRow key={n.id} nap={n} onEdit={setModal} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <NapModal
          nap={modal === "new" ? undefined : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {showSiri && <SiriGuide onClose={() => setShowSiri(false)} />}
      {showHistory && <HistoryView onClose={() => setShowHistory(false)} />}
    </div>
  );
}
