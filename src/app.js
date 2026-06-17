/**
 * Sailing Weather Router - With Wind Visualization
 */

async function initializeApp() {
  console.log('⛵ Sailing Weather Router - Isochrone Edition');
  console.log('🌍 Professional spherical Earth routing\n');

  try {
    console.log('🌊 Initializing weather APIs...');
    await initializeWeatherAPIs();

    console.log('🗺️ Initializing map...');
    initializeMap();

    console.log('🚢 Initializing boat selector...');
    const boatProfiles = await loadBoatProfiles();
    initializeBoatSelector(boatProfiles);

    console.log('\n✅ Application ready!\n');
    updateStatus('Ready - Select boat and click points');

  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

async function calculateRoute() {
  console.log('\n' + '='.repeat(70));
  console.log('🌊 ROUTE CALCULATION - ISOCHRONE METHOD');
  console.log('='.repeat(70) + '\n');

  const boat = getSelectedBoat();
  const start = getStartPoint();
  const end = getEndPoint();

  if (!boat) {
    alert('Please select a boat');
    return;
  }

  if (!start || !end) {
    alert('Please set start and end points');
    return;
  }

  showLoadingIndicator(true);
  updateStatus('🌬️ Calculating optimal route...');

  try {
    console.log('📡 Fetching 7-day forecast...\n');
    
    const forecastResults = await weatherApis.aggregator.getConsensusForecast(
      start.lat,
      start.lng,
      7
    );

    if (!forecastResults.consensus || forecastResults.consensus.length === 0) {
      throw new Error('Could not fetch forecast data');
    }

    console.log(`✅ Got ${forecastResults.consensus.length} hours\n`);

    console.log('🚀 Initializing Isochrone Routing Engine\n');
    
    const router = new RoutingEngine(boat, forecastResults.consensus);

    console.log('⛵ Calculating route with spherical Earth...\n');
    
    const routeResult = await router.calculateRoute(
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );

    const segments = router.getRouteSegments(routeResult.route);
    const windVectors = router.getWindVectors(routeResult.route, 12);

    console.log('📍 Displaying route and winds\n');
    
    displayRoute(segments);
    displayWinds(windVectors);

    updateStatus('✅ Route calculated');
    updateInfo(`
      <b>Duration:</b> ${routeResult.stats.hours}h (${routeResult.stats.days}d) | 
      <b>Distance:</b> ${routeResult.stats.distance}nm | 
      <b>Speed:</b> ${routeResult.stats.avgSpeed}kt
    `);

    showLoadingIndicator(false);
    fitBounds();

  } catch (error) {
    console.error('❌ Error:', error);
    updateStatus(`❌ ${error.message}`);
    showLoadingIndicator(false);
  }
}

/**
 * Display route with confidence levels
 */
function displayRoute(segments) {
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

/**
 * Display winds as arrows on map
 */
function displayWinds(windVectors) {
  console.log(`🌬️ Displaying ${windVectors.length} wind indicators\n`);

  windVectors.forEach((wind, idx) => {
    // Create arrow icon pointing in wind direction
    const arrowIcon = L.divIcon({
      html: `
        <div style="
          transform: rotate(${wind.direction}deg);
          font-size: 20px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        ">
          ➤
        </div>
      `,
      iconSize: [20, 20],
      className: 'wind-marker'
    });

    const marker = L.marker([wind.lat, wind.lng], {
      icon: arrowIcon,
      title: `Wind: ${wind.speed.toFixed(1)}kt @ ${wind.direction.toFixed(0)}°`
    }).addTo(map);

    marker.bindPopup(`
      <b>Wind</b><br>
      Speed: ${wind.speed.toFixed(1)} kt<br>
      Direction: ${wind.direction.toFixed(0)}°<br>
      Hour: ${wind.hour}
    `);
  });
}

/**
 * Show legend
 */
function showRouteLegend() {
  const legend = document.createElement('div');
  legend.innerHTML = `
    <div style="background: white; padding: 15px; border-radius: 8px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px;">
      <b>🎯 Isochrone Route</b><br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#2196f3" stroke-width="4"/></svg>
      Days 0-3 (95%)<br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#ff9800" stroke-width="3" stroke-dasharray="8,5"/></svg>
      Days 3-6 (70%)<br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#f44336" stroke-width="3" stroke-dasharray="3,3"/></svg>
      Days 6+ (40%)<br><br>
      <b>🌬️ Winds</b><br>
      ➤ = Wind direction
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
