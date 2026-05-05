/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

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

  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setToasts((currentToasts) =>
        currentToasts
          .map((toast) => ({
            ...toast,
            secondsLeft: toast.secondsLeft - 1,
          }))
          .filter((toast) => toast.secondsLeft > 0)
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [toasts.length]);

  const showToast = useCallback((message, type = 'success') => {
    setToasts((currentToasts) => [
      ...currentToasts,
      {
        message,
        type,
        secondsLeft: 5,
      },
    ]);
  }, []);

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
        {toasts.map((toast, index) => {
          const isError = toast.type === 'error';

          return (
            <button
              key={`${toast.message}-${index}`}
              type="button"
              onClick={() => setToasts((currentToasts) => currentToasts.filter((currentToast, currentIndex) => currentIndex !== index))}
              className={`cursor-pointer rounded-2xl border bg-white px-4 py-3 text-left shadow-2xl ${isError ? 'border-red-200' : 'border-emerald-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`label-small tracking-[0.15em] ${isError ? 'text-red-700' : 'text-emerald-700'}`}>{isError ? 'Error' : 'Success'}</p>
                  <p className="mt-1 text-sm leading-6 font-medium text-slate-800">{toast.message}</p>
                </div>
                <span className="flex shrink-0 items-center gap-2 text-slate-500">
                  <span className="text-xs font-semibold">{toast.secondsLeft}s</span>
                  <span className="text-lg leading-none font-bold" aria-hidden="true">
                    &times;
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
