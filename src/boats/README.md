# ⛵ Boat Profiles

Store your sailboat configurations here as JSON files.

## Quick Start

1. **Add your boat:**
   - Copy `dufour-45.json` or `beneteau-first-40.json`
   - Rename and customize with your boat data
   - Save to this folder

2. **Reload the application** - your boat appears in the selector

## Profile Files

- **dufour-45.json** - Example cruising sailboat
- **beneteau-first-40.json** - Example racing-cruiser

## Creating New Profiles

See `../docs/BOAT_FORMAT.md` for detailed format specification.

Key sections:
- **specs** - Physical dimensions and weight
- **performance** - Speed limits and capabilities
- **polars** - Performance curves (speed at different wind angles)
- **safety** - Draft and maximum conditions
- **comfort** - Heeling and wave preferences

## Tips

- **Polar curves are critical** - They determine route optimization
- **Source real data** - Use manufacturer specs or measurement
- **Keep JSON valid** - Use a JSON validator
- **File naming** - Use kebab-case: `my-boat-name.json`

## Resources

- IMS database: International Measurement System
- ORC: Offshore Racing Congress
- Sailing magazines and reviews
- Manufacturer documentation
