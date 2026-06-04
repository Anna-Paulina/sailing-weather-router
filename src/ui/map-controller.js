/**
 * Map Controller Module
 * Manages Leaflet map and user interactions
 * NO DOMContentLoaded - initialized by app.js
 */

let map = null;
let startMarker = null;
let endMarker = null;
let startPoint = null;
let endPoint = null;

function initializeMap() {
  console.log('🗺️ Initializing Map...');

  if (!CONFIG) {
    console.error('❌ CONFIG not defined!');
    return;
  }

  map = L.map('map').setView([CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LNG], CONFIG.DEFAULT_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  map.on('click', (e) => {
    handleMapClick(e.latlng);
  });

  console.log('✅ Map initialized');
}

function handleMapClick(latlng) {
  if (!startPoint) {
    setStartPoint(latlng);
  } else if (!endPoint) {
    setEndPoint(latlng);
  } else {
    clearPoints();
    setStartPoint(latlng);
  }
}

function setStartPoint(latlng) {
  startPoint = latlng;

  if (startMarker) {
    map.removeLayer(startMarker);
  }

  startMarker = L.marker([latlng.lat, latlng.lng], {
    icon: L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/2784/2784598.png',
      iconSize: [32, 32],
      className: 'start-marker'
    })
  }).addTo(map)
    .bindPopup('Start Point')
    .openPopup();

  document.getElementById('startPoint').value = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
  document.getElementById('status').textContent = 'Start point set. Click to set end point.';
}

function setEndPoint(latlng) {
  endPoint = latlng;

  if (endMarker) {
    map.removeLayer(endMarker);
  }

  endMarker = L.marker([latlng.lat, latlng.lng], {
    icon: L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
      iconSize: [32, 32],
      className: 'end-marker'
    })
  }).addTo(map)
    .bindPopup('End Point')
    .openPopup();

  document.getElementById('endPoint').value = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
  document.getElementById('status').textContent = 'Route ready. Click "Calculate Route"';
}

function clearPoints() {
  if (startMarker) {
    map.removeLayer(startMarker);
    startMarker = null;
  }

  if (endMarker) {
    map.removeLayer(endMarker);
    endMarker = null;
  }

  startPoint = null;
  endPoint = null;

  document.getElementById('startPoint').value = '';
  document.getElementById('endPoint').value = '';
  document.getElementById('status').textContent = 'Points cleared. Click to start over.';
}

function getStartPoint() {
  return startPoint;
}

function getEndPoint() {
  return endPoint;
}

function addRouteToMap(route, style = {}) {
  if (!route || route.length === 0) {
    console.warn('Empty route');
    return;
  }

  const defaultStyle = {
    color: '#1976d2',
    weight: 3,
    opacity: 0.8,
    dashArray: null
  };

  const finalStyle = { ...defaultStyle, ...style };

  const line = L.polyline(route, finalStyle).addTo(map);

  return line;
}

function fitBounds() {
  if (startPoint && endPoint) {
    const bounds = L.latLngBounds([startPoint, endPoint]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}
