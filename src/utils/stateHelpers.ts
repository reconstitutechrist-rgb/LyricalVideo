/**
 * State Helper Utilities
 * Optimized immutable update functions for React state management
 */

/**
 * Immutable array update at specific index
 * Only creates new array if item actually changed
 */
export function updateAtIndex<T>(array: T[], index: number, updater: (item: T) => T): T[] {
  if (index < 0 || index >= array.length) return array;

  const item = array[index];
  const updated = updater(item);

  // Reference equality check - no change needed
  if (updated === item) return array;

  const result = [...array];
  result[index] = updated;
  return result;
}

/**
 * Optimized map that returns same array if nothing changed
 * Avoids unnecessary re-renders when mapping produces identical results
 */
export function mapIfChanged<T>(array: T[], mapper: (item: T, index: number) => T): T[] {
  let changed = false;
  const result = array.map((item, i) => {
    const mapped = mapper(item, i);
    if (mapped !== item) changed = true;
    return mapped;
  });
  return changed ? result : array;
}

/**
 * Remove item at index, returns same array if index out of bounds
 */
export function removeAtIndex<T>(array: T[], index: number): T[] {
  if (index < 0 || index >= array.length) return array;
  return [...array.slice(0, index), ...array.slice(index + 1)];
}

/**
 * Insert item at index
 */
export function insertAtIndex<T>(array: T[], index: number, item: T): T[] {
  const clampedIndex = Math.max(0, Math.min(index, array.length));
  return [...array.slice(0, clampedIndex), item, ...array.slice(clampedIndex)];
}

/**
 * Update object property only if value changed
 * Returns same object reference if no change
 */
export function updateProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
): T {
  if (obj[key] === value) return obj;
  return { ...obj, [key]: value };
}

/**
 * Batch update multiple properties
 * Returns same object if no properties changed
 */
export function updateProperties<T extends object>(obj: T, updates: Partial<T>): T {
  let changed = false;
  for (const key in updates) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      if (obj[key] !== updates[key]) {
        changed = true;
        break;
      }
    }
  }
  return changed ? { ...obj, ...updates } : obj;
}
