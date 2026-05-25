'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const NotificationsContext = createContext({ notify: () => {} });

const LEVEL_STYLES = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-accent-success500',
    bg: 'bg-accent-success950/95 border-accent-success600/50',
    text: 'text-accent-success300',
  },
  info: {
    icon: Info,
    bar: 'bg-sky-500',
    bg: 'bg-sky-950/95 border-sky-500/50',
    text: 'text-sky-300',
  },
  warn: {
    icon: AlertTriangle,
    bar: 'bg-amber-500',
    bg: 'bg-amber-950/95 border-amber-500/50',
    text: 'text-amber-300',
  },
  error: {
    icon: XCircle,
    bar: 'bg-red-500',
    bg: 'bg-red-950/95 border-red-500/50',
    text: 'text-red-300',
  },
};

let _idCounter = 0;

function Toast({ toast, onDismiss }) {
  const style = LEVEL_STYLES[toast.level] || LEVEL_STYLES.info;
  const Icon = style.icon;
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className={`relative w-full sm:w-80 max-w-sm rounded-xl border backdrop-blur-xl shadow-2xl shadow-black/45 overflow-hidden ring-1 ring-white/10 ${style.bg}`}
    >
      <div className={`absolute top-0 left-0 h-0.5 w-full ${style.bar}`} />
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 drop-shadow ${style.text}`} />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`text-sm font-semibold leading-tight tracking-tight ${style.text}`}>{toast.title}</p>
          )}
          {toast.message && (
            <p className="text-xs text-white/85 mt-1 leading-snug">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="h-5 w-5 rounded-md hover:bg-white/10 inline-flex items-center justify-center shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-white/50" />
        </button>
      </div>
    </motion.div>
  );
}

export function NotificationsProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(({ title, message, level = 'info' }) => {
    const id = ++_idCounter;
    setToasts((prev) => [...prev.slice(-4), { id, title, message, level }]);
  }, []);

  return (
    <NotificationsContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] inset-x-3 sm:inset-x-auto sm:right-4 z-[1200] flex flex-col items-stretch sm:items-end gap-2 pointer-events-none"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
