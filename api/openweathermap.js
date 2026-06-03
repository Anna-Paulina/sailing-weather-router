/**
 * OpenWeatherMap API Module
 * Popular weather API - Requires free API key
 * Updated every 30 minutes
 * 
 * Coverage: Global
 * Resolution: Variable
 * Forecast length: 5 days
 * Free tier includes: current + 5-day forecast
 */

class OpenWeatherMapApi {
  constructor(config = {}) {
    this.apiKey = config.apiKey || null;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.enabled = config.enabled !== false && !!this.apiKey;
    this.timeout = config.timeout || 10000;

    if (config.enabled && !this.apiKey) {
      console.warn('⚠️ OpenWeatherMap: API key required but not provided');
    }
  }

  /**
   * Get current wind data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Wind data
   */
  async getWind(lat, lng) {
    if (!this.enabled) {
      return { error: 'OpenWeatherMap disabled or no API key', data: null };
    }

    try {
      console.log(`📡 OpenWeatherMap: Fetching for [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);

      const url = `${this.baseUrl}/weather?` +
        `lat=${lat}&lon=${lng}&` +
        `appid=${this.apiKey}&` +
        `units=metric`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.wind) {
        throw new Error('No wind data in response');
      }

      const wind = data.wind;

      return {
        source: 'OpenWeatherMap',
        success: true,
        data: {
          speed: this._toKnots(wind.speed),
          direction: wind.deg || 0,
          gust: wind.gust ? this._toKnots(wind.gust) : null,
          humidity: data.main?.humidity || null,
          pressure: data.main?.pressure || null,
          temp: data.main?.temp || null,
          condition: data.weather?.[0]?.main || null,
          timestamp: new Date(data.dt * 1000).toISOString()
        }
      };
    } catch (error) {
      console.error('❌ OpenWeatherMap error:', error.message);
      return { error: error.message, data: null };
    }
  }

  /**
   * Get wind forecast timeline
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<Array>}
   */
  async getForecast(lat, lng) {
    if (!this.enabled) {
      return { error: 'OpenWeatherMap disabled or no API key', data: [] };
    }

    try {
      console.log(`📡 OpenWeatherMap Forecast: [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);

      const url = `${this.baseUrl}/forecast?` +
        `lat=${lat}&lon=${lng}&` +
        `appid=${this.apiKey}&` +
        `units=metric`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const list = data.list || [];

      const forecast = list.map(item => ({
        time: new Date(item.dt * 1000),
        windSpeed: this._toKnots(item.wind.speed),
        windDirection: item.wind.deg || 0,
        windGust: item.wind.gust ? this._toKnots(item.wind.gust) : null,
        temperature: item.main.temp,
        humidity: item.main.humidity,
        condition: item.weather?.[0]?.main || null,
        cloudiness: item.clouds.all || null,
        rainProbability: item.pop || 0
      }));

      return {
        source: 'OpenWeatherMap',
        success: true,
        data: forecast
      };
    } catch (error) {
      console.error('❌ OpenWeatherMap Forecast error:', error);
      return { error: error.message, data: [] };
    }
  }

  /**
   * Convert m/s to knots (OpenWeatherMap uses m/s)
   * @private
   */
  _toKnots(ms) {
    if (!ms && ms !== 0) return 0;
    return Math.round(ms * 1.94384); // m/s to knots
  }

  /**
   * Validate/set API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.enabled = !!apiKey;
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenWeatherMapApi;
}
