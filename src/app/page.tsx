"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Feeding, Diaper } from "@/lib/types";
import { setupNotifications, startFeedReminder } from "@/lib/notifications";
import { isToday, startOfDay, endOfDay } from "date-fns";
import Dashboard from "@/components/Dashboard";
import Timeline from "@/components/Timeline";
import DateNav from "@/components/DateNav";
import BottleFeedModal from "@/components/BottleFeedModal";
import BreastSnackModal from "@/components/BreastSnackModal";
import DiaperModal from "@/components/DiaperModal";

type Modal = "bottle" | "breast" | "diaper" | null;

export default function Home() {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [diapers, setDiapers] = useState<Diaper[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const isViewingToday = isToday(selectedDate);

  const loadData = useCallback(async () => {
    const dayStart = startOfDay(selectedDate).toISOString();
    const dayEnd = endOfDay(selectedDate).toISOString();

    const [feedRes, diaperRes] = await Promise.all([
      supabase
        .from("feedings")
        .select("*")
        .gte("fed_at", dayStart)
        .lte("fed_at", dayEnd)
        .order("fed_at", { ascending: false }),
      supabase
        .from("diapers")
        .select("*")
        .gte("changed_at", dayStart)
        .lte("changed_at", dayEnd)
        .order("changed_at", { ascending: false }),
    ]);

    if (feedRes.data) setFeedings(feedRes.data);
    if (diaperRes.data) setDiapers(diaperRes.data);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    loadData();

    // Only poll if viewing today
    if (isViewingToday) {
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [loadData, isViewingToday]);

  useEffect(() => {
    setupNotifications().then(setNotificationsEnabled);
  }, []);

  useEffect(() => {
    if (feedings.length > 0 && isViewingToday) {
      const lastFeed = new Date(feedings[0].fed_at);
      startFeedReminder(lastFeed, 180);
    }
  }, [feedings, isViewingToday]);

  const handleBottleFeed = async (ml: number) => {
    setModal(null);
    const { error } = await supabase.from("feedings").insert({
      type: "bottle",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (!error) loadData();
  };

  const handleBreastSnack = async (minutes: number) => {
    setModal(null);
    const { error } = await supabase.from("feedings").insert({
      type: "breast_snack",
      duration_minutes: minutes,
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

      {/* Date navigator */}
      <div className="px-5 py-3">
        <DateNav date={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* Dashboard */}
      <div className="px-5 pt-1">
        <Dashboard feedings={feedings} diapers={diapers} />
      </div>

      {/* Action buttons - only show on today */}
      {isViewingToday && (
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
      )}

      {/* Back to today button when viewing history */}
      {!isViewingToday && (
        <div className="px-5 py-4">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="w-full py-3 bg-peach/40 text-brown rounded-2xl text-sm font-bold active:scale-[0.98] transition-transform"
          >
            {"\u2190"} Back to Today
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 px-5 overflow-y-auto hide-scrollbar">
        <h2 className="text-xs font-extrabold text-brown-lighter uppercase tracking-wider mb-3">
          {isViewingToday ? "Today\u0027s Log" : "Log"}
        </h2>
        <Timeline
          feedings={feedings}
          diapers={diapers}
          onDeleteFeeding={handleDeleteFeeding}
          onDeleteDiaper={handleDeleteDiaper}
        />
      </div>

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
