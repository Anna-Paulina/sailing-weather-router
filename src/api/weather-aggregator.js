/**
 * Weather Aggregator Module
 * Combines multiple weather sources and provides consensus data
 * 
 * Features:
 * - Query all 4 sources in parallel
 * - Calculate averaged wind values
 * - Track source reliability
 * - Display individual sources + average
 */

class WeatherAggregator {
  constructor(config = {}) {
    this.sources = {
      noaa: null,
      openMeteo: null,
      openWeatherMap: null
    };
    this.config = config;
    this.lastResults = null;
  }

  /**
   * Initialize all weather sources
   */
  initializeSources(noaaApi, openMeteoApi, openWeatherMapApi) {
    this.sources.noaa = noaaApi;
    this.sources.openMeteo = openMeteoApi;
    this.sources.openWeatherMap = openWeatherMapApi;
  }

  /**
   * Get wind data from all sources and calculate average
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Results from all sources + average
   */
  async getConsensusWind(lat, lng) {
    console.log(`\n🌍 Weather Aggregator: Fetching consensus for [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);
    console.log('📡 Querying: NOAA, Open-Meteo, OpenWeatherMap\n');

    // Fetch all sources in parallel
    const [noaaResult, meteoResult, owmResult] = await Promise.all([
      this._safeCall(this.sources.noaa, 'getWind', lat, lng),
      this._safeCall(this.sources.openMeteo, 'getWind', lat, lng),
      this._safeCall(this.sources.openWeatherMap, 'getWind', lat, lng)
    ]);

    // Aggregate results
    const results = {
      timestamp: new Date().toISOString(),
      location: { lat, lng },
      sources: {
        noaa: noaaResult,
        openMeteo: meteoResult,
        openWeatherMap: owmResult
      },
      average: null,
      consensus: null
    };

    // Calculate average from successful sources
    const successful = [
      noaaResult.success && noaaResult.data,
      meteoResult.success && meteoResult.data,
      owmResult.success && owmResult.data
    ].filter(Boolean);

    if (successful.length > 0) {
      results.average = this._calculateAverage(successful);
      results.consensus = this._calculateConsensus(successful);
    } else {
      console.error('❌ No successful weather sources!');
    }

    this.lastResults = results;
    return results;
  }

  /**
   * Get forecast from all sources
   * @param {number} lat
   * @param {number} lng
   * @param {number} days
   * @returns {Promise<Object>}
   */
  async getConsensusForecast(lat, lng, days = 7) {
    console.log(`\n🌍 Forecast Aggregator: ${days} days for [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);

    const [noaaForecast, meteoForecast, owmForecast] = await Promise.all([
      this._safeCall(this.sources.noaa, 'getForecast', lat, lng),
      this._safeCall(this.sources.openMeteo, 'getForecast', lat, lng, days),
      this._safeCall(this.sources.openWeatherMap, 'getForecast', lat, lng)
    ]);

    return {
      timestamp: new Date().toISOString(),
      location: { lat, lng },
      sources: {
        noaa: noaaForecast,
        openMeteo: meteoForecast,
        openWeatherMap: owmForecast
      },
      consensus: this._createForecastConsensus(noaaForecast, meteoForecast, owmForecast)
    };
  }

  /**
   * Calculate average wind from multiple sources
   * @private
   */
  _calculateAverage(dataSets) {
    const validSpeeds = dataSets
      .map(d => d.speed)
      .filter(s => typeof s === 'number' && !isNaN(s));

    const validDirections = dataSets
      .map(d => d.direction)
      .filter(d => typeof d === 'number' && !isNaN(d));

    // For wind direction, use vector average (not simple average!)
    const avgSpeed = validSpeeds.length > 0
      ? Math.round(validSpeeds.reduce((a, b) => a + b) / validSpeeds.length * 10) / 10
      : null;

    const avgDirection = validDirections.length > 0
      ? this._averageWindDirection(validDirections)
      : null;

    const avgGust = dataSets
      .filter(d => d.gust)
      .map(d => d.gust)
      .reduce((a, b) => a + b, 0) / Math.max(1, dataSets.filter(d => d.gust).length);

    return {
      speed: avgSpeed,
      direction: avgDirection,
      gust: avgGust > 0 ? Math.round(avgGust * 10) / 10 : null,
      sourceCount: dataSets.length
    };
  }

  /**
   * Calculate wind direction as vector average
   * This is more accurate than simple averaging for circular values
   * @private
   */
  _averageWindDirection(directions) {
    let sinSum = 0;
    let cosSum = 0;

    directions.forEach(dir => {
      const rad = (dir * Math.PI) / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    });

    const avgRad = Math.atan2(sinSum / directions.length, cosSum / directions.length);
    let avgDeg = (avgRad * 180) / Math.PI;

    if (avgDeg < 0) avgDeg += 360;

    return Math.round(avgDeg);
  }

  /**
   * Consensus interpretation
   * @private
   */
  _calculateConsensus(dataSets) {
    const avg = this._calculateAverage(dataSets);
    const sources = dataSets.length;

    // Confidence based on agreement between sources
    let directionVariance = 0;
    if (sources > 1) {
      const avgDir = avg.direction;
      directionVariance = Math.max(
        ...dataSets.map(d => Math.abs(d.direction - avgDir))
      );
    }

    let confidence = 'HIGH';
    if (directionVariance > 45) {
      confidence = 'MEDIUM';
    }
    if (directionVariance > 90) {
      confidence = 'LOW';
    }

    return {
      windSpeed: avg.speed,
      windDirection: avg.direction,
      windGust: avg.gust,
      sourcesAgreed: sources,
      confidence: confidence,
      reliabilityPercent: Math.round((1 - Math.min(directionVariance / 180, 1)) * 100)
    };
  }

  /**
   * Create consensus forecast by interpolating between sources
   * @private
   */
  _createForecastConsensus(noaaData, meteoData, owmData) {
    // Get the shortest common timeline
    const allForecasts = [
      noaaData.success ? noaaData.data : [],
      meteoData.success ? meteoData.data : [],
      owmData.success ? owmData.data : []
    ].filter(f => f.length > 0);

    if (allForecasts.length === 0) {
      return [];
    }

    // Take the first source's timeline as base (usually most reliable)
    const baseTimeline = allForecasts[0];
    const consensus = [];

    for (const basePoint of baseTimeline) {
      const time = basePoint.time;
      const matchingPoints = allForecasts
        .map(f => f.find(p => this._timeMatch(p.time, time)))
        .filter(Boolean);

      if (matchingPoints.length > 0) {
        const avgData = this._calculateAverage(matchingPoints);
        consensus.push({
          time: time,
          windSpeed: avgData.speed,
          windDirection: avgData.direction,
          windGust: avgData.gust,
          sourceCount: matchingPoints.length
        });
      }
    }

    return consensus;
  }

  /**
   * Safe wrapper for API calls with error handling
   * @private
   */
  async _safeCall(apiInstance, method, ...args) {
    if (!apiInstance || !apiInstance[method]) {
      return { success: false, error: 'API not available', data: null };
    }

    try {
      return await apiInstance[method](...args);
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * Match times within 1 hour tolerance
   * @private
   */
  _timeMatch(time1, time2) {
    if (typeof time1 === 'string') time1 = new Date(time1);
    if (typeof time2 === 'string') time2 = new Date(time2);

    const diff = Math.abs(time1.getTime() - time2.getTime());
    return diff < 3600000; // 1 hour in ms
  }

  /**
   * Format results for display
   */
  formatResults(results) {
    return {
      NOAA: results.sources.noaa.success
        ? `${results.sources.noaa.data.speed}kt @ ${results.sources.noaa.data.direction}°`
        : `❌ ${results.sources.noaa.error}`,

      'Open-Meteo': results.sources.openMeteo.success
        ? `${results.sources.openMeteo.data.speed}kt @ ${results.sources.openMeteo.data.direction}°`
        : `❌ ${results.sources.openMeteo.error}`,

      'OpenWeatherMap': results.sources.openWeatherMap.success
        ? `${results.sources.openWeatherMap.data.speed}kt @ ${results.sources.openWeatherMap.data.direction}°`
        : `❌ ${results.sources.openWeatherMap.error}`,

      '📊 AVERAGE': results.average
        ? `${results.average.speed}kt @ ${results.average.direction}° (${results.average.sourceCount} sources)`
        : 'No data',

      '✅ CONSENSUS': results.consensus
        ? `${results.consensus.windSpeed}kt @ ${results.consensus.windDirection}° [${results.consensus.confidence} - ${results.consensus.reliabilityPercent}%]`
        : 'No consensus'
    };
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherAggregator;
}
