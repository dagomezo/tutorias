"use client";

import { useEffect, useState } from "react";

export type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
  durationMs?: number;
};

export default function Toast({
  message,
  type = "success",
  onClose,
  durationMs = 3000,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [visible, durationMs, onClose]);

  if (!visible) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg
          flex items-start gap-3
          transition-all duration-300
          ${
            isSuccess
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }
        `}
      >
        <span className="mt-0.5 text-lg">{isSuccess ? "✅" : "⚠️"}</span>
        <div className="flex-1">
          <p>{message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="ml-2 text-xs text-slate-500 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
