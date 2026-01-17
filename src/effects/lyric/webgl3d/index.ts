/**
 * WebGL 3D Effects Index
 * True 3D text effects using Three.js and troika-three-text
 */

export { WebGL3DEffect, Ease3D, colorToThree } from './WebGL3DEffect';
export { PerspectiveRotate3DEffect } from './PerspectiveRotate3D';
export { Extrude3DEffect } from './Extrude3D';
export { Orbit3DEffect } from './Orbit3D';
export { Wave3DEffect } from './Wave3D';
export { Explode3DEffect } from './Explode3D';

// Re-export ThreeRenderer utilities
export {
  ThreeRenderer,
  getThreeRenderer,
  disposeThreeRenderer,
} from '../../../../services/threeRenderer';
