"use client";

import { format } from "date-fns";
import { Nap } from "@/lib/types";
import { formatMinutes, napMinutes } from "@/lib/naps";

interface Props {
  nap: Nap;
  onEdit?: (n: Nap) => void;
  onDelete?: (id: string) => void;
}

// "Nap · 45 min" / "12:15 PM – 1:00 PM"
export default function NapRow({ nap, onEdit, onDelete }: Props) {
  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)] ${
        onEdit ? "cursor-pointer active:scale-[0.99] transition-transform" : ""
      }`}
      onClick={() => onEdit?.(nap)}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-lavender-light">
        {"💤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-brown">Nap &middot; {formatMinutes(napMinutes(nap))}</div>
        <div className="text-xs font-medium text-brown-lighter">
          {format(new Date(nap.started_at), "h:mm a")} &ndash; {format(new Date(nap.ended_at), "h:mm a")}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(nap.id);
          }}
          className="w-8 h-8 rounded-full bg-rose/20 flex items-center justify-center text-brown-lighter text-xs active:scale-90 transition-transform"
        >
          {"✕"}
        </button>
      )}
    </div>
  );
}
