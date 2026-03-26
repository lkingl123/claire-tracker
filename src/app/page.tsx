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

type Modal = "bottle" | "breast" | "diaper" | null;

export default function Home() {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [diapers, setDiapers] = useState<Diaper[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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

    // Poll every 30s for updates from other device
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Set up notifications
  useEffect(() => {
    setupNotifications().then(setNotificationsEnabled);
  }, []);

  // Update feed reminder when feedings change
  useEffect(() => {
    if (feedings.length > 0) {
      const lastFeed = new Date(feedings[0].fed_at);
      startFeedReminder(lastFeed, 180); // remind after 3 hours
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-violet-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">
          Claire <span className="text-violet-500">Tracker</span>
        </h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        {!notificationsEnabled && (
          <button
            onClick={async () => {
              const enabled = await setupNotifications();
              setNotificationsEnabled(enabled);
            }}
            className="mt-2 text-xs text-violet-500 underline"
          >
            Enable notifications
          </button>
        )}
      </div>

      {/* Dashboard */}
      <div className="px-4">
        <Dashboard feedings={feedings} diapers={diapers} />
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setModal("bottle")}
            className="flex flex-col items-center gap-1 py-4 bg-violet-600 text-white rounded-2xl active:bg-violet-700 shadow-md"
          >
            <span className="text-2xl">{"\uD83C\uDF7C"}</span>
            <span className="text-xs font-semibold">Bottle</span>
          </button>
          <button
            onClick={() => setModal("breast")}
            className="flex flex-col items-center gap-1 py-4 bg-pink-500 text-white rounded-2xl active:bg-pink-600 shadow-md"
          >
            <span className="text-2xl">{"\uD83E\uDD31"}</span>
            <span className="text-xs font-semibold">Snack</span>
          </button>
          <button
            onClick={() => setModal("diaper")}
            className="flex flex-col items-center gap-1 py-4 bg-sky-500 text-white rounded-2xl active:bg-sky-600 shadow-md"
          >
            <span className="text-2xl">{"\uD83D\uDC76"}</span>
            <span className="text-xs font-semibold">Diaper</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Today&apos;s Log
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
