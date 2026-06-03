/**
 * Frontend Configuration
 * Load environment variables and initialize API instances
 */

const CONFIG = {
  // API Configuration
  NOAA_ENABLED: true,
  OPENMETEO_ENABLED: true,
  OPENWEATHERMAP_KEY: '6c4752e5ab4f1ab790ec5387d4c0bc87',
  OPENWEATHERMAP_ENABLED: true,

  // Map Configuration
  DEFAULT_LAT: 45.5017,
  DEFAULT_LNG: -73.5673,
  DEFAULT_ZOOM: 4,
  MAP_STYLE: 'light',

  // Routing Configuration
  MAX_FORECAST_DAYS: 7,
  ROUTE_UPDATE_INTERVAL: 60,
  PATHFINDING_ALGO: 'astar',

  // Safety Parameters
  MIN_DEPTH_MARGIN: 0.5,
  MAX_ACCEPTABLE_HEELING: 25,

  // Development
  DEBUG: false,
  LOG_LEVEL: 'info'
};

/**
 * Initialize all weather API instances
 */
let weatherApis = {
  noaa: null,
  openMeteo: null,
  openWeatherMap: null,
  aggregator: null
};

function initializeWeatherAPIs() {
  console.log('🌍 Initializing Weather APIs...');

  // Initialize NOAA GFS
  if (CONFIG.NOAA_ENABLED && typeof NOAAGFSApi !== 'undefined') {
    weatherApis.noaa = new NOAAGFSApi({ enabled: true });
    console.log('✅ NOAA GFS initialized');
  }

  // Initialize Open-Meteo
  if (CONFIG.OPENMETEO_ENABLED && typeof OpenMeteoApi !== 'undefined') {
    weatherApis.openMeteo = new OpenMeteoApi({ enabled: true });
    console.log('✅ Open-Meteo initialized');
  }

  // Initialize OpenWeatherMap
  if (CONFIG.OPENWEATHERMAP_ENABLED && typeof OpenWeatherMapApi !== 'undefined') {
    weatherApis.openWeatherMap = new OpenWeatherMapApi({
      apiKey: CONFIG.OPENWEATHERMAP_KEY,
      enabled: !!CONFIG.OPENWEATHERMAP_KEY
    });
    console.log('✅ OpenWeatherMap initialized');
  }

  // Initialize Aggregator
  if (typeof WeatherAggregator !== 'undefined') {
    weatherApis.aggregator = new WeatherAggregator(CONFIG);
    weatherApis.aggregator.initializeSources(
      weatherApis.noaa,
      weatherApis.openMeteo,
      weatherApis.openWeatherMap
    );
    console.log('✅ Weather Aggregator initialized');
  }

  return weatherApis;
}

/**
 * Get boat profiles from local files
 */
async function loadBoatProfiles() {
  const boats = [];
  const boatFiles = ['dufour-45.json', 'beneteau-first-40.json'];

  for (const file of boatFiles) {
    try {
      const response = await fetch(`../../boats/${file}`);
      if (response.ok) {
        const boat = await response.json();
        boats.push(boat);
      }
    } catch (error) {
      console.warn(`Could not load boat profile: ${file}`, error);
    }
  }

  return boats;
}

/**
 * Log with level control
 */
function log(message, level = 'info') {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[CONFIG.LOG_LEVEL] || 1;

  if (levels[level] >= currentLevel) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initializeWeatherAPIs();
});
