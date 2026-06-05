/**
 * Sailing Weather Router - Complete Routing Engine
 * Uses vector mathematics for optimal heading calculation
 */

class RoutingEngine {
  constructor(boatProfile, weatherForecast) {
    this.boat = boatProfile;
    this.forecast = weatherForecast; // Array of hourly forecasts
    this.route = [];
    this.waypoints = [];
  }

  /**
   * Calculate optimal heading using vector mathematics
   */
  calculateOptimalHeading(currentLat, currentLng, destLat, destLng, windSpeed, windDirection) {
    // Create destination vector
    const destVector = Vector2D.fromPoints(currentLat, currentLng, destLat, destLng);
    const destDirection = destVector.bearing();

    let bestHeading = destDirection;
    let bestGoodness = -Infinity;
    let bestSpeed = 0;

    // Try every degree (0-359)
    for (let heading = 0; heading < 360; heading++) {
      // Get boat speed on this heading
      const boatSpeed = this.getBoatSpeed(windSpeed, windDirection, heading);

      if (boatSpeed < 0.5) continue; // Can't sail

      // Vector for boat motion
      const boatVector = Vector2D.fromBearing(heading, boatSpeed);

      // Component toward destination
      const progressVector = boatVector.projectOnto(destVector);
      const progress = progressVector.magnitude();

      // Goodness = progress × speed
      const goodness = progress * (1 + boatSpeed * 0.1);

      if (goodness > bestGoodness) {
        bestGoodness = goodness;
        bestHeading = heading;
        bestSpeed = boatSpeed;
      }
    }

    return Math.round(bestHeading);
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

  /**
   * Simulate one hour of sailing
   */
  simulateHour(lat, lng, heading, speedKnots) {
    const distance = speedKnots / 60;
    const headingRad = heading * Math.PI / 180;
    const latRad = lat * Math.PI / 180;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distance) +
      Math.cos(latRad) * Math.sin(distance) * Math.cos(headingRad)
    );
    const newLat = newLatRad * 180 / Math.PI;

    const newLngRad = latRad + Math.atan2(
      Math.sin(headingRad) * Math.sin(distance) * Math.cos(latRad),
      Math.cos(distance) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    const newLng = (newLngRad * 180 / Math.PI + 540) % 360 - 180;

    return { newLat, newLng };
  }

  /**
   * Calculate distance between two points (nautical miles)
   */
  distance(lat1, lng1, lat2, lng2) {
    const R = 3440.07;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Main route calculation: hour-by-hour simulation
   */
  async calculateRoute(startLat, startLng, endLat, endLng) {
    console.log('\n⛵ Starting hour-by-hour simulation...\n');

    this.route = [];
    this.waypoints = [];

    let currentLat = startLat;
    let currentLng = startLng;
    let hourIndex = 0;
    let totalDistance = 0;

    // Start waypoint
    this.waypoints.push({
      hour: 0,
      day: 0,
      lat: startLat,
      lng: startLng,
      type: 'start',
      label: 'Departure'
    });

    const maxHours = Math.min(this.forecast.length || 168, 168);
    let lastWaypointHour = 0;

    while (hourIndex < maxHours) {
      // Check if reached destination
      const distToEnd = this.distance(currentLat, currentLng, endLat, endLng);
      if (distToEnd < 0.5) break;

      // Get weather for this hour
      const weather = this.forecast[hourIndex] || {
        windSpeed: 10,
        windDirection: 180
      };

      // Calculate optimal heading (VECTOR-BASED!)
      const optimalHeading = this.calculateOptimalHeading(
        currentLat,
        currentLng,
        endLat,
        endLng,
        weather.windSpeed,
        weather.windDirection
      );

      // Get boat speed
      const boatSpeed = this.getBoatSpeed(
        weather.windSpeed,
        weather.windDirection,
        optimalHeading
      );

      // Simulate one hour
      const result = this.simulateHour(
        currentLat,
        currentLng,
        optimalHeading,
        boatSpeed
      );

      currentLat = result.newLat;
      currentLng = result.newLng;
      totalDistance += boatSpeed;
      hourIndex++;

      // Record route point
      this.route.push({
        hour: hourIndex,
        day: Math.floor(hourIndex / 24),
        lat: currentLat,
        lng: currentLng,
        windSpeed: weather.windSpeed,
        windDir: weather.windDirection,
        boatSpeed: boatSpeed,
        heading: optimalHeading,
        distance: totalDistance
      });

      // Create waypoints at milestones
      const hoursSinceLastWaypoint = hourIndex - lastWaypointHour;

      if (hoursSinceLastWaypoint === 12) {
        this.waypoints.push({
          hour: hourIndex,
          day: Math.floor(hourIndex / 24),
          lat: currentLat,
          lng: currentLng,
          type: 'interim',
          label: `12h: ${totalDistance.toFixed(0)}nm`
        });
      } else if (hoursSinceLastWaypoint === 24) {
        this.waypoints.push({
          hour: hourIndex,
          day: Math.floor(hourIndex / 24),
          lat: currentLat,
          lng: currentLng,
          type: 'daily',
          label: `Day ${Math.floor(hourIndex / 24)}: ${totalDistance.toFixed(0)}nm`
        });
        lastWaypointHour = hourIndex;
      }

      // Log daily progress
      if (hourIndex % 24 === 0) {
        console.log(`📍 Day ${Math.floor(hourIndex / 24)}: ${totalDistance.toFixed(1)}nm`);
      }
    }

    // End waypoint
    this.waypoints.push({
      hour: hourIndex,
      day: Math.floor(hourIndex / 24),
      lat: currentLat,
      lng: currentLng,
      type: 'end',
      label: `Arrival (${hourIndex}h)`
    });

    console.log(`\n✅ Route Complete:`);
    console.log(`   Duration: ${hourIndex} hours (${(hourIndex/24).toFixed(1)} days)`);
    console.log(`   Distance: ${totalDistance.toFixed(1)} nm`);
    console.log(`   Avg Speed: ${(totalDistance/hourIndex).toFixed(2)} kt\n`);

    return {
      route: this.route,
      waypoints: this.waypoints,
      stats: {
        hours: hourIndex,
        days: (hourIndex / 24).toFixed(1),
        distance: totalDistance.toFixed(1),
        avgSpeed: (totalDistance / hourIndex).toFixed(2)
      }
    };
  }

  /**
   * Get route segments by confidence level
   */
  getRouteSegments(route) {
    const segments = [];
    let currentSegment = [];
    let currentStyle = null;

    for (const point of route) {
      let style;
      if (point.day < 3) {
        style = 'solid';
      } else if (point.day < 6) {
        style = 'longdash';
      } else {
        style = 'shortdash';
      }

      if (style !== currentStyle && currentSegment.length > 0) {
        segments.push({
          points: currentSegment.map(p => [p.lat, p.lng]),
          style: currentStyle,
          day: currentSegment[0].day
        });
        currentSegment = [point];
        currentStyle = style;
      } else {
        currentSegment.push(point);
      }
    }

    if (currentSegment.length > 0) {
      segments.push({
        points: currentSegment.map(p => [p.lat, p.lng]),
        style: currentStyle,
        day: currentSegment[0].day
      });
    }

    return segments;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoutingEngine;
}
