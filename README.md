# ⛵ Sailing Weather Router

**Advanced weather routing system for sailboats with multi-source wind data and intelligent path optimization.**

> Plan your sailing routes considering wind patterns, bathymetry, boat performance, and weather forecasts from multiple sources.

---

## 🎯 Features

✅ **Multi-Source Weather Data**
- NOAA GFS (Global Forecast System)
- Open-Meteo (European alternative)
- OpenWeatherMap
- Averaged consensus forecast

✅ **Boat Profiles**
- Store multiple boat configurations (JSON)
- Polar performance curves
- Draft, max speed, max wind limits

✅ **Intelligent Routing**
- A* pathfinding with custom cost function
- Wind-optimized routes
- Bathymetry awareness (avoid shallow water)
- Time-based simulation (hourly updates)

✅ **Advanced Visualization**
- Multi-day route with confidence levels
  - Solid line: Days 0-3 (95% confidence)
  - Long dashes: Days 3-6 (70% confidence)
  - Short dashes: Days 6+ (40% confidence)
- Wind vector overlays
- Bathymetry heatmap
- Speed/heading profiles

---

## 🚀 Quick Start

### 1. Setup
```bash
git clone <your-repo>
cd sailing-weather-router
npm install
cp .env.example .env
```

### 2. Configure APIs
Edit `.env` with your API keys:
```env
NOAA_ENABLED=true
OPENMETEO_ENABLED=true
OPENWEATHERMAP_KEY=your_key_here
OPENWEATHERMAP_ENABLED=true
```

### 3. Add Your Boat
Create `boats/my-boat.json`:
```json
{
  "name": "My Sailboat",
  "type": "cruiser",
  "draught": 1.8,
  "maxHull": 12,
  "maxWind": 35,
  "polars": { ... }
}
```

### 4. Run
```bash
npm start
# Opens http://localhost:8080
```

---

## 📁 Project Structure

```
sailing-weather-router/
├── boats/                    # Boat profile configurations
├── api/                      # Weather API modules
├── src/
│   ├── index.html           # Main interface
│   ├── config.js            # Global configuration
│   ├── routing/             # Routing engine
│   ├── ui/                  # UI components
│   └── utils/               # Utilities
├── data/                    # Static data (bathymetry tiles, etc)
├── docs/                    # Documentation
└── package.json
```

---

## 🌊 Weather Sources

| Source | Type | Coverage | Accuracy | Update |
|--------|------|----------|----------|--------|
| **NOAA GFS** | Forecast | Global | High | 6h |
| **Open-Meteo** | Forecast | Global | High | 1h |
| **OpenWeatherMap** | Current + Forecast | Global | Medium | 30min |
| **Consensus** | Averaged | Global | Highest | Varies |

---

## 📖 Documentation

- [API Setup Guide](docs/API.md)
- [Boat Profile Format](docs/BOAT_FORMAT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Development Setup](docs/SETUP.md)

---

## 🔧 Tech Stack

- **Frontend:** Leaflet.js, Vanilla JS
- **Backend Ready:** Node.js (easily detachable)
- **Data:** GeoJSON, NetCDF (bathymetry)
- **APIs:** NOAA, Open-Meteo, OpenWeatherMap

---

## 📦 Future: Standalone App

This project is structured to be easily extracted into:
- Desktop app (Electron)
- Mobile app (React Native)
- Dedicated backend service

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions welcome! Feel free to add:
- More boat profiles
- Additional weather sources
- UI improvements
- Performance optimizations

---

Created with ⛵ for sailors
