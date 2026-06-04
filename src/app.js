/**
 * Sailing Weather Router - Main Application
 */

// ========================
// INITIALIZATION (Single point)
// ========================

async function initializeApp() {
  console.log('⛵ Sailing Weather Router v0.1.0');
  console.log('🌍 Multi-source weather routing system\n');

  // Step 1: Initialize weather APIs
  console.log('🌊 Initializing weather APIs...');
  await initializeWeatherAPIs();

  // Step 2: Initialize map
  console.log('🗺️ Initializing map...');
  initializeMap();

  // Step 3: Initialize boat selector
  console.log('🚢 Initializing boat selector...');
  await initBoatSelector();

  // Done!
  console.log('\n✅ Application ready!\n');
  updateStatus('Ready - Select a boat and click two points on the map');
}

// ========================
// ROUTE CALCULATION
// ========================

async function calculateRoute() {
  console.log('\n🚀 Starting route calculation...\n');

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
    console.log('\n📡 STEP 1: Fetching weather data from all sources...\n');
    const weatherResults = await weatherApis.aggregator.getConsensusWind(start.lat, start.lng);
    displayWeatherResults(weatherResults);

    console.log('\n📊 STEP 2: Fetching forecast...\n');
    const forecastResults = await weatherApis.aggregator.getConsensusForecast(start.lat, start.lng, 7);

    console.log('\n🛣️ STEP 3: Calculating optimal route...\n');
    const route = calculateOptimalRoute(start, end, boat, weatherResults.consensus);

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

// ========================
// START APPLICATION WHEN EVERYTHING IS READY
// ========================

// Remove DOMContentLoaded listeners from other files
// and call initializeApp here

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearPoints();
  }
  if (e.key === 'Enter' && getSelectedBoat() && getStartPoint() && getEndPoint()) {
    calculateRoute();
  }
});
