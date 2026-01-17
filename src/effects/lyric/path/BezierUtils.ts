/**
 * Bezier Curve Utilities
 * Math utilities for cubic bezier curves and path animations
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface PathPoint extends Point2D {
  angle: number; // Tangent angle in radians
  t: number; // Parameter position (0-1)
}

/**
 * Cubic Bezier Curve
 */
export class CubicBezier {
  constructor(
    public p0: Point2D,
    public p1: Point2D,
    public p2: Point2D,
    public p3: Point2D
  ) {}

  /**
   * Evaluate point at parameter t using De Casteljau's algorithm
   */
  evaluate(t: number): Point2D {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return {
      x: mt3 * this.p0.x + 3 * mt2 * t * this.p1.x + 3 * mt * t2 * this.p2.x + t3 * this.p3.x,
      y: mt3 * this.p0.y + 3 * mt2 * t * this.p1.y + 3 * mt * t2 * this.p2.y + t3 * this.p3.y,
    };
  }

  /**
   * Get tangent (derivative) at parameter t
   */
  tangent(t: number): Point2D {
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    return {
      x:
        3 * mt2 * (this.p1.x - this.p0.x) +
        6 * mt * t * (this.p2.x - this.p1.x) +
        3 * t2 * (this.p3.x - this.p2.x),
      y:
        3 * mt2 * (this.p1.y - this.p0.y) +
        6 * mt * t * (this.p2.y - this.p1.y) +
        3 * t2 * (this.p3.y - this.p2.y),
    };
  }

  /**
   * Get angle of tangent at parameter t
   */
  tangentAngle(t: number): number {
    const tan = this.tangent(t);
    return Math.atan2(tan.y, tan.x);
  }

  /**
   * Get point with angle at parameter t
   */
  getPathPoint(t: number): PathPoint {
    const point = this.evaluate(t);
    return {
      ...point,
      angle: this.tangentAngle(t),
      t,
    };
  }

  /**
   * Approximate arc length using numerical integration
   */
  arcLength(samples: number = 100): number {
    let length = 0;
    let prev = this.evaluate(0);

    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const curr = this.evaluate(t);
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      length += Math.sqrt(dx * dx + dy * dy);
      prev = curr;
    }

    return length;
  }

  /**
   * Sample points along curve with uniform arc length spacing
   */
  sampleUniform(count: number): PathPoint[] {
    const totalLength = this.arcLength();
    const spacing = totalLength / (count - 1);
    const points: PathPoint[] = [];

    let accumulatedLength = 0;
    let prevPoint = this.evaluate(0);
    let prevT = 0;

    points.push(this.getPathPoint(0));

    for (let i = 1; i < count; i++) {
      const targetLength = i * spacing;

      // Find t for target arc length
      while (accumulatedLength < targetLength && prevT < 1) {
        const nextT = Math.min(prevT + 0.001, 1);
        const nextPoint = this.evaluate(nextT);
        const dx = nextPoint.x - prevPoint.x;
        const dy = nextPoint.y - prevPoint.y;
        accumulatedLength += Math.sqrt(dx * dx + dy * dy);
        prevPoint = nextPoint;
        prevT = nextT;
      }

      points.push(this.getPathPoint(prevT));
    }

    return points;
  }
}

/**
 * Path made of multiple bezier segments
 */
export class BezierPath {
  private segments: CubicBezier[] = [];
  private _totalLength: number = 0;
  private segmentLengths: number[] = [];

  addSegment(bezier: CubicBezier): void {
    this.segments.push(bezier);
    const len = bezier.arcLength();
    this.segmentLengths.push(len);
    this._totalLength += len;
  }

  get totalLength(): number {
    return this._totalLength;
  }

