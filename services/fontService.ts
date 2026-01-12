/**
 * Font Service
 * Handles custom font upload, registration, and management
 */

export interface CustomFont {
  id: string;
  name: string;
  fileName: string;
  format: 'truetype' | 'opentype' | 'woff' | 'woff2';
  blobUrl: string;
  dataUrl?: string; // For persistence
  createdAt: number;
}

// Built-in fonts
export const BUILTIN_FONTS = ['Space Grotesk', 'Inter', 'Roboto', 'Montserrat', 'Cinzel'] as const;

export type BuiltinFont = (typeof BUILTIN_FONTS)[number];

// Database name and store
const DB_NAME = 'LyricalFlowFonts';
const DB_VERSION = 1;
const STORE_NAME = 'fonts';

// Max custom fonts to store
const MAX_CUSTOM_FONTS = 5;

class FontService {
  private customFonts: Map<string, CustomFont> = new Map();
  private registeredFonts: Set<string> = new Set();
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the font service
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initDB().then(async () => {
      await this.loadStoredFonts();
    });

    return this.initPromise;
  }

  /**
   * Initialize IndexedDB
   */
  private initDB(): Promise<void> {
    return new Promise((resolve, _reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open font database:', request.error);
        resolve(); // Continue without persistence
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Load fonts from IndexedDB
   */
  private async loadStoredFonts(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Failed to load stored fonts');
        resolve();
      };

      request.onsuccess = async () => {
        const fonts = request.result as CustomFont[];
        for (const font of fonts) {
          try {
            // Recreate blob URL from data URL
            if (font.dataUrl) {
              const response = await fetch(font.dataUrl);
              const blob = await response.blob();
              font.blobUrl = URL.createObjectURL(blob);
            }
            await this.registerFontFace(font);
            this.customFonts.set(font.id, font);
          } catch (error) {
            console.error(`Failed to load font ${font.name}:`, error);
          }
        }
        resolve();
      };
    });
  }

  /**
   * Upload and register a custom font
   */
  async uploadFont(file: File): Promise<CustomFont> {
    // Validate file type
    const validTypes = ['.ttf', '.otf', '.woff', '.woff2'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validTypes.includes(extension)) {
      throw new Error(`Invalid font format. Supported: ${validTypes.join(', ')}`);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Font file too large. Maximum size is 5MB.');
    }

    // Check max fonts limit
    if (this.customFonts.size >= MAX_CUSTOM_FONTS) {
      throw new Error(
        `Maximum ${MAX_CUSTOM_FONTS} custom fonts allowed. Remove one to add another.`
      );
    }

    // Determine format
    const formatMap: Record<string, CustomFont['format']> = {
      '.ttf': 'truetype',
      '.otf': 'opentype',
      '.woff': 'woff',
      '.woff2': 'woff2',
    };

    const format = formatMap[extension];

    // Generate font name from file
    const fontName = file.name
      .replace(/\.(ttf|otf|woff2?)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Check for duplicate names
    const existingNames = [...this.customFonts.values()].map((f) => f.name.toLowerCase());
    if (existingNames.includes(fontName.toLowerCase())) {
      throw new Error(`Font "${fontName}" already exists.`);
    }

    // Create blob URL
    const blobUrl = URL.createObjectURL(file);

    // Convert to data URL for persistence
    const dataUrl = await this.fileToDataUrl(file);

    // Create font record
    const font: CustomFont = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: fontName,
      fileName: file.name,
      format,
      blobUrl,
      dataUrl,
      createdAt: Date.now(),
    };

    // Register with browser
    await this.registerFontFace(font);

    // Store in memory
    this.customFonts.set(font.id, font);

    // Persist to IndexedDB
    await this.saveFont(font);

    return font;
  }

  /**
   * Register a font face with the browser
   */
  private async registerFontFace(font: CustomFont): Promise<void> {
    if (this.registeredFonts.has(font.id)) return;

    const fontFace = new FontFace(font.name, `url(${font.blobUrl})`, {
      style: 'normal',
      weight: '400',
    });

    try {
      await fontFace.load();
      document.fonts.add(fontFace);
      this.registeredFonts.add(font.id);
    } catch (error) {
      throw new Error(`Failed to load font: ${error}`);
    }
  }

  /**
   * Save font to IndexedDB
   */
  private saveFont(font: CustomFont): Promise<void> {
    if (!this.db) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Save without blobUrl (will be recreated on load)
      const { blobUrl: _, ...fontData } = font;
      const request = store.put({ ...fontData, blobUrl: '' });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Remove a custom font
   */
  async removeFont(fontId: string): Promise<void> {
    const font = this.customFonts.get(fontId);
    if (!font) return;

    // Revoke blob URL
    URL.revokeObjectURL(font.blobUrl);

    // Remove from memory
    this.customFonts.delete(fontId);
    this.registeredFonts.delete(fontId);

    // Remove from IndexedDB
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(fontId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Get all available fonts (built-in + custom)
   */
  getAllFonts(): { builtin: BuiltinFont[]; custom: CustomFont[] } {
    return {
      builtin: [...BUILTIN_FONTS],
      custom: [...this.customFonts.values()].sort((a, b) => b.createdAt - a.createdAt),
    };
  }

  /**
   * Get all font names for selection
   */
  getAllFontNames(): string[] {
    return [...BUILTIN_FONTS, ...[...this.customFonts.values()].map((f) => f.name)];
  }

  /**
   * Check if a font name is a custom font
   */
  isCustomFont(fontName: string): boolean {
    return [...this.customFonts.values()].some((f) => f.name === fontName);
  }

  /**
   * Get custom font by name
   */
  getCustomFontByName(fontName: string): CustomFont | undefined {
    return [...this.customFonts.values()].find((f) => f.name === fontName);
  }

  /**
   * Get font URL for Three.js/troika
   */
  getFontUrl(fontName: string): string | null {
    const customFont = this.getCustomFontByName(fontName);
    if (customFont) {
      return customFont.blobUrl;
    }
    return null; // Built-in fonts don't need URLs
  }

  /**
   * Convert file to data URL
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Cleanup - revoke all blob URLs
   */
  dispose(): void {
    for (const font of this.customFonts.values()) {
      URL.revokeObjectURL(font.blobUrl);
    }
    this.customFonts.clear();
    this.registeredFonts.clear();
  }
}

// Singleton instance
export const fontService = new FontService();
