'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ title: string; time: number } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, description, duration = 4500 }: Omit<ToastItem, 'id' | 'createdAt'>) => {
      const now = Date.now();

      // Prevent exact duplicate notifications within 1.2 seconds
      if (
        lastToastRef.current &&
        lastToastRef.current.title === title &&
        now - lastToastRef.current.time < 1200
      ) {
        return '';
      }
      lastToastRef.current = { title, time: now };

      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        type,
        title,
        description,
        duration,
        createdAt: now,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep maximum 5 on screen

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ type: 'success', title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => addToast({ type: 'error', title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => addToast({ type: 'warning', title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast({ type: 'info', title, description }),
    [addToast]
  );

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20';
      case 'error':
        return 'border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/20';
      case 'warning':
        return 'border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/20';
      case 'info':
      default:
        return 'border-sky-500/30 bg-sky-50/80 dark:bg-sky-950/20';
    }
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[8px] border shadow-card backdrop-blur-md transition-all animate-in slide-in-from-top-3 fade-in duration-200 ${getBorderColor(
              toast.type
            )} bg-surface text-text`}
          >
            {getToastIcon(toast.type)}

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-xs font-semibold text-text leading-tight">{toast.title}</div>
              {toast.description && (
                <p className="text-[11px] text-text-muted mt-0.5 leading-normal">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
