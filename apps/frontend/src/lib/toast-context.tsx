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

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const duration = toast.duration ?? 3000;

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-surface shadow-emerald-500/5';
      case 'error':
        return 'border-rose-500/40 bg-surface shadow-rose-500/5';
      case 'warning':
        return 'border-amber-500/40 bg-surface shadow-amber-500/5';
      case 'info':
      default:
        return 'border-sky-500/40 bg-surface shadow-sky-500/5';
    }
  };

  const getProgressColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
      default:
        return 'bg-sky-500';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return (
          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'error':
        return (
          <div className="p-1 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-1 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="p-1 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      role="alert"
      className={`relative overflow-hidden pointer-events-auto flex items-start gap-3 p-3.5 rounded-[8px] border shadow-lg backdrop-blur-md transition-all duration-200 ${getBorderColor(
        toast.type
      )} text-text animate-in slide-in-from-right-8 fade-in`}
      style={{
        minWidth: '300px',
        maxWidth: '380px',
      }}
    >
      {getToastIcon(toast.type)}

      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs font-bold text-text leading-tight">{toast.title}</div>
        {toast.description && (
          <p className="text-[11px] text-text-muted mt-1 leading-snug">{toast.description}</p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 -mr-1 -mt-1 rounded-[4px] text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
        aria-label="Close Alert"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 3s Running Progress Bar Animation */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-muted/60 overflow-hidden">
          <div
            className={`h-full ${getProgressColor(toast.type)} animate-toast-progress`}
            style={{
              animationDuration: `${duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ title: string; time: number } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, description, duration = 3000 }: Omit<ToastItem, 'id' | 'createdAt'>) => {
      const now = Date.now();

      // Prevent exact duplicate notifications within 1.0 second
      if (
        lastToastRef.current &&
        lastToastRef.current.title === title &&
        now - lastToastRef.current.time < 1000
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
    (title: string, description?: string) => addToast({ type: 'success', title, description, duration: 3000 }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => addToast({ type: 'error', title, description, duration: 4000 }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => addToast({ type: 'warning', title, description, duration: 3500 }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast({ type: 'info', title, description, duration: 3000 }),
    [addToast]
  );

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

      {/* Floating Toast Container - Top-Right Fixed Position */}
      <div
        aria-live="assertive"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
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
