"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Sleep, SleepKind } from "@/lib/types";
import { dayKey, endSleep, fetchRecentSleeps, sleepDayKey, startSleep } from "@/lib/sleep";
import Dashboard from "@/components/Dashboard";
import SleepRow from "@/components/SleepRow";
import SleepFormModal, { SleepInput } from "@/components/SleepFormModal";
import HistoryView from "@/components/HistoryView";
import SiriGuide from "@/components/SiriGuide";

// "new" = add a past sleep, Sleep = edit that one
type FormTarget = "new" | Sleep | null;

export default function Home() {
  const [sleeps, setSleeps] = useState<Sleep[]>([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSiri, setShowSiri] = useState(false);
  const [form, setForm] = useState<FormTarget>(null);

  const loadData = useCallback(async () => {
    setSleeps(await fetchRecentSleeps());
    setNow(new Date());
    setLoading(false);
  }, []);

  // Refresh every 30s so timers tick and both phones stay in sync
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleStart = async (kind: SleepKind) => {
    await startSleep(kind);
    loadData();
  };

  const handleWake = async () => {
    await endSleep();
    loadData();
  };

  const handleSave = async (input: SleepInput): Promise<string | null> => {
    const { error } =
      form === "new"
        ? await supabase.from("sleeps").insert(input)
        : await supabase.from("sleeps").update(input).eq("id", (form as Sleep).id);
    if (error) {
      // sleeps_one_active unique index
      if (error.code === "23505") return "Claire is already marked as asleep. Wake her up first.";
      return "Couldn't save. Please try again.";
    }
    loadData();
    return null;
  };

  const handleDelete = async (id: string) => {
    await supabase.from("sleeps").delete().eq("id", id);
    loadData();
  };

  // Today's log: today's naps, last night, and anything still in progress
  const todayKey = dayKey(now);
  const todaySleeps = sleeps.filter((s) => !s.ended_at || sleepDayKey(s) === todayKey);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-bounce">{"🌙"}</div>
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

      <div className="px-5 pt-3">
        <Dashboard sleeps={sleeps} now={now} onStart={handleStart} onWake={handleWake} />
      </div>

      <div className="px-5 py-4">
        <button
          onClick={() => setForm("new")}
          className="w-full py-3 bg-white rounded-2xl text-sm font-extrabold text-brown-light shadow-[0_1px_6px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform"
        >
          + Add a past sleep
        </button>
      </div>

      {/* Today's log */}
      <div className="flex-1 px-5 overflow-y-auto hide-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold text-brown-lighter uppercase tracking-wider">
            Today&apos;s Sleep
          </h2>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs font-bold text-brown-light bg-lavender-light/60 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            {"📋"} History
          </button>
        </div>
        {todaySleeps.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">{"🌟"}</div>
            <div className="text-brown-lighter font-semibold">No sleep logged today</div>
            <div className="text-brown-lighter/60 text-sm mt-1">
              Tap Nap or Bedtime when she falls asleep
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todaySleeps.map((s) => (
              <SleepRow key={s.id} sleep={s} now={now} onEdit={setForm} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {form && (
        <SleepFormModal
          sleep={form === "new" ? undefined : form}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      )}
      {showSiri && <SiriGuide onClose={() => setShowSiri(false)} />}
      {showHistory && <HistoryView onClose={() => setShowHistory(false)} />}
    </div>
  );
}
