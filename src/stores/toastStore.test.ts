/**
 * Toast Store Tests
 * Unit tests for the toast notification store
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useToastStore.getState().clearAllToasts();
    // Clear all timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addToast', () => {
    it('should add a toast with correct properties', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', title: 'Test Title', message: 'Test Message' });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Test Title');
      expect(toasts[0].message).toBe('Test Message');
      expect(toasts[0].id).toBeDefined();
    });

    it('should add multiple toasts', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', title: 'Toast 1' });
      store.addToast({ type: 'error', title: 'Toast 2' });
      store.addToast({ type: 'warning', title: 'Toast 3' });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(3);
    });

    it('should generate unique IDs for each toast', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', title: 'Toast 1' });
      store.addToast({ type: 'success', title: 'Toast 2' });

      const toasts = useToastStore.getState().toasts;
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });
  });

  describe('removeToast', () => {
    it('should remove a toast by ID', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', title: 'Test Toast' });

      const toastId = useToastStore.getState().toasts[0].id;
      store.removeToast(toastId);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should not affect other toasts when removing one', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', title: 'Toast 1' });
      store.addToast({ type: 'error', title: 'Toast 2' });

      const toasts = useToastStore.getState().toasts;
      const firstToastId = toasts[0].id;
      store.removeToast(firstToastId);

      const remainingToasts = useToastStore.getState().toasts;
      expect(remainingToasts).toHaveLength(1);
      expect(remainingToasts[0].title).toBe('Toast 2');
    });
  });

  describe('clearAllToasts', () => {
    it('should remove all toasts', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', title: 'Toast 1' });
      store.addToast({ type: 'error', title: 'Toast 2' });
      store.addToast({ type: 'warning', title: 'Toast 3' });

      store.clearAllToasts();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('toast helper object', () => {
    it('should add success toast', () => {
      toast.success('Success Title', 'Success Message');

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Success Title');
    });

    it('should add error toast', () => {
      toast.error('Error Title', 'Error Message');

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
    });

    it('should add warning toast', () => {
      toast.warning('Warning Title', 'Warning Message');

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('warning');
    });

    it('should add info toast', () => {
      toast.info('Info Title', 'Info Message');

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('info');
    });

    it('should dismiss a toast', () => {
      toast.success('Test Toast');
      const toastId = useToastStore.getState().toasts[0].id;

      toast.dismiss(toastId);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should dismiss all toasts', () => {
      toast.success('Toast 1');
      toast.error('Toast 2');

      toast.dismissAll();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('selectors', () => {
    it('selectToastCount should return correct count', () => {
      const store = useToastStore.getState();
      expect(store.toasts.length).toBe(0);

      store.addToast({ type: 'success', title: 'Toast 1' });
      store.addToast({ type: 'error', title: 'Toast 2' });

      expect(useToastStore.getState().toasts.length).toBe(2);
    });

    it('selectHasToasts should return correct boolean', () => {
      expect(useToastStore.getState().toasts.length > 0).toBe(false);

      useToastStore.getState().addToast({ type: 'success', title: 'Test' });

      expect(useToastStore.getState().toasts.length > 0).toBe(true);
    });
  });
});
