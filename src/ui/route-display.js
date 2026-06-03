/**
 * Route Display Module
 * Handles visualization of calculated routes and weather data
 */

function displayWeatherResults(results) {
  console.log('📊 Displaying weather results...');

  const { sources, average, consensus } = results;

  // NOAA
  updateSourceDisplay('noaa', sources.noaa);

  // Open-Meteo
  updateSourceDisplay('openmeteo', sources.openMeteo);

  // OpenWeatherMap
  updateSourceDisplay('openweathermap', sources.openWeatherMap);

  // Average
  if (average) {
    const avgText = `Wind: ${average.speed}kt @ ${average.direction}°<br>Gust: ${average.gust || 'N/A'}<br>Sources: ${average.sourceCount}`;
    document.getElementById('average-data').innerHTML = avgText;
    document.getElementById('average-status').innerHTML = '✅ Success';
    document.getElementById('average-status').className = 'status success';
  }
}

function updateSourceDisplay(source, data) {
  const dataEl = document.getElementById(`${source}-data`);
  const statusEl = document.getElementById(`${source}-status`);

  if (data.success && data.data) {
    const windText = `
      <b>Wind:</b> ${data.data.speed}kt @ ${data.data.direction}°<br>
      <b>Gust:</b> ${data.data.gust || 'N/A'}<br>
      <b>Time:</b> ${new Date(data.data.timestamp).toLocaleTimeString()}
    `;

    dataEl.innerHTML = windText;
    statusEl.innerHTML = '✅ Success';
    statusEl.className = 'status success';
  } else {
    dataEl.innerHTML = `❌ ${data.error || 'Unknown error'}`;
    statusEl.innerHTML = '❌ Failed';
    statusEl.className = 'status error';
  }
}

function displayRoute(route, options = {}) {
  console.log('📍 Displaying route...');

  // Group route points by confidence level
  const segments = groupByConfidence(route);

  segments.forEach(segment => {
    const style = getStyleForConfidence(segment.confidence);
    addRouteToMap(segment.points, style);
  });

  fitBounds();
}

function groupByConfidence(route) {
  // Route should be grouped by confidence (solid, long dash, short dash)
  // This is a placeholder - update based on your route structure

  return [{
    confidence: 'high',
    points: route,
    days: '0-3'
  }];
}

function getStyleForConfidence(confidence) {
  switch (confidence) {
    case 'high':
      return {
        color: '#2196f3',
        weight: 3,
        dashArray: null,
        opacity: 0.9
      };
    case 'medium':
      return {
        color: '#ff9800',
        weight: 3,
        dashArray: '15,10',
        opacity: 0.7
      };
    case 'low':
      return {
        color: '#f44336',
        weight: 3,
        dashArray: '5,5',
        opacity: 0.6
      };
    default:
      return {
        color: '#666',
        weight: 2,
        dashArray: '2,2',
        opacity: 0.5
      };
  }
}

function showLoadingIndicator(visible = true) {
  const loader = document.getElementById('loading');
  if (visible) {
    loader.classList.add('active');
  } else {
    loader.classList.remove('active');
  }
}

function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

function updateInfo(message) {
  document.getElementById('info').textContent = message;
}