  /**
   * Get point at normalized position (0-1) along entire path
   */
  getPoint(normalizedT: number): PathPoint {
    if (this.segments.length === 0) {
      return { x: 0, y: 0, angle: 0, t: normalizedT };
    }

    const targetLength = normalizedT * this._totalLength;
    let accumulatedLength = 0;

    for (let i = 0; i < this.segments.length; i++) {
      const segmentLength = this.segmentLengths[i];
      if (accumulatedLength + segmentLength >= targetLength || i === this.segments.length - 1) {
        // This segment contains our target point
        const segmentT = (targetLength - accumulatedLength) / segmentLength;
        return this.segments[i].getPathPoint(Math.max(0, Math.min(1, segmentT)));
      }
      accumulatedLength += segmentLength;
    }

    return this.segments[this.segments.length - 1].getPathPoint(1);
  }

  /**
   * Sample uniform points along entire path
   */
  sampleUniform(count: number): PathPoint[] {
    const points: PathPoint[] = [];
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      points.push(this.getPoint(t));
    }
    return points;
  }
}

/**
 * Create common path shapes
 */
export const PathPresets = {
  /**
   * Sine wave path
   */
  wave(width: number, amplitude: number, cycles: number = 1): BezierPath {
    const path = new BezierPath();
    const segmentWidth = width / (cycles * 2);

    for (let i = 0; i < cycles * 2; i++) {
      const isUp = i % 2 === 0;
      const startX = -width / 2 + i * segmentWidth;
      const endX = startX + segmentWidth;
      const startY = isUp ? 0 : -amplitude;
      const endY = isUp ? -amplitude : 0;

      path.addSegment(
        new CubicBezier(
          { x: startX, y: startY },
          { x: startX + segmentWidth * 0.5, y: startY },
          { x: endX - segmentWidth * 0.5, y: endY },
          { x: endX, y: endY }
        )
      );
    }

    return path;
  },

  /**
   * Circular arc path
   */
  arc(radius: number, startAngle: number, endAngle: number): BezierPath {
    const path = new BezierPath();
    const angleRange = endAngle - startAngle;
    const segments = Math.ceil(Math.abs(angleRange) / (Math.PI / 2));
    const segmentAngle = angleRange / segments;

    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + i * segmentAngle;
      const a2 = a1 + segmentAngle;

      // Approximate arc with bezier using the standard formula
      const k = (4 / 3) * Math.tan(segmentAngle / 4);

      const p0 = { x: Math.cos(a1) * radius, y: Math.sin(a1) * radius };
      const p3 = { x: Math.cos(a2) * radius, y: Math.sin(a2) * radius };
      const p1 = {
        x: p0.x - k * Math.sin(a1) * radius,
        y: p0.y + k * Math.cos(a1) * radius,
      };
      const p2 = {
        x: p3.x + k * Math.sin(a2) * radius,
        y: p3.y - k * Math.cos(a2) * radius,
      };

      path.addSegment(new CubicBezier(p0, p1, p2, p3));
    }

    return path;
  },

  /**
   * Full circle path
   */
  circle(radius: number): BezierPath {
    return PathPresets.arc(radius, 0, Math.PI * 2);
  },

  /**
   * S-curve path
   */
  sCurve(width: number, height: number): BezierPath {
    const path = new BezierPath();

    // First half - curve up
    path.addSegment(
      new CubicBezier(
        { x: -width / 2, y: 0 },
        { x: -width / 4, y: 0 },
        { x: -width / 4, y: -height / 2 },
        { x: 0, y: -height / 2 }
      )
    );

    // Second half - curve down
    path.addSegment(
      new CubicBezier(
        { x: 0, y: -height / 2 },
        { x: width / 4, y: -height / 2 },
        { x: width / 4, y: 0 },
        { x: width / 2, y: 0 }
      )
    );

    return path;
  },

  /**
   * Straight line path
   */
  line(startX: number, startY: number, endX: number, endY: number): BezierPath {
    const path = new BezierPath();
    const dx = (endX - startX) / 3;
    const dy = (endY - startY) / 3;

    path.addSegment(
      new CubicBezier(
        { x: startX, y: startY },
        { x: startX + dx, y: startY + dy },
        { x: endX - dx, y: endY - dy },
        { x: endX, y: endY }
      )
    );

    return path;
  },
};
