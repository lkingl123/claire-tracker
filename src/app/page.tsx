"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Feeding, Diaper } from "@/lib/types";
import { setupNotifications, startFeedReminder } from "@/lib/notifications";
import Dashboard from "@/components/Dashboard";
import Timeline from "@/components/Timeline";
import BottleFeedModal from "@/components/BottleFeedModal";
import BreastSnackModal from "@/components/BreastSnackModal";
import DiaperModal from "@/components/DiaperModal";
import HistoryView from "@/components/HistoryView";
import SiriGuide from "@/components/SiriGuide";

type Modal = "bottle" | "breast" | "diaper" | null;

export default function Home() {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [diapers, setDiapers] = useState<Diaper[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSiri, setShowSiri] = useState(false);

  const loadData = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [feedRes, diaperRes] = await Promise.all([
      supabase
        .from("feedings")
        .select("*")
        .gte("fed_at", todayStart.toISOString())
        .order("fed_at", { ascending: false }),
      supabase
        .from("diapers")
        .select("*")
        .gte("changed_at", todayStart.toISOString())
        .order("changed_at", { ascending: false }),
    ]);

    if (feedRes.data) setFeedings(feedRes.data);
    if (diaperRes.data) setDiapers(diaperRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    setupNotifications().then(setNotificationsEnabled);
  }, []);

  useEffect(() => {
    if (feedings.length > 0) {
      const lastFeed = new Date(feedings[0].fed_at);
      startFeedReminder(lastFeed, 150); // 2.5 hours
    }
  }, [feedings]);

  const handleBottleFeed = async (ml: number) => {
    setModal(null);
    const { error } = await supabase.from("feedings").insert({
      type: "bottle",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (!error) loadData();
  };

  const handleBreastSnack = async (ml: number) => {
    setModal(null);
    const { error } = await supabase.from("feedings").insert({
      type: "breast_snack",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (!error) loadData();
  };

  const handleDiaper = async (type: "wet" | "dirty" | "both") => {
    setModal(null);
    const { error } = await supabase.from("diapers").insert({
      type,
      changed_at: new Date().toISOString(),
    });
    if (!error) loadData();
  };

  const handleDeleteFeeding = async (id: string) => {
    await supabase.from("feedings").delete().eq("id", id);
    loadData();
  };

  const handleDeleteDiaper = async (id: string) => {
    await supabase.from("diapers").delete().eq("id", id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-bounce">{"\uD83C\uDF7C"}</div>
        <div className="text-brown-lighter font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full pb-6">
      {/* Header */}
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-brown">
            Hi, Claire {"\uD83C\uDF38"}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSiri(true)}
              className="text-xs font-bold text-brown-light bg-lavender-light/50 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              {"\uD83C\uDF99\uFE0F"} Siri
            </button>
            {!notificationsEnabled && (
              <button
                onClick={async () => {
                  const enabled = await setupNotifications();
                  setNotificationsEnabled(enabled);
                }}
                className="text-xs font-bold text-peach-dark bg-peach/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                {"\uD83D\uDD14"} Notify
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="px-5 pt-3">
        <Dashboard feedings={feedings} diapers={diapers} />
      </div>

      {/* Action buttons */}
      <div className="px-5 py-5">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setModal("bottle")}
            className="flex flex-col items-center gap-2 py-5 bg-peach/50 rounded-[20px] active:scale-95 transition-transform shadow-[0_2px_10px_rgba(255,180,160,0.2)]"
          >
            <span className="text-3xl">{"\uD83C\uDF7C"}</span>
            <span className="text-xs font-extrabold text-brown">Bottle</span>
          </button>
          <button
            onClick={() => setModal("breast")}
            className="flex flex-col items-center gap-2 py-5 bg-blush/40 rounded-[20px] active:scale-95 transition-transform shadow-[0_2px_10px_rgba(240,157,170,0.2)]"
          >
            <span className="text-3xl">{"\uD83E\uDD31"}</span>
            <span className="text-xs font-extrabold text-brown">Snack</span>
          </button>
          <button
            onClick={() => setModal("diaper")}
            className="flex flex-col items-center gap-2 py-5 bg-mint/40 rounded-[20px] active:scale-95 transition-transform shadow-[0_2px_10px_rgba(141,212,176,0.2)]"
          >
            <span className="text-3xl">{"\uD83D\uDC76"}</span>
            <span className="text-xs font-extrabold text-brown">Diaper</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 px-5 overflow-y-auto hide-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold text-brown-lighter uppercase tracking-wider">
            Today&apos;s Log
          </h2>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs font-bold text-peach-dark bg-peach/25 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            {"\uD83D\uDCCB"} History
          </button>
        </div>
        <Timeline
          feedings={feedings}
          diapers={diapers}
          onDeleteFeeding={handleDeleteFeeding}
          onDeleteDiaper={handleDeleteDiaper}
        />
      </div>

      {/* Siri Guide */}
      {showSiri && <SiriGuide onClose={() => setShowSiri(false)} />}

      {/* History */}
      {showHistory && (
        <HistoryView onClose={() => setShowHistory(false)} />
      )}

      {/* Modals */}
      {modal === "bottle" && (
        <BottleFeedModal
          onSubmit={handleBottleFeed}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "breast" && (
        <BreastSnackModal
          onSubmit={handleBreastSnack}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "diaper" && (
        <DiaperModal
          onSubmit={handleDiaper}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
