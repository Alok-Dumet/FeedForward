import { useCallback, useEffect, useMemo, useState } from "react";

import { ToastContext } from "../hooks/useToast.js";

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.expiresAt > currentTime)
      );
    }, 250);
    return () => window.clearInterval(interval);
  }, []);

  const closeToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", duration = DEFAULT_DURATION) => {
    const currentTime = Date.now();
    setNow(currentTime);
    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id: crypto.randomUUID(),
        message,
        type,
        duration,
        expiresAt: currentTime + duration,
      },
    ]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
        {toasts.map((toast) => {
          const remainingMs = Math.max(0, toast.expiresAt - now);
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          const progressPercent = Math.max(0, Math.min(100, (remainingMs / toast.duration) * 100));
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto overflow-hidden rounded-2xl border bg-white shadow-2xl ${
                isError ? "border-red-200" : "border-emerald-200"
              }`}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                    isError ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold tracking-[0.15em] uppercase ${
                      isError ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {isError ? "Error" : "Success"}
                  </p>
                  <p className="mt-1 text-sm leading-6 font-medium text-slate-800">
                    {toast.message}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {remainingSeconds}s
                  </span>
                  <button
                    type="button"
                    onClick={() => closeToast(toast.id)}
                    className="cursor-pointer rounded-full px-2 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close message"
                  >
                    x
                  </button>
                </div>
              </div>
              <div className="h-1 bg-slate-100">
                <div
                  className={`h-full ${isError ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
