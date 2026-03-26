"use client";

interface Props {
  onSubmit: (type: "wet" | "dirty" | "both") => void;
  onClose: () => void;
}

export default function DiaperModal({ onSubmit, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Diaper Change</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSubmit("wet")}
            className="py-5 bg-blue-100 text-blue-700 rounded-2xl text-lg font-semibold active:bg-blue-200"
          >
            Wet
          </button>
          <button
            onClick={() => onSubmit("dirty")}
            className="py-5 bg-amber-100 text-amber-700 rounded-2xl text-lg font-semibold active:bg-amber-200"
          >
            Dirty
          </button>
          <button
            onClick={() => onSubmit("both")}
            className="py-5 bg-green-100 text-green-700 rounded-2xl text-lg font-semibold active:bg-green-200"
          >
            Both
          </button>
        </div>
      </div>
    </div>
  );
}
