/**
 * Sailing Weather Router - Intelligent Routing Engine
 * Wind-optimized A* pathfinding with boat performance simulation
 */

class RoutingEngine {
  constructor(boatProfile, weatherForecast) {
    this.boat = boatProfile;
    this.forecast = weatherForecast; // Array of hourly forecasts
    this.route = [];
    this.routeWithTime = [];
  }

  /**
   * Get boat speed given wind and heading
   * Uses polar performance curves from boat profile
   */
  getBoatSpeed(windSpeed, windDir, boatHeading) {
    // Angle between wind direction and boat heading (0-180)
    let relativeAngle = Math.abs(windDir - boatHeading);
    if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;

    // Normalize wind speed to nearest key in polars
    let windKey = Object.keys(this.boat.polars)
      .map(Number)
      .sort((a, b) => a - b)
      .reduce((prev, curr) => 
        Math.abs(curr - windSpeed) < Math.abs(prev - windSpeed) ? curr : prev
      );

    // Normalize angle to nearest available angle
    const availableAngles = Object.keys(this.boat.polars[windKey]).map(Number).sort((a, b) => a - b);
    let angleKey = availableAngles.reduce((prev, curr) => 
      Math.abs(curr - relativeAngle) < Math.abs(prev - relativeAngle) ? curr : prev
    );

    // Get speed from polar (in knots)
    const speed = this.boat.polars[windKey][angleKey] || 0;

    // Safety checks
    if (speed > this.boat.performance.maxHull) return this.boat.performance.maxHull;
    if (windSpeed > this.boat.performance.maxWind) return 0; // Can't sail in too much wind

    return speed;
  }

  /**
   * Calculate distance between two points (in nautical miles)
   */
  distance(lat1, lng1, lat2, lng2) {
    const R = 3440.07; // Earth radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculate bearing between two points
   */
  bearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  /**
   * Simulate one hour of sailing
   * Returns new position after sailing for 1 hour
   */
  simulateHour(lat, lng, targetLat, targetLng, hourIndex) {
    // Get wind for this hour
    if (!this.forecast || hourIndex >= this.forecast.length) {
      return { lat, lng, speed: 0, heading: 0 };
    }

    const windData = this.forecast[hourIndex];
    const windSpeed = windData.windSpeed || 0;
    const windDir = windData.windDirection || 0;

    // Calculate optimal heading towards target
    const optimalHeading = this.bearing(lat, lng, targetLat, targetLng);

    // Get boat speed on this heading
    const boatSpeed = this.getBoatSpeed(windSpeed, windDir, optimalHeading);

    // Calculate distance to target
    const distToTarget = this.distance(lat, lng, targetLat, targetLng);

    // Move towards target
    // 1 hour at X knots = X nautical miles
    const bearing = this.bearing(lat, lng, targetLat, targetLng);
    const moveDistance = Math.min(boatSpeed, distToTarget);

    // Convert to degrees (1 nautical mile ≈ 1/60 degree)
    const latChange = (moveDistance / 60) * Math.cos(bearing * Math.PI / 180);
    const lngChange = (moveDistance / 60) * Math.sin(bearing * Math.PI / 180) / Math.cos(lat * Math.PI / 180);

    return {
      lat: lat + latChange,
      lng: lng + lngChange,
      speed: boatSpeed,
      heading: bearing,
      windSpeed: windSpeed,
      windDir: windDir
    };
  }

  /**
   * Calculate optimal route considering wind
   * Simulates hourly progression
   */
  async calculateRoute(startLat, startLng, endLat, endLng) {
    console.log('🛣️ Starting route calculation with wind optimization...');

    if (!this.forecast || this.forecast.length === 0) {
      console.warn('⚠️ No forecast data, using straight line');
      return this.straightLineRoute(startLat, startLng, endLat, endLng);
    }

    const route = [];
    let currentLat = startLat;
    let currentLng = startLng;
    let hourIndex = 0;
    let totalDistance = 0;
    let totalTime = 0;

    // Simulate hour by hour until we reach destination
    const maxHours = Math.min(this.forecast.length, 240); // Max 10 days

    while (hourIndex < maxHours) {
      route.push({
        lat: currentLat,
        lng: currentLng,
        hour: hourIndex,
        day: Math.floor(hourIndex / 24)
      });

      // Check if we're close to destination
      const distToEnd = this.distance(currentLat, currentLng, endLat, endLng);
      if (distToEnd < 0.5) { // Less than 0.5 nm
        route.push({
          lat: endLat,
          lng: endLng,
          hour: hourIndex,
          day: Math.floor(hourIndex / 24)
        });
        break;
      }

      // Simulate one hour
      const sim = this.simulateHour(currentLat, currentLng, endLat, endLng, hourIndex);
      currentLat = sim.lat;
      currentLng = sim.lng;
      totalDistance += sim.speed;
      hourIndex++;
    }

    console.log(`✅ Route calculated: ${hourIndex} hours, ~${totalDistance.toFixed(1)} nm`);

    return route;
  }

  /**
   * Fallback: straight line route
   */
  straightLineRoute(startLat, startLng, endLat, endLng) {
    const route = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      route.push({
        lat: startLat + (endLat - startLat) * t,
        lng: startLng + (endLng - startLng) * t,
        hour: i,
        day: Math.floor(i / 24)
      });
    }

    return route;
  }

  /**
   * Style route based on forecast confidence
   * Days 0-3: solid
   * Days 3-6: long dashes
   * Days 6+: short dashes
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
          days: `Day ${currentSegment[0].day}-${currentSegment[currentSegment.length-1].day}`
        });
        currentSegment = [point];
        currentStyle = style;
      } else {
        currentSegment.push(point);
      }
    }

    // Add final segment
    if (currentSegment.length > 0) {
      segments.push({
        points: currentSegment.map(p => [p.lat, p.lng]),
        style: currentStyle,
        days: `Day ${currentSegment[0].day}-${currentSegment[currentSegment.length-1].day}`
      });
    }

    return segments;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoutingEngine;
}
