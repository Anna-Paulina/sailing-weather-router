async function loadBoatProfiles() {
  const boats = [];
  const boatFiles = ['dufour-45.json', 'beneteau-first-40.json'];

  for (const file of boatFiles) {
    try {
      const response = await fetch(`boats/${file}`);
      if (response.ok) {
        const boat = await response.json();
        boats.push(boat);
        console.log(`✅ Loaded: ${boat.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load ${file}:`, error);
    }
  }
  return boats;
}
