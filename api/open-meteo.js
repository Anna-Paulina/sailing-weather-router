/**
 * Open-Meteo Weather API Module
 * European alternative - Free, high quality, global coverage
 * No API key required!
 * Updated every 1 hour
 * 
 * Coverage: Global
 * Resolution: 0.1° (≈11km)
 * Forecast length: 10 days
 */

class OpenMeteoApi {
  constructor(config = {}) {
    this.baseUrl = 'https://api.open-meteo.com/v1';
    this.enabled = config.enabled !== false;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Get current wind data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Wind data: { speed, direction, gust, time }
   */
  async getWind(lat, lng) {
    if (!this.enabled) {
      return { error: 'Open-Meteo disabled', data: null };
    }

    try {
      console.log(`📡 Open-Meteo: Fetching for [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);

      const url = `${this.baseUrl}/forecast?` +
        `latitude=${lat}&longitude=${lng}&` +
        `current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&` +
        `timezone=auto`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;

      return {
        source: 'Open-Meteo',
        success: true,
        data: {
          speed: this._convertWindSpeed(current.wind_speed_10m, data.current_units?.wind_speed),
          direction: current.wind_direction_10m || 0,
          gust: current.wind_gusts_10m ? this._convertWindSpeed(current.wind_gusts_10m, data.current_units?.wind_speed) : null,
          timestamp: current.time,
          timezone: data.timezone
        }
      };
    } catch (error) {
      console.error('❌ Open-Meteo error:', error.message);
      return { error: error.message, data: null };
    }
  }

  /**
   * Get wind forecast timeline
   * @param {number} lat
   * @param {number} lng
   * @param {number} days - Number of days to forecast (1-16)
   * @returns {Promise<Array>}
   */
  async getForecast(lat, lng, days = 7) {
    if (!this.enabled) {
      return { error: 'Open-Meteo disabled', data: [] };
    }

    try {
      console.log(`📡 Open-Meteo Forecast: ${days} days for [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);

      const url = `${this.baseUrl}/forecast?` +
        `latitude=${lat}&longitude=${lng}&` +
        `hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&` +
        `forecast_days=${Math.min(days, 16)}&` +
        `timezone=auto`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const hourly = data.hourly;

      // Create hourly forecast array
      const forecast = [];
      for (let i = 0; i < hourly.time.length; i++) {
        forecast.push({
          time: new Date(hourly.time[i]),
          windSpeed: this._convertWindSpeed(hourly.wind_speed_10m[i], data.hourly_units?.wind_speed_10m),
          windDirection: hourly.wind_direction_10m[i] || 0,
          windGust: hourly.wind_gusts_10m[i] ? this._convertWindSpeed(hourly.wind_gusts_10m[i], data.hourly_units?.wind_gusts_10m) : null
        });
      }

      return {
        source: 'Open-Meteo',
        success: true,
        data: forecast
      };
    } catch (error) {
      console.error('❌ Open-Meteo Forecast error:', error);
      return { error: error.message, data: [] };
    }
  }

  /**
   * Convert wind speed to knots
   * @private
   */
  _convertWindSpeed(speed, unit = 'kmh') {
    if (!speed && speed !== 0) return 0;

    switch(unit?.toLowerCase()) {
      case 'kmh':
      case 'km/h':
        return Math.round(speed * 0.539957); // km/h to knots
      case 'mph':
        return Math.round(speed * 0.868976); // mph to knots
      case 'ms':
      case 'm/s':
        return Math.round(speed * 1.94384);  // m/s to knots
      case 'kn':
      case 'knots':
      default:
        return Math.round(speed);
    }
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenMeteoApi;
}
