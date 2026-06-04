/**
 * Get boat profiles from GitHub
 */
async function loadBoatProfiles() {
  const boats = [];
  const githubRawUrl = 'https://raw.githubusercontent.com/Anna-Paulina/sailing-weather-router/main/boats/';
  const boatFiles = ['dufour-45.json', 'beneteau-first-40.json'];

  for (const file of boatFiles) {
    try {
      const response = await fetch(`${githubRawUrl}${file}`);
      if (response.ok) {
        const boat = await response.json();
        boats.push(boat);
        console.log(`✅ Loaded boat: ${boat.name}`);
      } else {
        console.warn(`⚠️ Could not load ${file}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`❌ Could not load boat profile: ${file}`, error);
    }
  }

  if (boats.length === 0) {
    console.error('❌ No boat profiles loaded!');
  }

  return boats;
}
