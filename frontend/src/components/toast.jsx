/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const DEFAULT_DURATION = 5000;

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.expiresAt > currentTime));
    }, 250);
    return () => window.clearInterval(interval);
  }, []);

  const closeToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = DEFAULT_DURATION) => {
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

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
        {toasts.map((toast) => {
          const remainingMs = Math.max(0, toast.expiresAt - now);
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          const isError = toast.type === 'error';

          return (
            <div key={toast.id} className={`pointer-events-auto overflow-hidden rounded-2xl border bg-white shadow-2xl ${isError ? 'border-red-200' : 'border-emerald-200'}`}>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${isError ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`label-small tracking-[0.15em] ${isError ? 'text-red-700' : 'text-emerald-700'}`}>{isError ? 'Error' : 'Success'}</p>
                  <p className="mt-1 text-sm leading-6 font-medium text-slate-800">{toast.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">{remainingSeconds}s</span>
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
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
