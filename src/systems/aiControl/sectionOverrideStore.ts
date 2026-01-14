import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { VisualSettings, LyricLine } from '../../../types';
import { SectionOverride, SectionOverrideState, SectionOverrideActions } from './types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: SectionOverrideState = {
  overrides: new Map(),
};

// ============================================================================
// SECTION OVERRIDE STORE
// ============================================================================

export const useSectionOverrideStore = create<SectionOverrideState & SectionOverrideActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /**
         * Set or create an override for a section
         */
        setOverride: (sectionName: string, override: SectionOverride) =>
          set(
            (state) => {
              const newOverrides = new Map(state.overrides);
              newOverrides.set(sectionName.toLowerCase(), override);
              return { overrides: newOverrides };
            },
            false,
            'setOverride'
          ),

        /**
         * Update settings for an existing override
         */
        updateOverride: (sectionName: string, settings: Partial<VisualSettings>) =>
          set(
            (state) => {
              const newOverrides = new Map(state.overrides);
              const existing = newOverrides.get(sectionName.toLowerCase());
              if (existing) {
                newOverrides.set(sectionName.toLowerCase(), {
                  ...existing,
                  settings: { ...existing.settings, ...settings },
                });
              } else {
                // Create new override if it doesn't exist
                newOverrides.set(sectionName.toLowerCase(), {
                  sectionName: sectionName.toLowerCase(),
                  lyricIndices: [],
                  settings,
                  enabled: true,
                });
              }
              return { overrides: newOverrides };
            },
            false,
            'updateOverride'
          ),

        /**
         * Remove an override
         */
        removeOverride: (sectionName: string) =>
          set(
            (state) => {
              const newOverrides = new Map(state.overrides);
              newOverrides.delete(sectionName.toLowerCase());
              return { overrides: newOverrides };
            },
            false,
            'removeOverride'
          ),

        /**
         * Toggle an override's enabled state
         */
        toggleOverride: (sectionName: string) =>
          set(
            (state) => {
              const newOverrides = new Map(state.overrides);
              const existing = newOverrides.get(sectionName.toLowerCase());
              if (existing) {
                newOverrides.set(sectionName.toLowerCase(), {
                  ...existing,
                  enabled: !existing.enabled,
                });
              }
              return { overrides: newOverrides };
            },
            false,
            'toggleOverride'
          ),

        /**
         * Clear all overrides
         */
        clearAllOverrides: () => set({ overrides: new Map() }, false, 'clearAllOverrides'),

        /**
         * Get the effective settings for a lyric, merging global with section overrides
         */
        getSettingsForLyric: (
          lyricIndex: number,
          lyrics: LyricLine[],
          globalSettings: VisualSettings
        ): VisualSettings => {
          const lyric = lyrics[lyricIndex];
          if (!lyric || !lyric.section) {
            return globalSettings;
          }

          const override = get().overrides.get(lyric.section.toLowerCase());
          if (override && override.enabled) {
            return { ...globalSettings, ...override.settings };
          }

          return globalSettings;
        },

        /**
         * Get the override for the current playback time
         */
        getOverrideForTime: (currentTime: number, lyrics: LyricLine[]): SectionOverride | null => {
          const currentLyric = lyrics.find(
            (l) => currentTime >= l.startTime && currentTime <= l.endTime
          );

          if (!currentLyric || !currentLyric.section) {
            return null;
          }

          const override = get().overrides.get(currentLyric.section.toLowerCase());
          return override?.enabled ? override : null;
        },
      }),
      {
        name: 'section-overrides-storage',
        // Custom serialization for Map
        storage: {
          getItem: (name: string) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            try {
              const parsed = JSON.parse(str);
              // Convert array back to Map
              if (parsed.state && Array.isArray(parsed.state.overrides)) {
                parsed.state.overrides = new Map(parsed.state.overrides);
              }
              return parsed;
            } catch {
              return null;
            }
          },
          setItem: (name: string, value: unknown) => {
            const toStore = value as { state: SectionOverrideState };
            const serializable = {
              ...toStore,
              state: {
                ...toStore.state,
                overrides: Array.from(toStore.state.overrides.entries()),
              },
            };
            localStorage.setItem(name, JSON.stringify(serializable));
          },
          removeItem: (name: string) => localStorage.removeItem(name),
        },
      }
    ),
    { name: 'section-override-store' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Select all overrides as an array
 */
export const selectOverridesArray = (state: SectionOverrideState): SectionOverride[] =>
  Array.from(state.overrides.values());

/**
 * Select enabled overrides only
 */
export const selectEnabledOverrides = (state: SectionOverrideState): SectionOverride[] =>
  Array.from(state.overrides.values()).filter((o) => o.enabled);

/**
 * Select override count
 */
export const selectOverrideCount = (state: SectionOverrideState): number => state.overrides.size;

/**
 * Select if any overrides are active
 */
export const selectHasOverrides = (state: SectionOverrideState): boolean =>
  state.overrides.size > 0;

/**
 * Select override for a specific section
 */
export const selectOverrideForSection = (
  state: SectionOverrideState,
  sectionName: string
): SectionOverride | undefined => state.overrides.get(sectionName.toLowerCase());

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the merged visual settings for a specific time in the song
 */
export function getMergedSettingsForTime(
  currentTime: number,
  lyrics: LyricLine[],
  globalSettings: VisualSettings
): VisualSettings {
  const store = useSectionOverrideStore.getState();
  const override = store.getOverrideForTime(currentTime, lyrics);

  if (override) {
    return { ...globalSettings, ...override.settings };
  }

  return globalSettings;
}

/**
 * Check if a section has an active override
 */
export function hasSectionOverride(sectionName: string): boolean {
  const store = useSectionOverrideStore.getState();
  const override = store.overrides.get(sectionName.toLowerCase());
  return override?.enabled ?? false;
}

/**
 * Get all section names that have overrides
 */
export function getSectionsWithOverrides(): string[] {
  const store = useSectionOverrideStore.getState();
  return Array.from(store.overrides.entries())
    .filter(([, override]) => override.enabled)
    .map(([name]) => name);
}
