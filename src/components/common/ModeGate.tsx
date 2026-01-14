/**
 * ModeGate Component
 * Conditionally renders content based on UI mode (simple/advanced)
 */

import React from 'react';
import { useUIModeStore, selectIsAdvancedMode } from '../../stores/uiModeStore';

export type ModeType = 'simple' | 'advanced' | 'both';

export interface ModeGateProps {
  /** Which mode(s) should show this content */
  mode: ModeType;
  /** Content to render when mode matches */
  children: React.ReactNode;
  /** Optional fallback for when content is hidden */
  fallback?: React.ReactNode;
  /** Optional className for the wrapper */
  className?: string;
  /** Enable fade animation on show/hide */
  animate?: boolean;
}

/**
 * ModeGate conditionally renders children based on the current UI mode.
 *
 * @example
 * // Only show in advanced mode
 * <ModeGate mode="advanced">
 *   <AdvancedControls />
 * </ModeGate>
 *
 * @example
 * // Show in simple mode with fallback
 * <ModeGate mode="advanced" fallback={<SimplifiedControls />}>
 *   <DetailedControls />
 * </ModeGate>
 */
export const ModeGate: React.FC<ModeGateProps> = ({
  mode,
  children,
  fallback = null,
  className,
  animate = true,
}) => {
  const isAdvancedMode = useUIModeStore(selectIsAdvancedMode);

  const shouldShow =
    mode === 'both' ||
    (mode === 'advanced' && isAdvancedMode) ||
    (mode === 'simple' && !isAdvancedMode);

  if (!shouldShow) {
    return <>{fallback}</>;
  }

  if (animate) {
    return (
      <div className={`transition-opacity duration-200 ${className || ''}`} style={{ opacity: 1 }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default ModeGate;
