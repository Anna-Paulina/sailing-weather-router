/**
 * Sailing Weather Router v3 - Vector-Based Professional Routing
 * Uses vector mathematics for optimal heading calculation
 */

async function initializeApp() {
  console.log('⛵ Sailing Weather Router v3.0');
  console.log('🧮 Vector-Based Professional Routing\n');

  try {
    console.log('🌊 Initializing weather APIs...');
    await initializeWeatherAPIs();

    console.log('🗺️ Initializing map...');
    initializeMap();

    console.log('🚢 Initializing boat selector...');
    const boatProfiles = await loadBoatProfiles();
    initializeBoatSelector(boatProfiles);

    console.log('\n✅ Application ready!\n');
    updateStatus('Ready - Vector-based routing engine loaded');

  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

async function calculateRoute() {
  console.log('\n' + '='.repeat(70));
  console.log('🧮 VECTOR-BASED ROUTE CALCULATION');
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
  updateStatus('🧮 Calculating vector-optimized route...');

  try {
    // Get weather forecast
    console.log('📡 Fetching 7-day forecast...\n');
    
    const forecastResults = await weatherApis.aggregator.getConsensusForecast(
      start.lat,
      start.lng,
      7
    );

    if (!forecastResults.data || forecastResults.data.length === 0) {
      throw new Error('No forecast data available');
    }

    console.log(`✅ Got ${forecastResults.data.length} hours of forecast\n`);

    // Initialize vector-based routing engine
    console.log('🚀 Initializing Vector-Based Routing Engine v3\n');
    
    const router = new RoutingEngineV3(boat, forecastResults.data);

    // Calculate route (hour-by-hour with vector optimization)
    const routeResult = await router.calculateRoute(
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );

    // Get segments
    const segments = router.getRouteSegments(routeResult.route);

    // Display
    console.log('🎨 Displaying route...\n');
    displayVectorRoute(segments, routeResult.waypoints);

    // Show stats
    updateStatus('✅ Vector-optimized route complete');
    updateInfo(`
      <b>Duration:</b> ${routeResult.stats.hours}h (${routeResult.stats.days}d) | 
      <b>Distance:</b> ${routeResult.stats.distance}nm | 
      <b>Speed:</b> ${routeResult.stats.avgSpeed}kt | 
      <b>Waypoints:</b> ${routeResult.waypoints.length}
    `);

    showLoadingIndicator(false);
    fitBounds();
    displayWaypointDetails(routeResult.waypoints);

  } catch (error) {
    console.error('❌ Error:', error);
    updateStatus(`❌ ${error.message}`);
    showLoadingIndicator(false);
  }
}

function displayVectorRoute(segments, waypoints) {
  // Display route segments
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

  // Add waypoints
  addWaypointsToMap(waypoints);

  // Show legend
  showRouteLegend();
}

function addWaypointsToMap(waypoints) {
  waypoints.forEach((wp) => {
    let color, icon;

    if (wp.type === 'start') {
      color = '#4caf50';
      icon = '🚀';
    } else if (wp.type === 'end') {
      color = '#f44336';
      icon = '🎯';
    } else if (wp.type === 'daily') {
      color = '#2196f3';
      icon = '📍';
    } else {
      color = '#ff9800';
      icon = '•';
    }

    const marker = L.marker([wp.lat, wp.lng], {
      icon: L.divIcon({
        html: `<div style="
          background: ${color};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${icon}</div>`,
        iconSize: [32, 32]
      })
    }).addTo(map);

    marker.bindPopup(`<b>${wp.label}</b>`);
  });
}

function displayWaypointDetails(waypoints) {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    right: 15px;
    bottom: 250px;
    width: 300px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    padding: 15px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    font-size: 12px;
  `;

  let html = '<b>📍 Waypoints</b><hr>';

  waypoints.forEach((wp) => {
    const bgColor = wp.type === 'start' ? '#e8f5e9' :
                   wp.type === 'end' ? '#ffebee' : '#e3f2fd';

    html += `
      <div style="background: ${bgColor}; padding: 8px; margin: 5px 0; border-radius: 4px;">
        <b>${wp.label}</b>
      </div>
    `;
  });

  container.innerHTML = html;
  document.body.appendChild(container);
}

function showRouteLegend() {
  const legend = document.createElement('div');
  legend.innerHTML = `
    <div style="background: white; padding: 15px; border-radius: 8px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px;">
      <b>🧮 Vector-Optimized Route</b><br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#2196f3" stroke-width="4"/></svg>
      Days 0-3 (95%)<br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#ff9800" stroke-width="3" stroke-dasharray="8,5"/></svg>
      Days 3-6 (70%)<br><br>
      <svg width="40" height="3" style="margin-right: 8px;"><line x1="0" y1="1.5" x2="40" y2="1.5" stroke="#f44336" stroke-width="3" stroke-dasharray="3,3"/></svg>
      Days 6+ (40%)<br><br>
      See console for vector calculations
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
  if (e.key === 'Escape') clearPoints();
  if (e.key === 'Enter' && getSelectedBoat() && getStartPoint() && getEndPoint()) {
    calculateRoute();
  }
});
