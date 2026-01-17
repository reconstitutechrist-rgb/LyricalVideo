/**
 * Type declarations for troika-three-text
 */

declare module 'troika-three-text' {
  import { Mesh, Color, Material } from 'three';

  export interface TextOptions {
    text?: string;
    font?: string;
    fontSize?: number;
    color?: string | number | Color;
    anchorX?: 'left' | 'center' | 'right' | number;
    anchorY?:
      | 'top'
      | 'top-baseline'
      | 'top-cap'
      | 'top-ex'
      | 'middle'
      | 'bottom-baseline'
      | 'bottom'
      | number;
    textAlign?: 'left' | 'right' | 'center' | 'justify';
    maxWidth?: number;
    lineHeight?: number | 'normal';
    letterSpacing?: number;
    whiteSpace?: 'normal' | 'nowrap';
    overflowWrap?: 'normal' | 'break-word';
    outlineWidth?: number | string;
    outlineColor?: string | number | Color;
    outlineBlur?: number | string;
    outlineOffsetX?: number | string;
    outlineOffsetY?: number | string;
    strokeWidth?: number | string;
    strokeColor?: string | number | Color;
    fillOpacity?: number;
    strokeOpacity?: number;
    depthOffset?: number;
    clipRect?: [number, number, number, number] | null;
    orientation?: string;
    glyphGeometryDetail?: number;
    sdfGlyphSize?: number | null;
    gpuAccelerateSDF?: boolean;
  }

  export class Text extends Mesh {
    text: string;
    font: string | null;
    fontSize: number;
    color: string | number | Color;
    anchorX: 'left' | 'center' | 'right' | number;
    anchorY:
      | 'top'
      | 'top-baseline'
      | 'top-cap'
      | 'top-ex'
      | 'middle'
      | 'bottom-baseline'
      | 'bottom'
      | number;
    textAlign: 'left' | 'right' | 'center' | 'justify';
    maxWidth: number;
    lineHeight: number | 'normal';
    letterSpacing: number;
    whiteSpace: 'normal' | 'nowrap';
    overflowWrap: 'normal' | 'break-word';
    outlineWidth: number | string;
    outlineColor: string | number | Color;
    outlineBlur: number | string;
    outlineOffsetX: number | string;
    outlineOffsetY: number | string;
    strokeWidth: number | string;
    strokeColor: string | number | Color;
    fillOpacity: number;
    strokeOpacity: number;
    depthOffset: number;
    clipRect: [number, number, number, number] | null;
    orientation: string;
    glyphGeometryDetail: number;
    sdfGlyphSize: number | null;
    gpuAccelerateSDF: boolean;
    material: Material;

    sync(callback?: () => void): void;
    dispose(): void;
  }

  export function preloadFont(
    options: { font: string; characters?: string },
    callback?: () => void
  ): void;
}
