/**
 * Boat Selector UI Module
 * Manages boat profile selection and display
 */

let selectedBoat = null;
let boatProfiles = [];

function initializeBoatSelector(boats) {
  console.log('🚢 Initializing Boat Selector...');

  boatProfiles = boats;
  console.log(`Found ${boatProfiles.length} boat profiles`);

  const select = document.getElementById('boatSelect');
  select.innerHTML = '<option value="">Select a boat...</option>';

  boatProfiles.forEach(boat => {
    const option = document.createElement('option');
    option.value = boat.id;
    option.textContent = `${boat.name} (${boat.type})`;
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    selectBoat(e.target.value);
  });
}

function selectBoat(boatId) {
  selectedBoat = boatProfiles.find(b => b.id === boatId);

  if (selectedBoat) {
    console.log(`⛵ Selected boat: ${selectedBoat.name}`);
    document.getElementById('status').textContent = `Boat: ${selectedBoat.name}`;
    showBoatSpecs();
  } else {
    selectedBoat = null;
    document.getElementById('status').textContent = 'No boat selected';
  }
}

function showBoatSpecs() {
  if (!selectedBoat) return;

  const specs = `
    <b>${selectedBoat.name}</b><br>
    Draft: ${selectedBoat.specs.draft}m | 
    Max Speed: ${selectedBoat.performance.maxHull}kt | 
    Max Wind: ${selectedBoat.performance.maxWind}kt
  `;

  document.getElementById('info').innerHTML = specs;
}

function getSelectedBoat() {
  return selectedBoat;
}
