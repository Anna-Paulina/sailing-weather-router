/**
 * Vector Mathematics Module for Sailing Navigation
 * Professional vector operations for optimal heading calculation
 */

class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Create vector from bearing and magnitude
   * Bearing in degrees (0° = North, 90° = East, 180° = South, 270° = West)
   */
  static fromBearing(bearing, magnitude = 1) {
    const rad = bearing * Math.PI / 180;
    return new Vector2D(
      magnitude * Math.sin(rad),
      magnitude * Math.cos(rad)
    );
  }

  /**
   * Create vector from two points
   */
  static fromPoints(lat1, lng1, lat2, lng2) {
    const dLat = lat2 - lat1;
    const dLng = (lng2 - lng1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
    return new Vector2D(dLng, dLat);
  }

  /**
   * Get magnitude (length) of vector
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get bearing (angle) of vector in degrees
   */
  bearing() {
    let angle = Math.atan2(this.x, this.y) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  }

  /**
   * Normalize to unit vector (magnitude = 1)
   */
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / mag, this.y / mag);
  }

  /**
   * Scale vector by scalar
   */
  scale(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * Add two vectors
   */
  add(other) {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtract two vectors
   */
  subtract(other) {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  /**
   * Dot product (scalar multiplication)
   */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Cross product magnitude (2D)
   */
  cross(other) {
    return this.x * other.y - this.y * other.x;
  }

  /**
   * Angle between two vectors in degrees
   */
  angleTo(other) {
    const mag1 = this.magnitude();
    const mag2 = other.magnitude();
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cosAngle = this.dot(other) / (mag1 * mag2);
    const clipped = Math.max(-1, Math.min(1, cosAngle));
    return Math.acos(clipped) * 180 / Math.PI;
  }

  /**
   * Project this vector onto another
   */
  projectOnto(other) {
    const otherNorm = other.normalize();
    const scalar = this.dot(otherNorm);
    return otherNorm.scale(scalar);
  }

  /**
   * Distance from point to vector line
   */
  distanceToPoint(point) {
    if (this.magnitude() === 0) return point.magnitude();
    const normalized = this.normalize();
    const perp = new Vector2D(-normalized.y, normalized.x);
    return Math.abs(point.dot(perp));
  }

  clone() {
    return new Vector2D(this.x, this.y);
  }

  toString() {
    return `Vector(x=${this.x.toFixed(2)}, y=${this.y.toFixed(2)}, bearing=${this.bearing().toFixed(1)}°, mag=${this.magnitude().toFixed(2)})`;
  }
}

/**
 * Professional Heading Optimizer using Vector Mathematics
 */
class HeadingOptimizer {
  constructor(boatProfile) {
    this.boat = boatProfile;
  }

  /**
   * Calculate optimal heading using vector mathematics
   */
  calculateOptimalHeading(
    currentLat,
    currentLng,
    destLat,
    destLng,
    windSpeed,
    windDirection,
    avoidLand = false,
    forbiddenHeadings = []
  ) {
    // Vector pointing to destination (normalized)
    const destVector = Vector2D.fromPoints(currentLat, currentLng, destLat, destLng);
    const destDirection = destVector.bearing();
    
    console.log(`\n🧮 VECTOR-BASED HEADING OPTIMIZATION`);
    console.log(`   Destination: ${destDirection.toFixed(1)}°`);
    console.log(`   Wind: ${windSpeed.toFixed(1)}kt @ ${windDirection.toFixed(1)}°\n`);

    let bestHeading = destDirection;
    let bestGoodness = -Infinity;
    let bestSpeed = 0;
    const results = [];

    // Try every degree
    for (let heading = 0; heading < 360; heading++) {
      // Skip forbidden headings (land avoidance)
      if (forbiddenHeadings.includes(heading)) continue;

      // Get boat speed on this heading
      const boatSpeed = this.getBoatSpeed(windSpeed, windDirection, heading);

      // If can't sail
      if (boatSpeed < 0.5) continue;

      // Vector for boat velocity on this heading
      const boatVector = Vector2D.fromBearing(heading, boatSpeed);

      // Component of boat motion toward destination
      const progressVector = boatVector.projectOnto(destVector);
      const progress = progressVector.magnitude();

      // Goodness = progress toward destination weighted by speed
      const goodness = progress * (1 + boatSpeed * 0.1);

      results.push({ heading, speed: boatSpeed, progress, goodness });

      if (goodness > bestGoodness) {
        bestGoodness = goodness;
        bestHeading = heading;
        bestSpeed = boatSpeed;
      }
    }

    // Show top 5 options
    const topResults = results
      .sort((a, b) => b.goodness - a.goodness)
      .slice(0, 5);

    console.log(`   Top 5 options:`);
    topResults.forEach((r, i) => {
      console.log(`   ${i+1}. Hdg ${r.heading.toFixed(0)}° → ${r.speed.toFixed(1)}kt, Progress ${r.progress.toFixed(2)}`);
    });

    console.log(`\n   🎯 OPTIMAL: ${bestHeading.toFixed(0)}° @ ${bestSpeed.toFixed(1)}kt\n`);

    return Math.round(bestHeading);
  }

  /**
   * Speed-optimal heading (ignore destination)
   */
  calculateSpeedOptimalHeading(windSpeed, windDirection) {
    let bestHeading = 0;
    let maxSpeed = 0;

    for (let heading = 0; heading < 360; heading++) {
      const speed = this.getBoatSpeed(windSpeed, windDirection, heading);
      if (speed > maxSpeed) {
        maxSpeed = speed;
        bestHeading = heading;
      }
    }

    return bestHeading;
  }

  /**
   * Destination-optimal heading (ignore wind)
   */
  calculateDestinationOptimalHeading(currentLat, currentLng, destLat, destLng) {
    return Vector2D.fromPoints(currentLat, currentLng, destLat, destLng).bearing();
  }

  /**
   * Weighted heading combining destination and speed
   */
  calculateWeightedHeading(
    currentLat,
    currentLng,
    destLat,
    destLng,
    windSpeed,
    windDirection,
    destWeight = 0.6
  ) {
    const speedOptimal = this.calculateSpeedOptimalHeading(windSpeed, windDirection);
    const destOptimal = this.calculateDestinationOptimalHeading(currentLat, currentLng, destLat, destLng);

    // Vector average
    const speedVector = Vector2D.fromBearing(speedOptimal, 1).scale(1 - destWeight);
    const destVector = Vector2D.fromBearing(destOptimal, 1).scale(destWeight);
    
    const resultVector = speedVector.add(destVector);
    return resultVector.bearing();
  }

  /**
   * Get boat speed from polars
   */
  getBoatSpeed(windSpeed, windDirection, boatHeading) {
    let relativeAngle = Math.abs(windDirection - boatHeading);
    if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;

    // Find nearest wind speed
    const windKeys = Object.keys(this.boat.polars).map(Number);
    const nearestWindKey = windKeys.reduce((prev, curr) =>
      Math.abs(curr - windSpeed) < Math.abs(prev - windSpeed) ? curr : prev
    );

    // Find nearest angle
    const angles = Object.keys(this.boat.polars[nearestWindKey]).map(Number);
    const nearestAngle = angles.reduce((prev, curr) =>
      Math.abs(curr - relativeAngle) < Math.abs(prev - relativeAngle) ? curr : prev
    );

    let speed = this.boat.polars[nearestWindKey][nearestAngle] || 0;

    // Safety limits
    if (speed > this.boat.performance.maxHull) speed = this.boat.performance.maxHull;
    if (windSpeed > this.boat.performance.maxWind) speed = 0;

    return speed;
  }
}

/**
 * Wind Vector Analysis
 */
class WindAnalyzer {
  /**
   * Analyze wind vector
   */
  static analyzeWind(windSpeed, windDirection) {
    const windVector = Vector2D.fromBearing(windDirection, windSpeed);
    
    return {
      vector: windVector,
      speed: windSpeed,
      direction: windDirection,
      components: {
        north: windVector.y,
        east: windVector.x
      }
    };
  }

  /**
   * Check if wind is favorable
   */
  static isFavorable(windSpeed, minWind = 2, maxWind = 35) {
    return windSpeed >= minWind && windSpeed <= maxWind;
  }

  /**
   * Get wind quadrant
   */
  static getQuadrant(windDirection) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(windDirection / 22.5) % 16;
    return dirs[index];
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Vector2D, HeadingOptimizer, WindAnalyzer };
}
