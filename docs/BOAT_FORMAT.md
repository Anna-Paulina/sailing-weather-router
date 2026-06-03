# ⛵ Boat Profile Format

All boat profiles are stored as JSON files in the `boats/` directory.

## File Structure

```
boats/
├── dufour-45.json
├── beneteau-first-40.json
├── your-boat.json
└── README.md
```

## JSON Schema

### Basic Information

```json
{
  "id": "unique-boat-id",
  "name": "Boat Name",
  "type": "cruiser|racing-cruiser|racing|motor",
  "year": 2015
}
```

### Specifications

```json
"specs": {
  "loa": 12.55,           // Length Overall (meters)
  "beam": 4.0,            // Beam/Width (meters)
  "draft": 2.1,           // Draft/Draught (meters)
  "displacement": 8900,   // Displacement (kg)
  "ballast": 3600,        // Ballast weight (kg)
  "sailArea": 85          // Total sail area (m²)
}
```

### Performance Parameters

```json
"performance": {
  "maxHull": 14.0,        // Maximum hull speed (knots)
  "maxWind": 32,          // Maximum wind for safe sailing (knots)
  "minWind": 2.5,         // Minimum wind for sailing (knots)
  "motorsSpeed": 9        // Motor cruising speed (knots)
}
```

### Polar Performance Curves

The `polars` object defines boat speed at different wind speeds and angles.

**Key:** Wind speed in knots  
**Values:** Speed by angle relative to wind (degrees)

```json
"polars": {
  "comment": "Wind speed (knots) -> speeds by angle (degrees true wind)",
  "5": {
    "0": 0.0,      // 0° = head to wind (no progress)
    "45": 3.2,     // 45° to wind
    "90": 5.8,     // 90° (beam reach)
    "135": 6.2,    // 135°
    "180": 4.8     // 180° (running)
  },
  "10": {
    "0": 0.0,
    "45": 5.2,
    "90": 8.5,
    "135": 9.2,
    "180": 8.8
  },
  // ... more wind speeds (15, 20, 25, 30, 35+)
}
```

**Angle Meanings:**
- **0°**: Head to wind (beating)
- **45°**: Close reach
- **90°**: Beam reach (perpendicular to wind)
- **135°**: Broad reach
- **180°**: Running (downwind)

### Safety Limits

```json
"safety": {
  "minDepthMargin": 0.5,      // Minimum clearance above seabed (meters)
  "maxPitchAngle": 25,        // Maximum pitch before discomfort
  "maxHullStress": 35         // Maximum wind for structural safety
}
```

### Comfort Preferences

```json
"comfort": {
  "maxAcceptableHeeling": 25, // Maximum heel angle for comfort (degrees)
  "maxWaveHeight": 4.0        // Maximum wave height preference
}
```

### Additional Fields

```json
{
  "notes": "Typical cruising sailboat. Good upwind performance.",
  "source": "Manufacturer specifications + typical performance data"
}
```

## Example Complete Profile

See `boats/dufour-45.json` for a complete example.

## Creating Your Own Boat Profile

1. **Measure/Research:**
   - Get specs from manufacturer or boat documentation
   - Find polar performance data (often in sailing databases)
   - Note safety limits

2. **Create JSON file:**
   ```json
   {
     "id": "my-boat-id",
     "name": "My Boat",
     "type": "cruiser",
     "year": 2020,
     "specs": { ... },
     "performance": { ... },
     "polars": { ... },
     "safety": { ... },
     "comfort": { ... }
   }
   ```

3. **Save to `boats/` directory:**
   ```
   boats/my-boat.json
   ```

4. **Reload application** - it will auto-detect the new boat

## Polar Data Sources

- **IMOCA**: https://www.imocaclass.org/
- **IMS**: International Measurement System
- **ORC**: Offshore Racing Congress
- **Sailboat Data**: Various sailing magazines
- **Racing databases**: YachtRacing databases

## Notes

- All measurements in **metric** (meters, kilograms)
- All speeds in **knots**
- All angles in **degrees true wind**
- Polar curves should have all 8 cardinal angles (0, 45, 90, 135, 180, 225, 270, 315)
