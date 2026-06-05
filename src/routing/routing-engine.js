/**
 * Sailing Weather Router v3 - Vector-Based Routing Engine
 * Uses professional vector mathematics for optimal heading calculation
 */

class RoutingEngineV3 {
  constructor(boatProfile, weatherForecast) {
    this.boat = boatProfile;
    this.forecast = weatherForecast;
    this.headingOptimizer = new HeadingOptimizer(boatProfile);
    this.windAnalyzer = WindAnalyzer;
    this.route = [];
    this.waypoints = [];
  }

  /**
   * Main routing: hour-by-hour simulation with vector optimization
   */
  async calculateRoute(startLat, startLng, endLat, endLng) {
    console.log('\n' + '='.repeat(70));
    console.log('🌊 VECTOR-BASED ROUTE CALCULATION v3');
    console.log('='.repeat(70) + '\n');

    console.log(`📍 Start: [${startLat.toFixed(2)}, ${startLng.toFixed(2)}]`);
    console.log(`📍 End:   [${endLat.toFixed(2)}, ${endLng.toFixed(2)}]\n`);

    this.route = [];
    this.waypoints = [];

    let currentLat = startLat;
    let currentLng = startLng;
    let hourIndex = 0;
    let totalDistance = 0;

    // Add start waypoint
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

    console.log('⏱️  Starting hourly simulation...\n');

    while (hourIndex < maxHours) {
      // Check if reached destination
      const distToEnd = this.distance(currentLat, currentLng, endLat, endLng);
      if (distToEnd < 0.5) break;

      // Get weather
      const weather = this.forecast[hourIndex] || {
        windSpeed: 10,
        windDirection: 180
      };

      // VECTOR-BASED HEADING CALCULATION
      const optimalHeading = this.headingOptimizer.calculateOptimalHeading(
        currentLat,
        currentLng,
        endLat,
        endLng,
        weather.windSpeed,
        weather.windDirection
      );

      const boatSpeed = this.headingOptimizer.getBoatSpeed(
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
        const day = Math.floor(hourIndex / 24);
        console.log(`📍 Day ${day}: ${totalDistance.toFixed(1)}nm in ${hourIndex}h`);
      }
    }

    // Add end waypoint
    this.waypoints.push({
      hour: hourIndex,
      day: Math.floor(hourIndex / 24),
      lat: currentLat,
      lng: currentLng,
      type: 'end',
      label: `Arrival (${hourIndex}h)`
    });

    console.log(`\n` + '='.repeat(70));
    console.log('✅ ROUTE CALCULATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`Duration:    ${hourIndex} hours (${(hourIndex/24).toFixed(1)} days)`);
    console.log(`Distance:    ${totalDistance.toFixed(1)} nm`);
    console.log(`Avg Speed:   ${(totalDistance/hourIndex).toFixed(2)} kt`);
    console.log(`Waypoints:   ${this.waypoints.length}`);
    console.log('='.repeat(70) + '\n');

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
   * Calculate distance between two points
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
   * Get route segments by confidence
   */
  getRouteSegments(route) {
    const segments = [];
    let currentSegment = [];
    let currentStyle = null;

    for (const point of route) {
      let style = 'solid';
      if (point.day >= 3 && point.day < 6) style = 'longdash';
      if (point.day >= 6) style = 'shortdash';

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
  module.exports = RoutingEngineV3;
}
