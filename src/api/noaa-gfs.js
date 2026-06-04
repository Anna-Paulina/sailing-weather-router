/**
 * NOAA GFS Weather API Module
 * Global Forecast System - Free, high quality global weather forecasts
 * Updated every 6 hours
 * 
 * No API key required
 * Coverage: Global
 * Resolution: 0.25° (≈28km)
 * Forecast length: 10 days
 */

class NOAAGFSApi {
  constructor(config = {}) {
    this.baseUrl = 'https://api.weather.gov';
    this.gridDataUrl = 'https://api.weather.gov/gridpoints';
    this.pointsUrl = 'https://api.weather.gov/points';
    this.enabled = config.enabled !== false;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Get grid point data for a location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Wind data: { speed, direction, gust, time }
   */
  async getWind(lat, lng) {
    if (!this.enabled) {
      return { error: 'NOAA GFS disabled', data: null };
    }

    try {
      console.log(`📡 NOAA GFS: Fetching for [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);

      // Note: NOAA Grid API only works for USA
      // For international: use alternate endpoint or fallback
      if (this.isUSA(lat, lng)) {
        return await this._getUSAWind(lat, lng);
      } else {
        console.warn('⚠️ NOAA: Outside USA coverage, using fallback');
        return { error: 'NOAA coverage limited to USA', data: null };
      }
    } catch (error) {
      console.error('❌ NOAA GFS error:', error.message);
      return { error: error.message, data: null };
    }
  }

  /**
   * Get wind data for USA locations
   * @private
   */
  async _getUSAWind(lat, lng) {
    try {
      // Step 1: Get grid point metadata
      const pointsResponse = await fetch(
        `${this.pointsUrl}/${lat},${lng}`,
        { signal: AbortSignal.timeout(this.timeout) }
      );

      if (!pointsResponse.ok) {
        throw new Error(`NOAA Points API: ${pointsResponse.status}`);
      }

      const pointsData = await pointsResponse.json();
      const gridUrl = pointsData.properties.forecast;

      // Step 2: Get forecast data from grid
      const forecastResponse = await fetch(gridUrl, {
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!forecastResponse.ok) {
        throw new Error(`NOAA Forecast API: ${forecastResponse.status}`);
      }

      const forecastData = await forecastResponse.json();
      const periods = forecastData.properties.periods || [];

      // Step 3: Parse wind data from first period
      if (periods.length === 0) {
        throw new Error('No forecast periods available');
      }

      const current = periods[0];
      const windText = current.windSpeed || '0 mph';
      const windDir = current.windDirection || 'N';

      const windSpeed = this._parseWindSpeed(windText); // Convert to knots
      const windDeg = this._directionToDegrees(windDir);

      return {
        source: 'NOAA GFS',
        success: true,
        data: {
          speed: windSpeed,           // knots
          direction: windDeg,         // degrees (0-359)
          gust: current.windGust || null,
          shortForecast: current.shortForecast,
          detailedForecast: current.detailedForecast,
          temperature: current.temperature,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse wind speed from NOAA format (e.g., "10 to 15 mph")
   * Convert to knots
   * @private
   */
  _parseWindSpeed(windText) {
    if (!windText) return 0;

    // Extract first number
    const match = windText.match(/\d+/);
    if (!match) return 0;

    const speedMph = parseInt(match[0]);
    return Math.round(speedMph * 0.868976); // Convert mph to knots
  }

  /**
   * Convert wind direction letters to degrees
   * @private
   */
  _directionToDegrees(dir) {
    const directions = {
      'N': 0,
      'NNE': 22.5,
      'NE': 45,
      'ENE': 67.5,
      'E': 90,
      'ESE': 112.5,
      'SE': 135,
      'SSE': 157.5,
      'S': 180,
      'SSW': 202.5,
      'SW': 225,
      'WSW': 247.5,
      'W': 270,
      'WNW': 292.5,
      'NW': 315,
      'NNW': 337.5
    };

    return directions[dir.toUpperCase()] || 0;
  }

  /**
   * Check if location is in USA
   * @private
   */
  isUSA(lat, lng) {
    // Rough USA bounds
    return lat >= 24 && lat <= 49 && lng >= -125 && lng <= -65;
  }

  /**
   * Get forecast timeline
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Array>} Array of {time, windSpeed, windDir, temp, ...}
   */
  async getForecast(lat, lng) {
    if (!this.isUSA(lat, lng)) {
      return { error: 'NOAA coverage USA only', data: [] };
    }

    try {
      const pointsResponse = await fetch(`${this.pointsUrl}/${lat},${lng}`);
      const pointsData = await pointsResponse.json();
      const gridUrl = pointsData.properties.forecast;

      const forecastResponse = await fetch(gridUrl);
      const forecastData = await forecastResponse.json();

      return {
        source: 'NOAA GFS',
        success: true,
        data: forecastData.properties.periods.map(period => ({
          time: period.startTime,
          windSpeed: this._parseWindSpeed(period.windSpeed),
          windDirection: this._directionToDegrees(period.windDirection),
          temperature: period.temperature,
          short: period.shortForecast,
          isDaytime: period.isDaytime
        }))
      };
    } catch (error) {
      console.error('❌ NOAA Forecast error:', error);
      return { error: error.message, data: [] };
    }
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NOAAGFSApi;
}
