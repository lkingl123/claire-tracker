"use client";

interface Props {
  onSubmit: (type: "wet" | "dirty" | "both") => void;
  onClose: () => void;
}

export default function DiaperModal({ onSubmit, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-brown/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-6 pb-8 animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-brown-lighter/30 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-mint/50 rounded-2xl flex items-center justify-center text-2xl">
            {"\uD83D\uDC76"}
          </div>
          <h2 className="text-xl font-extrabold text-brown">Diaper Change</h2>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSubmit("wet")}
            className="flex items-center gap-4 py-5 px-5 bg-sky/30 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <span className="text-3xl">{"\uD83D\uDCA7"}</span>
            <span className="text-lg font-bold text-brown">Wet</span>
          </button>
          <button
            onClick={() => onSubmit("dirty")}
            className="flex items-center gap-4 py-5 px-5 bg-sunny/40 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <span className="text-3xl">{"\uD83D\uDCA9"}</span>
            <span className="text-lg font-bold text-brown">Dirty</span>
          </button>
          <button
            onClick={() => onSubmit("both")}
            className="flex items-center gap-4 py-5 px-5 bg-mint/30 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <span className="text-3xl">{"\uD83D\uDCA7\uD83D\uDCA9"}</span>
            <span className="text-lg font-bold text-brown">Both</span>
          </button>
        </div>
      </div>
    </div>
  );
}
