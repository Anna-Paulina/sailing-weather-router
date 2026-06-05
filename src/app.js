/**
 * Sailing Weather Router - Main Application
 * FIXED VERSION
 */

async function initializeApp() {
  console.log('⛵ Sailing Weather Router');
  console.log('🌍 Vector-Based Professional Routing\n');

  try {
    console.log('🌊 Initializing weather APIs...');
    await initializeWeatherAPIs();

    console.log('🗺️ Initializing map...');
    initializeMap();

    console.log('🚢 Initializing boat selector...');
    const boatProfiles = await loadBoatProfiles();
    initializeBoatSelector(boatProfiles);

    console.log('\n✅ Application ready!\n');
    updateStatus('Ready - Select a boat and click two points on the map');

  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

async function calculateRoute() {
  console.log('\n' + '='.repeat(70));
  console.log('🌊 ROUTE CALCULATION');
  console.log('='.repeat(70) + '\n');

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
  updateStatus('🌬️ Fetching weather and calculating route...');

  try {
    console.log('📡 STEP 1: Fetching 7-day forecast\n');
    
    const forecastResults = await weatherApis.aggregator.getConsensusForecast(
      start.lat, 
      start.lng, 
      7
    );

    // FIX #2: Check for 'consensus' not 'data'
    if (!forecastResults.consensus || forecastResults.consensus.length === 0) {
      throw new Error('Could not fetch forecast data');
    }

    console.log(`✅ Got ${forecastResults.consensus.length} hours of forecast\n`);

    console.log('🚀 STEP 2: Initializing Routing Engine\n');
    
    // FIX #1: Use RoutingEngine (not RoutingEngineV3)
    const router = new RoutingEngine(boat, forecastResults.consensus);

    console.log('⛵ STEP 3: Calculating route (hour-by-hour)\n');
    
    const routeResult = await router.calculateRoute(
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );

    console.log('\n🎨 STEP 4: Processing route segments\n');
    
    const segments = router.getRouteSegments(routeResult.route);

    console.log('📍 STEP 5: Displaying route\n');
    
    displayRoute(segments, routeResult.waypoints);

    updateStatus('✅ Route calculated successfully');
    updateInfo(`
      <b>Duration:</b> ${routeResult.stats.hours}h (${routeResult.stats.days}d) | 
      <b>Distance:</b> ${routeResult.stats.distance}nm | 
      <b>Speed:</b> ${routeResult.stats.avgSpeed}kt
    `);

    showLoadingIndicator(false);
    fitBounds();

  } catch (error) {
    console.error('❌ Route calculation error:', error);
    updateStatus(`❌ Error: ${error.message}`);
    showLoadingIndicator(false);
  }
}

function displayRoute(segments, waypoints) {
  segments.forEach((segment) => {
    let styleOptions;

    switch(segment.style) {
      case 'solid':
        styleOptions = {
          color: '#2196f3',
          weight: 4,
          opacity: 0.9,
          dashArray: null
        };
        break;
      case 'longdash':
        styleOptions = {
          color: '#ff9800',
          weight: 3,
          opacity: 0.7,
          dashArray: '15,10'
        };
        break;
      case 'shortdash':
        styleOptions = {
          color: '#f44336',
          weight: 3,
          opacity: 0.6,
          dashArray: '5,5'
        };
        break;
    }

    addRouteToMap(segment.points, styleOptions);
  });

  showRouteLegend();
}

function showRouteLegend() {
  const legend = document.createElement('div');
  legend.innerHTML = `
    <div style="background: white; padding: 15px; border-radius: 8px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px;">
      <b>🎯 Route Confidence</b><br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#2196f3" stroke-width="4"/></svg>
      Days 0-3 (95%)<br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#ff9800" stroke-width="3" stroke-dasharray="8,5"/></svg>
      Days 3-6 (70%)<br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#f44336" stroke-width="3" stroke-dasharray="3,3"/></svg>
      Days 6+ (40%)
    </div>
  `;

  const control = L.control({ position: 'bottomright' });
  control.onAdd = function() {
    const div = L.DomUtil.create('div');
    div.appendChild(legend);
    return div;
  };
  control.addTo(map);
}

// Start app
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
