/**
 * Toast Component
 * Displays toast notifications with various styles
 */

import React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { Toast as ToastType, ToastType as ToastVariant } from '../../stores/toastStore';

// ============================================================================
// Toast Icon
// ============================================================================

const TOAST_ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

// ============================================================================
// Toast Styles
// ============================================================================

const TOAST_STYLES: Record<ToastVariant, { container: string; icon: string; title: string }> = {
  success: {
    container: 'bg-green-900/90 border-green-500/50',
    icon: 'text-green-400',
    title: 'text-green-100',
  },
  error: {
    container: 'bg-red-900/90 border-red-500/50',
    icon: 'text-red-400',
    title: 'text-red-100',
  },
  warning: {
    container: 'bg-yellow-900/90 border-yellow-500/50',
    icon: 'text-yellow-400',
    title: 'text-yellow-100',
  },
  info: {
    container: 'bg-blue-900/90 border-blue-500/50',
    icon: 'text-blue-400',
    title: 'text-blue-100',
  },
};

// ============================================================================
// Toast Component
// ============================================================================

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const Icon = TOAST_ICONS[toast.type];
  const styles = TOAST_STYLES[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
        shadow-lg min-w-[320px] max-w-[420px]
        animate-in slide-in-from-right-full fade-in duration-300
        ${styles.container}
      `}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${styles.title}`}>{toast.title}</p>
        {toast.message && <p className="text-sm text-slate-300 mt-1">{toast.message}</p>}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-sm font-medium text-white/80 hover:text-white mt-2 underline underline-offset-2"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {toast.dismissible && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Dismiss"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Toast;
