#!/bin/bash
# ⛵ Sailing Weather Router - Git Setup Commands
# Run these commands to initialize your GitHub repository

echo "🚀 Setting up Sailing Weather Router repository..."
echo ""

# Initialize git repository
echo "1️⃣  Initializing Git repository..."
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Create .gitignore
echo "2️⃣  Adding .gitignore..."
# .gitignore already created in project

# Add all files
echo "3️⃣  Staging all files..."
git add .

# Create initial commit
echo "4️⃣  Creating initial commit..."
git commit -m "🚀 Initial commit: Sailing Weather Router

- Multi-source weather API integration (NOAA, Open-Meteo, OpenWeatherMap)
- Boat profile management (JSON-based configurations)
- Interactive Leaflet map interface
- Weather data aggregation and consensus
- Foundation for intelligent route calculation"

# Add remote repository
echo ""
echo "5️⃣  Next steps:"
echo ""
echo "   a) Create a new repository on GitHub:"
echo "      - Go to https://github.com/new"
echo "      - Name it: sailing-weather-router"
echo "      - DO NOT initialize with README, .gitignore, or license"
echo "      - Click 'Create repository'"
echo ""
echo "   b) Copy the commands from GitHub and run them:"
echo "      git branch -M main"
echo "      git remote add origin https://github.com/YOUR_USERNAME/sailing-weather-router.git"
echo "      git push -u origin main"
echo ""
echo "✅ Done! Your repository is ready."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Configuration:"
echo "   Edit .env with your API keys"
echo "   Default OpenWeatherMap key is already configured"
echo ""
echo "🚀 To run locally:"
echo "   npm install"
echo "   npm start"
echo ""
echo "📦 Project structure:"
echo "   ├── boats/              (Boat profiles)"
echo "   ├── api/                (Weather API modules)"
echo "   ├── src/                (Frontend application)"
echo "   ├── docs/               (Documentation)"
echo "   └── .env                (Configuration)"
echo ""
echo "🌊 Multi-source weather data:"
echo "   ✅ NOAA GFS        (No key required)"
echo "   ✅ Open-Meteo      (No key required)"
echo "   ✅ OpenWeatherMap  (Key: 6c4752e5ab4f1ab790ec5387d4c0bc87)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
