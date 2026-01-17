/**
 * Effect Parameter Type Definitions
 * Defines the structure for configurable effect parameters
 */

export type ParameterType = 'slider' | 'color' | 'enum' | 'boolean';

export interface SliderParameter {
  id: string;
  label: string;
  type: 'slider';
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string; // e.g., 'px', '%', 'deg'
}

export interface ColorParameter {
  id: string;
  label: string;
  type: 'color';
  defaultValue: string; // Hex color
}

export interface EnumParameter {
  id: string;
  label: string;
  type: 'enum';
  defaultValue: string;
  options: { value: string; label: string }[];
}

export interface BooleanParameter {
  id: string;
  label: string;
  type: 'boolean';
  defaultValue: boolean;
}

export type EffectParameter = SliderParameter | ColorParameter | EnumParameter | BooleanParameter;

export type ParameterValues = Record<string, number | string | boolean>;

/**
 * Helper to create a slider parameter
 */
export function slider(
  id: string,
  label: string,
  defaultValue: number,
  min: number,
  max: number,
  step?: number,
  unit?: string
): SliderParameter {
  return { id, label, type: 'slider', defaultValue, min, max, step, unit };
}

/**
 * Helper to create a color parameter
 */
export function color(id: string, label: string, defaultValue: string): ColorParameter {
  return { id, label, type: 'color', defaultValue };
}

/**
 * Helper to create an enum parameter
 */
export function enumParam(
  id: string,
  label: string,
  defaultValue: string,
  options: { value: string; label: string }[]
): EnumParameter {
  return { id, label, type: 'enum', defaultValue, options };
}

/**
 * Helper to create a boolean parameter
 */
export function boolean(id: string, label: string, defaultValue: boolean): BooleanParameter {
  return { id, label, type: 'boolean', defaultValue };
}

/**
 * Extract default values from parameter definitions
 */
export function getDefaultValues(parameters: EffectParameter[]): ParameterValues {
  const values: ParameterValues = {};
  for (const param of parameters) {
    values[param.id] = param.defaultValue;
  }
  return values;
}
