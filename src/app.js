/**
 * Sailing Weather Router - Main Application
 */

async function calculateRoute() {
  console.log('\n🚀 Starting route calculation...\n');

  // Validate inputs
  const boat = getSelectedBoat();
  const start = getStartPoint();
  const end = getEndPoint();

  if (!boat) {
    alert('Please select a boat first');
    return;
  }

  if (!start || !end) {
    alert('Please set both start and end points on the map');
    return;
  }

  showLoadingIndicator(true);
  updateStatus('Calculating route with weather data...');

  try {
    // Step 1: Get weather data from all sources
    console.log('\n📡 STEP 1: Fetching weather data from all sources...\n');
    const weatherResults = await weatherApis.aggregator.getConsensusWind(start.lat, start.lng);

    // Display weather results
    displayWeatherResults(weatherResults);

    // Step 2: Get forecast
    console.log('\n📊 STEP 2: Fetching forecast...\n');
    const forecastResults = await weatherApis.aggregator.getConsensusForecast(start.lat, start.lng, 7);

    // Step 3: Calculate optimal route (placeholder)
    console.log('\n🛣️ STEP 3: Calculating optimal route...\n');
    const route = calculateOptimalRoute(start, end, boat, weatherResults.consensus);

    // Step 4: Display route
    console.log('\n📍 STEP 4: Displaying route...\n');
    displayRoute(route);

    updateStatus('✅ Route calculated successfully');
    updateInfo(`Route from [${start.lat.toFixed(2)}, ${start.lng.toFixed(2)}] to [${end.lat.toFixed(2)}, ${end.lng.toFixed(2)}]`);

    showLoadingIndicator(false);

  } catch (error) {
    console.error('❌ Route calculation error:', error);
    updateStatus(`❌ Error: ${error.message}`);
    showLoadingIndicator(false);
  }
}

function calculateOptimalRoute(start, end, boat, consensus) {
  /**
   * TODO: Implement A* pathfinding with:
   * - Wind-optimized cost function
   * - Boat performance polars
   * - Bathymetry constraints
   * - Safety margins
   *
   * For now, return simple line
   */

  const points = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    points.push([lat, lng]);
  }

  return points;
}

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('⛵ Sailing Weather Router v0.1.0');
  console.log('🌍 Multi-source weather routing system\n');

  // All modules initialize themselves on DOMContentLoaded
  // Check that everything is ready
  setTimeout(() => {
    console.log('\n✅ Application ready!\n');
    updateStatus('Ready - Select a boat and click two points on the map');
  }, 1000);
});

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearPoints();
  }

  if (e.key === 'Enter' && getSelectedBoat() && getStartPoint() && getEndPoint()) {
    calculateRoute();
  }
});
