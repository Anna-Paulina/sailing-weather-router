/**
 * Sailing Weather Router - Professional Isochrone Method
 * Uses spherical Earth calculations for accurate routing
 */

class RoutingEngine {
  constructor(boatProfile, weatherForecast) {
    this.boat = boatProfile;
    this.forecast = weatherForecast;
    this.route = [];
    this.waypoints = [];
    this.isochrones = []; // For visualization
    this.EARTH_RADIUS = 3440.07; // Nautical miles
  }

  /**
   * Haversine distance - accurate on spherical Earth
   */
  haversineDistance(lat1, lng1, lat2, lng2) {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLng = (lng2 - lng1) * toRad;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS * c;
  }

  /**
   * Great circle bearing - shortest path on sphere
   */
  greatCircleBearing(lat1, lng1, lat2, lng2) {
    const toRad = Math.PI / 180;
    const lat1Rad = lat1 * toRad;
    const lat2Rad = lat2 * toRad;
    const dLng = (lng2 - lng1) * toRad;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  /**
   * Project point along bearing and distance (spherical)
   */
  projectPoint(lat, lng, bearing, distNM) {
    const toRad = Math.PI / 180;
    const toDeg = 180 / Math.PI;

    const latRad = lat * toRad;
    const lngRad = lng * toRad;
    const bearingRad = bearing * toRad;
    const angularDist = distNM / this.EARTH_RADIUS;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(angularDist) +
      Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearingRad)
    );

