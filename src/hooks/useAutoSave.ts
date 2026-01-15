/**
 * Auto-Save Hook
 * Automatically saves project data to IndexedDB with debouncing
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLyricsStore } from '../stores';
import { useVisualSettingsStore } from '../stores';
import { toast } from '../stores/toastStore';
import type { LyricLine, VisualSettings, VisualStyle, AspectRatio } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface ProjectData {
  version: number;
  savedAt: string;
  lyrics: LyricLine[];
  userProvidedLyrics: string;
  visualSettings: VisualSettings;
  currentStyle: VisualStyle;
  aspectRatio: AspectRatio;
}

// ============================================================================
// IndexedDB Setup
// ============================================================================

const DB_NAME = 'lyrical-flow-ai';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const AUTO_SAVE_KEY = 'autosave';

let dbInstance: IDBDatabase | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// ============================================================================
// Storage Functions
// ============================================================================

export const saveProject = async (key: string, data: ProjectData): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: key, ...data });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Failed to save project:', error);
    // Fallback to localStorage for smaller data
    try {
      localStorage.setItem(`lyrical-flow-${key}`, JSON.stringify(data));
    } catch (localStorageError) {
      console.error('LocalStorage fallback also failed:', localStorageError);
    }
  }
};

export const loadProject = async (key: string): Promise<ProjectData | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...data } = request.result;
          resolve(data as ProjectData);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Failed to load project from IndexedDB:', error);
    // Fallback to localStorage
    try {
      const data = localStorage.getItem(`lyrical-flow-${key}`);
      return data ? JSON.parse(data) : null;
    } catch (localStorageError) {
      console.error('LocalStorage fallback also failed:', localStorageError);
      return null;
    }
  }
};

export const deleteProject = async (key: string): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Failed to delete project:', error);
    localStorage.removeItem(`lyrical-flow-${key}`);
  }
};

// ============================================================================
// Auto-Save Hook
// ============================================================================

interface UseAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  onSave?: () => void;
  onRestore?: (data: ProjectData) => void;
}

export const useAutoSave = (options: UseAutoSaveOptions = {}) => {
  const { debounceMs = 2000, enabled = true, onSave, onRestore } = options;

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');
  const hasRestoredRef = useRef(false);

  // Get store data
  const lyrics = useLyricsStore((state) => state.lyrics);
  const userProvidedLyrics = useLyricsStore((state) => state.userProvidedLyrics);
  const visualSettings = useVisualSettingsStore((state) => state.visualSettings);
  const currentStyle = useVisualSettingsStore((state) => state.currentStyle);
  const aspectRatio = useVisualSettingsStore((state) => state.aspectRatio);

  // Store setters for restoration
  const setLyrics = useLyricsStore((state) => state.setLyrics);
  const setUserProvidedLyrics = useLyricsStore((state) => state.setUserProvidedLyrics);

  // Create project data
  const createProjectData = useCallback(
    (): ProjectData => ({
      version: 1,
      savedAt: new Date().toISOString(),
      lyrics,
      userProvidedLyrics,
      visualSettings,
      currentStyle,
      aspectRatio,
    }),
    [lyrics, userProvidedLyrics, visualSettings, currentStyle, aspectRatio]
  );

  // Save function
  const save = useCallback(async () => {
    if (!enabled) return;

    const data = createProjectData();
    const dataString = JSON.stringify(data);

    // Skip if nothing changed
    if (dataString === lastSaveRef.current) return;

    lastSaveRef.current = dataString;
    await saveProject(AUTO_SAVE_KEY, data);
    onSave?.();
  }, [enabled, createProjectData, onSave]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(save, debounceMs);
  }, [save, debounceMs]);

  // Restore function
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const data = await loadProject(AUTO_SAVE_KEY);
      if (data && data.lyrics && data.lyrics.length > 0) {
        setLyrics(data.lyrics);
        if (data.userProvidedLyrics) {
          setUserProvidedLyrics(data.userProvidedLyrics);
        }
        onRestore?.(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to restore project:', error);
      return false;
    }
  }, [setLyrics, setUserProvidedLyrics, onRestore]);

  // Clear auto-save
  const clear = useCallback(async () => {
    await deleteProject(AUTO_SAVE_KEY);
    lastSaveRef.current = '';
  }, []);

  // Auto-save on data changes
  useEffect(() => {
    if (enabled && lyrics.length > 0) {
      debouncedSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    enabled,
    lyrics,
    userProvidedLyrics,
    visualSettings,
    currentStyle,
    aspectRatio,
    debouncedSave,
  ]);

  // Check for auto-save on mount
  useEffect(() => {
    if (!hasRestoredRef.current && enabled) {
      hasRestoredRef.current = true;
      loadProject(AUTO_SAVE_KEY).then((data) => {
        if (data && data.lyrics && data.lyrics.length > 0) {
          // Show toast asking user if they want to restore
          toast.info('Previous session found', 'Would you like to restore your previous work?');
        }
      });
    }
  }, [enabled]);

  return {
    save,
    restore,
    clear,
    hasAutoSave: async () => {
      const data = await loadProject(AUTO_SAVE_KEY);
      return data !== null && data.lyrics && data.lyrics.length > 0;
    },
  };
};

export default useAutoSave;
