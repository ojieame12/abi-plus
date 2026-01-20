/* eslint-disable react-refresh/only-export-components -- Exports hook alongside components by design */
// Toast - Notification component following liquid design system
// Displays temporary notifications for actions like upgrade requests

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, Clock } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'pending';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, 0 for persistent
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  pending: Clock,
};

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-500',
    title: 'text-emerald-800',
    description: 'text-emerald-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    description: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    description: 'text-blue-600',
  },
  pending: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    description: 'text-amber-600',
  },
};

function Toast({ toast, onDismiss }: ToastProps) {
  const { id, type, title, description, duration = 5000 } = toast;
  const Icon = TOAST_ICONS[type];
  const styles = TOAST_STYLES[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onDismiss(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`
        flex items-start gap-3 p-4 rounded-2xl
        ${styles.bg} border ${styles.border}
        shadow-[0_8px_30px_rgb(0,0,0,0.08)]
        backdrop-blur-sm
        max-w-sm w-full
      `}
    >
      <div className={`p-1 rounded-full ${styles.bg}`} aria-hidden="true">
        <Icon className={`w-5 h-5 ${styles.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
        {description && (
          <p className={`text-sm ${styles.description} mt-0.5`}>{description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        aria-label={`Dismiss ${type} notification`}
        className={`
          p-1 rounded-lg ${styles.icon}
          hover:bg-white/50 transition-colors
        `}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Toast Container - renders toast stack
interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for toast management
import { useState, useCallback } from 'react';

export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, description?: string) => {
    return addToast({ type: 'success', title, description });
  }, [addToast]);

  const showError = useCallback((title: string, description?: string) => {
    return addToast({ type: 'error', title, description });
  }, [addToast]);

  const showInfo = useCallback((title: string, description?: string) => {
    return addToast({ type: 'info', title, description });
  }, [addToast]);

  const showPending = useCallback((title: string, description?: string) => {
    // Pending toasts auto-dismiss after 10s to prevent stacking in demo flows
    return addToast({ type: 'pending', title, description, duration: 10000 });
  }, [addToast]);

  return {
    toasts,
    addToast,
    dismissToast,
    showSuccess,
    showError,
    showInfo,
    showPending,
  };
}