    const newLngRad = lngRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(latRad),
      Math.cos(angularDist) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    return {
      lat: newLatRad * toDeg,
      lng: ((newLngRad * toDeg + 540) % 360) - 180
    };
  }

  /**
   * Get boat speed from polars
   */
  getBoatSpeed(windSpeed, windDirection, boatHeading) {
    let relativeAngle = Math.abs(windDirection - boatHeading);
    if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;

    const windKeys = Object.keys(this.boat.polars).map(Number);
    const nearestWindKey = windKeys.reduce((prev, curr) =>
      Math.abs(curr - windSpeed) < Math.abs(prev - windSpeed) ? curr : prev
    );

    const angles = Object.keys(this.boat.polars[nearestWindKey]).map(Number);
    const nearestAngle = angles.reduce((prev, curr) =>
      Math.abs(curr - relativeAngle) < Math.abs(prev - relativeAngle) ? curr : prev
    );

    let speed = this.boat.polars[nearestWindKey][nearestAngle] || 0;

    if (speed > this.boat.performance.maxHull) speed = this.boat.performance.maxHull;
    if (windSpeed > this.boat.performance.maxWind) speed = 0;

    return speed;
  }

  /**
   * ISOCHRONE METHOD - Professional routing
   * Finds optimal route by creating time-based reachability zones
   */
  async calculateRoute(startLat, startLng, endLat, endLng) {
    console.log('\n' + '='.repeat(70));
    console.log('🌊 ISOCHRONE METHOD - Professional Routing');
    console.log('Using spherical Earth calculations');
    console.log('='.repeat(70) + '\n');

    this.route = [];
    this.waypoints = [];
    this.isochrones = [];

    // Current isochrone (reachable points)
    let currentIsochrone = [{
      lat: startLat,
      lng: startLng,
      distance: 0,
      time: 0,
      parent: null
    }];

    this.waypoints.push({
      hour: 0,
      day: 0,
      lat: startLat,
      lng: startLng,
      type: 'start',
      label: 'Departure'
    });

    let hourIndex = 0;
    const maxHours = Math.min(this.forecast.length || 168, 168);
    let foundDestination = false;

    console.log('⏱️ Building isochrones hour by hour...\n');

    // Build isochrones hour by hour
    while (hourIndex < maxHours && !foundDestination) {
      const weather = this.forecast[hourIndex] || {
        windSpeed: 10,
        windDirection: 180
      };

      const nextIsochrone = [];

      // For each point in current isochrone
      for (const point of currentIsochrone) {
        // Try different headings (every 10 degrees)
        for (let heading = 0; heading < 360; heading += 10) {
          const boatSpeed = this.getBoatSpeed(
            weather.windSpeed,
            weather.windDirection,
            heading
          );

          if (boatSpeed < 0.5) continue;

          // Project one hour ahead
          const nextPoint = this.projectPoint(
            point.lat,
            point.lng,
            heading,
            boatSpeed
          );

          // Calculate distance to destination
          const distToDest = this.haversineDistance(
            nextPoint.lat,
            nextPoint.lng,
            endLat,
            endLng
          );

          // Check if reached destination
          if (distToDest < 0.5) {
            console.log(`✅ Reached destination in ${hourIndex + 1} hours!\n`);
            foundDestination = true;
            
            // Reconstruct path
            this.reconstructPath(point, nextPoint, endLat, endLng, hourIndex + 1);
            break;
          }

          nextIsochrone.push({
            lat: nextPoint.lat,
            lng: nextPoint.lng,
            distance: point.distance + boatSpeed,
            time: hourIndex + 1,
            heading: heading,
            windSpeed: weather.windSpeed,
            windDir: weather.windDirection,
            boatSpeed: boatSpeed,
            parent: point
          });
        }

        if (foundDestination) break;
      }

      // Remove duplicate/interior points (keep only frontier)
      currentIsochrone = this.pruneDuplicates(nextIsochrone);
      
      hourIndex++;

      if (hourIndex % 24 === 0 && !foundDestination) {
        console.log(`📍 Day ${Math.floor(hourIndex / 24)}: ${currentIsochrone.length} reachable points`);
      }

      // Safety: limit isochrone size for performance
      if (currentIsochrone.length > 100) {
        currentIsochrone = currentIsochrone.slice(0, 100);
      }
    }

    // Add end waypoint
    if (foundDestination) {
      this.waypoints.push({
        hour: hourIndex,
        day: Math.floor(hourIndex / 24),
        lat: endLat,
        lng: endLng,
        type: 'end',
        label: `Arrival (${hourIndex}h)`
      });
    }

    const totalDistance = this.route.length > 0 
      ? this.route[this.route.length - 1].distance 
      : 0;

    console.log('='.repeat(70));
    console.log('✅ ROUTE COMPLETE');
    console.log('='.repeat(70));
    console.log(`Duration:    ${hourIndex} hours (${(hourIndex/24).toFixed(1)} days)`);
    console.log(`Distance:    ${totalDistance.toFixed(1)} nm`);
    console.log(`Avg Speed:   ${(totalDistance/hourIndex).toFixed(2)} kt`);
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
   * Reconstruct path from destination back to start
   */
  reconstructPath(startPoint, endPoint, finalLat, finalLng, totalHours) {
    let current = startPoint;
    
    while (current !== null) {
      this.route.unshift({
        hour: current.time,
        day: Math.floor(current.time / 24),
        lat: current.lat,
        lng: current.lng,
        windSpeed: current.windSpeed || 0,
        windDir: current.windDir || 0,
        boatSpeed: current.boatSpeed || 0,
        heading: current.heading || 0,
        distance: current.distance
      });

      current = current.parent;
    }

    // Add final point
    this.route.push({
      hour: totalHours,
      day: Math.floor(totalHours / 24),
      lat: finalLat,
      lng: finalLng,
      windSpeed: 0,
      windDir: 0,
      boatSpeed: 0,
      heading: 0,
      distance: endPoint.distance
    });
  }

  /**
   * Remove duplicate/interior points from isochrone
   * Keep only frontier points that might lead to optimal route
   */
  pruneDuplicates(points) {
    if (points.length <= 50) return points;

    // Sort by distance to keep best candidates
    return points
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 50);
  }

  /**
   * Get route segments by confidence
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
          day: currentSegment[0].day,
          data: currentSegment
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
        day: currentSegment[0].day,
        data: currentSegment
      });
    }

    return segments;
  }

  /**
   * Get wind vectors for map display
   */
  getWindVectors(route, interval = 12) {
    const winds = [];
    
    for (let i = 0; i < route.length; i += interval) {
      const point = route[i];
      if (point.windSpeed > 0) {
        winds.push({
          lat: point.lat,
          lng: point.lng,
          speed: point.windSpeed,
          direction: point.windDir,
          hour: point.hour
        });
      }
    }

    return winds;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoutingEngine;
}
