/**
 * Sailing Weather Router - Main Application
 * SINGLE INITIALIZATION POINT
 */

// ========================
// INITIALIZATION
// ========================

async function initializeApp() {
  console.log('⛵ Sailing Weather Router v0.1.0');
  console.log('🌍 Multi-source weather routing system\n');

  try {
    // Step 1: Initialize weather APIs
    console.log('🌊 Initializing weather APIs...');
    await initializeWeatherAPIs();

    // Step 2: Initialize map
    console.log('🗺️ Initializing map...');
    initializeMap();

    // Step 3: Initialize boat selector
    console.log('🚢 Initializing boat selector...');
    const boatProfiles = await loadBoatProfiles();
    initializeBoatSelector(boatProfiles);

    console.log('\n✅ Application ready!\n');
    updateStatus('Ready - Select a boat and click two points on the map');

  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

// ========================
// ROUTE CALCULATION (NEW!)
// ========================

async function calculateRoute() {
  console.log('\n🚀 Starting intelligent route calculation...\n');

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
  updateStatus('🌬️ Fetching weather data and calculating optimal route...');

  try {
    // Step 1: Get weather forecast for the entire route
    console.log('\n📡 STEP 1: Fetching 7-day forecast...\n');
    const forecastResults = await weatherApis.aggregator.getConsensusForecast(
      start.lat, 
      start.lng, 
      7
    );

    if (!forecastResults.success || !forecastResults.data || forecastResults.data.length === 0) {
      throw new Error('Could not fetch forecast data');
    }

    console.log(`✅ Got ${forecastResults.data.length} hours of forecast data`);
    displayWeatherResults({ sources: {}, average: null, consensus: null });

    // Step 2: Initialize routing engine
    console.log('\n🛣️ STEP 2: Initializing routing engine...\n');
    const router = new RoutingEngine(boat, forecastResults.data);

    // Step 3: Calculate optimal route
    console.log('\n⛵ STEP 3: Calculating wind-optimized route...\n');
    const route = await router.calculateRoute(
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );

    if (!route || route.length === 0) {
      throw new Error('Could not calculate route');
    }

    // Step 4: Get route segments with styles
    console.log('\n🎨 STEP 4: Styling route by confidence level...\n');
    const segments = router.getRouteSegments(route);

    // Step 5: Display route
    console.log('\n📍 STEP 5: Displaying route on map...\n');
    displayOptimizedRoute(segments);

    // Step 6: Calculate statistics
    const totalDistance = calculateRouteDistance(route);
    const totalHours = route[route.length - 1].hour;
    const totalDays = Math.ceil(totalHours / 24);
    const avgSpeed = totalDistance / totalHours;

    updateStatus('✅ Route calculated successfully');
    updateInfo(`
      📏 Distance: ${totalDistance.toFixed(1)} nm | 
      ⏱️ Duration: ${totalDays} days (${totalHours} hours) | 
      🚤 Avg Speed: ${avgSpeed.toFixed(1)} kt
    `);

    showLoadingIndicator(false);
    fitBounds();

  } catch (error) {
    console.error('❌ Route calculation error:', error);
    updateStatus(`❌ Error: ${error.message}`);
    showLoadingIndicator(false);
  }
}

/**
 * Display route with different styles based on confidence
 */
function displayOptimizedRoute(segments) {
  console.log(`\n📍 Displaying ${segments.length} route segments...\n`);

  segments.forEach((segment, idx) => {
    let styleOptions;

    switch(segment.style) {
      case 'solid':
        styleOptions = {
          color: '#2196f3',
          weight: 4,
          opacity: 0.9,
          dashArray: null,
          className: 'route-solid'
        };
        console.log(`  Days 0-3 (solid): ${segment.points.length} points`);
        break;
      case 'longdash':
        styleOptions = {
          color: '#ff9800',
          weight: 3,
          opacity: 0.7,
          dashArray: '15,10',
          className: 'route-longdash'
        };
        console.log(`  Days 3-6 (long dash): ${segment.points.length} points`);
        break;
      case 'shortdash':
        styleOptions = {
          color: '#f44336',
          weight: 3,
          opacity: 0.6,
          dashArray: '5,5',
          className: 'route-shortdash'
        };
        console.log(`  Days 6+ (short dash): ${segment.points.length} points`);
        break;
    }

    addRouteToMap(segment.points, styleOptions);
  });

  // Add legend
  showRouteLegend();
}

/**
 * Show legend for route confidence
 */
function showRouteLegend() {
  const legend = document.createElement('div');
  legend.innerHTML = `
    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px;">
      <b>Route Confidence</b><br>
      <svg width="30" height="3" style="display: inline-block; margin-right: 8px;"><line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#2196f3" stroke-width="3"/></svg>
      <span>Days 0-3 (95%)</span><br>
      <svg width="30" height="3" style="display: inline-block; margin-right: 8px; margin-top: 4px;"><line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#ff9800" stroke-width="2" stroke-dasharray="5,3"/></svg>
      <span>Days 3-6 (70%)</span><br>
      <svg width="30" height="3" style="display: inline-block; margin-right: 8px; margin-top: 4px;"><line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#f44336" stroke-width="2" stroke-dasharray="2,2"/></svg>
      <span>Days 6+ (40%)</span>
    </div>
  `;

  const legendControl = L.control({ position: 'bottomright' });
  legendControl.onAdd = function() {
    const div = L.DomUtil.create('div');
    div.appendChild(legend);
    return div;
  };
  legendControl.addTo(map);
}

/**
 * Calculate total distance of route
 */
function calculateRouteDistance(route) {
  let distance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const d = Math.sqrt(
      Math.pow(route[i+1].lat - route[i].lat, 2) +
      Math.pow(route[i+1].lng - route[i].lng, 2)
    );
    distance += d * 60; // Convert degrees to nautical miles
  }
  return distance;
}

// ========================
// START APPLICATION
// ========================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ========================
// KEYBOARD SHORTCUTS
// ========================

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearPoints();
  }

  if (e.key === 'Enter' && getSelectedBoat() && getStartPoint() && getEndPoint()) {
    calculateRoute();
  }
});
