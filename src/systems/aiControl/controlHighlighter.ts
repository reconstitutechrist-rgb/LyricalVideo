import { ControlDefinition, HighlightOptions } from './types';
import { findControlById } from './controlRegistry';

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_HIGHLIGHT_OPTIONS: Required<HighlightOptions> = {
  duration: 5000,
  scrollIntoView: true,
  pulseAnimation: true,
};

// ============================================================================
// CONTROL HIGHLIGHTER SERVICE
// ============================================================================

class ControlHighlighterService {
  private activeHighlights: Map<string, HTMLElement> = new Map();
  private overlayContainer: HTMLElement | null = null;
  private cleanupFunctions: Map<string, () => void> = new Map();

  /**
   * Initialize the highlighter (creates overlay container)
   */
  init(): void {
    if (typeof document === 'undefined') return;

    if (!this.overlayContainer) {
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.id = 'ai-control-highlight-overlay';
      this.overlayContainer.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(this.overlayContainer);
    }
  }

  /**
   * Highlight a control element
   */
  highlightControl(control: ControlDefinition, options: HighlightOptions = {}): void {
    if (typeof document === 'undefined') return;

    this.init();

    const opts = { ...DEFAULT_HIGHLIGHT_OPTIONS, ...options };

    // Find the element
    const element = document.querySelector(control.domSelector) as HTMLElement;
    if (!element) {
      console.warn(`Control element not found: ${control.domSelector}`);
      return;
    }

    // Clear any existing highlight for this control
    this.clearHighlight(control.id);

    // Scroll into view
    if (opts.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Create highlight overlay
    const rect = element.getBoundingClientRect();
    const highlight = this.createHighlightElement(rect, control, opts.pulseAnimation);

    if (this.overlayContainer) {
      this.overlayContainer.appendChild(highlight);
      this.activeHighlights.set(control.id, highlight);
    }

    // Add highlight class to original element
    element.classList.add('ai-control-highlighted');
    element.setAttribute('data-ai-highlighted', 'true');

    // Set up position update handlers
    const updatePosition = (): void => {
      if (!element.isConnected) {
        this.clearHighlight(control.id);
        return;
      }
      const newRect = element.getBoundingClientRect();
      this.updateHighlightPosition(highlight, newRect);
    };

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    // Also listen for container scroll (left panel)
    const scrollContainer = element.closest('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updatePosition, { passive: true });
    }

    // Store cleanup function
    const cleanup = (): void => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', updatePosition);
      }
    };
    this.cleanupFunctions.set(control.id, cleanup);

    // Auto-remove after duration
    if (opts.duration > 0) {
      setTimeout(() => {
        this.clearHighlight(control.id);
      }, opts.duration);
    }
  }

  /**
   * Highlight a control by ID
   */
  highlightControlById(controlId: string, options: HighlightOptions = {}): void {
    const control = findControlById(controlId);
    if (control) {
      this.highlightControl(control, options);
    }
  }

  /**
   * Create the highlight overlay element
   */
  private createHighlightElement(
    rect: DOMRect,
    control: ControlDefinition,
    animate: boolean
  ): HTMLElement {
    const highlight = document.createElement('div');
    highlight.className = 'ai-control-highlight';
    highlight.setAttribute('data-control-id', control.id);

    // Base styles
    highlight.style.cssText = `
      position: fixed;
      border-radius: 8px;
      border: 2px solid #00d4ff;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 10px rgba(0, 212, 255, 0.2);
      pointer-events: none;
      transition: all 0.2s ease-out;
    `;

    // Add animation class
    if (animate) {
      highlight.classList.add('ai-highlight-pulse');
    }

    // Position the highlight
    this.updateHighlightPosition(highlight, rect);

    // Add label tooltip
    const label = document.createElement('div');
    label.className = 'ai-control-highlight-label';
    label.style.cssText = `
      position: absolute;
      top: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      color: #00d4ff;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 212, 255, 0.3);
    `;
    label.textContent = control.displayName;
    highlight.appendChild(label);

    return highlight;
  }

  /**
   * Update the position of a highlight element
   */
  private updateHighlightPosition(highlight: HTMLElement, rect: DOMRect): void {
    const padding = 4;
    highlight.style.left = `${rect.left - padding}px`;
    highlight.style.top = `${rect.top - padding}px`;
    highlight.style.width = `${rect.width + padding * 2}px`;
    highlight.style.height = `${rect.height + padding * 2}px`;
  }

  /**
   * Clear a specific highlight
   */
  clearHighlight(controlId: string): void {
    // Remove overlay element
    const highlight = this.activeHighlights.get(controlId);
    if (highlight) {
      highlight.remove();
      this.activeHighlights.delete(controlId);
    }

    // Run cleanup function
    const cleanup = this.cleanupFunctions.get(controlId);
    if (cleanup) {
      cleanup();
      this.cleanupFunctions.delete(controlId);
    }

    // Remove class from original element
    const control = findControlById(controlId);
    if (control) {
      const element = document.querySelector(control.domSelector);
      if (element) {
        element.classList.remove('ai-control-highlighted');
        element.removeAttribute('data-ai-highlighted');
      }
    }
  }

  /**
   * Clear all active highlights
   */
  clearAllHighlights(): void {
    for (const controlId of this.activeHighlights.keys()) {
      this.clearHighlight(controlId);
    }
  }

  /**
   * Check if a control is currently highlighted
   */
  isHighlighted(controlId: string): boolean {
    return this.activeHighlights.has(controlId);
  }

  /**
   * Get all currently highlighted control IDs
   */
  getHighlightedControls(): string[] {
    return Array.from(this.activeHighlights.keys());
  }

  /**
   * Flash highlight (brief attention-grabbing animation)
   */
  flashControl(controlId: string): void {
    const control = findControlById(controlId);
    if (!control) return;

    this.highlightControl(control, {
      duration: 1500,
      scrollIntoView: true,
      pulseAnimation: true,
    });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const controlHighlighter = new ControlHighlighterService();

// ============================================================================
// INJECT CSS STYLES
// ============================================================================

/**
 * Inject the CSS styles for highlighting
 */
export function injectHighlightStyles(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'ai-control-highlight-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes ai-highlight-pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
        box-shadow: 0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 10px rgba(0, 212, 255, 0.2);
      }
      50% {
        opacity: 0.85;
        transform: scale(1.02);
        box-shadow: 0 0 30px rgba(0, 212, 255, 0.7), inset 0 0 15px rgba(0, 212, 255, 0.3);
      }
    }

    .ai-highlight-pulse {
      animation: ai-highlight-pulse 1.5s ease-in-out infinite;
    }

    .ai-control-highlighted {
      position: relative;
      z-index: 10;
    }

    .ai-control-highlighted::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: inherit;
      border: 2px solid rgba(0, 212, 255, 0.4);
      pointer-events: none;
      animation: ai-highlight-pulse 1.5s ease-in-out infinite;
    }

    /* Ensure highlighted elements are visible above others */
    [data-ai-highlighted="true"] {
      z-index: 100 !important;
    }
  `;
  document.head.appendChild(style);
}
