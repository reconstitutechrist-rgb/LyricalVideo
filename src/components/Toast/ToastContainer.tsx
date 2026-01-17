/**
 * Toast Container
 * Renders all active toasts in a fixed position
 */

import React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { Toast } from './Toast';

// ============================================================================
// Toast Container Component
// ============================================================================

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
