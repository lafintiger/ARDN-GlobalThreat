import { useState, useEffect, memo, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup
} from 'react-simple-maps'
import { motion, AnimatePresence } from 'framer-motion'
import './WorldMap.css'

// World map topology - using a CDN hosted TopoJSON
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// Country center coordinates for zoom
const COUNTRY_CENTERS = {
  "USA": { center: [-98, 39], zoom: 3 },
  "CAN": { center: [-106, 56], zoom: 2.5 },
  "MEX": { center: [-102, 23], zoom: 3.5 },
  "GBR": { center: [-2, 54], zoom: 6 },
  "DEU": { center: [10, 51], zoom: 6 },
  "FRA": { center: [2, 46], zoom: 5 },
  "ITA": { center: [12, 42], zoom: 5 },
  "ESP": { center: [-3, 40], zoom: 5 },
  "NLD": { center: [5, 52], zoom: 8 },
  "CHE": { center: [8, 47], zoom: 10 },
  "RUS": { center: [100, 60], zoom: 1.5 },
  "UKR": { center: [32, 49], zoom: 4 },
  "POL": { center: [19, 52], zoom: 5 },
  "SWE": { center: [15, 62], zoom: 3 },
  "NOR": { center: [10, 64], zoom: 3 },
  "CHN": { center: [105, 35], zoom: 2.5 },
  "JPN": { center: [138, 36], zoom: 4 },
  "KOR": { center: [128, 36], zoom: 6 },
  "IND": { center: [78, 22], zoom: 3 },
  "SGP": { center: [104, 1], zoom: 12 },
  "TWN": { center: [121, 24], zoom: 8 },
  "ISR": { center: [35, 31], zoom: 8 },
  "SAU": { center: [45, 24], zoom: 4 },
  "ARE": { center: [54, 24], zoom: 7 },
  "IRN": { center: [53, 32], zoom: 4 },
  "AUS": { center: [134, -25], zoom: 2.5 },
  "NZL": { center: [172, -41], zoom: 4 },
  "BRA": { center: [-52, -14], zoom: 2.5 },
  "ARG": { center: [-64, -34], zoom: 3 },
  "CHL": { center: [-71, -33], zoom: 3 },
  "COL": { center: [-74, 4], zoom: 4 },
  "ZAF": { center: [25, -29], zoom: 4 },
  "EGY": { center: [30, 27], zoom: 5 },
  "NGA": { center: [8, 10], zoom: 4 },
  "KEN": { center: [38, 0], zoom: 5 },
}

// Country display names
const COUNTRY_NAMES = {
  "USA": "United States",
  "CAN": "Canada",
  "MEX": "Mexico",
  "GBR": "United Kingdom",
  "DEU": "Germany",
  "FRA": "France",
  "ITA": "Italy",
  "ESP": "Spain",
  "NLD": "Netherlands",
  "CHE": "Switzerland",
  "RUS": "Russia",
  "UKR": "Ukraine",
  "POL": "Poland",
  "SWE": "Sweden",
  "NOR": "Norway",
  "CHN": "China",
  "JPN": "Japan",
  "KOR": "South Korea",
  "IND": "India",
  "SGP": "Singapore",
  "TWN": "Taiwan",
  "ISR": "Israel",
  "SAU": "Saudi Arabia",
  "ARE": "UAE",
  "IRN": "Iran",
  "AUS": "Australia",
  "NZL": "New Zealand",
  "BRA": "Brazil",
  "ARG": "Argentina",
  "CHL": "Chile",
  "COL": "Colombia",
  "ZAF": "South Africa",
  "EGY": "Egypt",
  "NGA": "Nigeria",
  "KEN": "Kenya",
}

// Regional groupings of countries (ISO codes) for each infrastructure sector
const REGION_SECTORS = {
  "USA": ["financial", "government", "media"],
  "CAN": ["power", "supply", "satellite"],
  "MEX": ["transport", "telecom"],
  "GBR": ["financial", "telecom", "media"],
  "DEU": ["power", "supply", "transport"],
  "FRA": ["nuclear", "government", "healthcare"],
  "ITA": ["healthcare", "transport"],
  "ESP": ["telecom", "media"],
  "NLD": ["supply", "financial"],
  "CHE": ["financial", "healthcare"],
  "RUS": ["nuclear", "satellite", "power", "government"],
  "UKR": ["power", "telecom"],
  "POL": ["supply", "transport"],
  "SWE": ["telecom", "healthcare"],
  "NOR": ["power", "satellite"],
  "CHN": ["supply", "telecom", "power", "nuclear"],
  "JPN": ["transport", "healthcare", "nuclear", "media"],
  "KOR": ["telecom", "transport", "media"],
  "IND": ["telecom", "healthcare", "power"],
  "SGP": ["financial", "supply"],
  "TWN": ["supply", "telecom"],
  "ISR": ["government", "satellite", "healthcare"],
  "SAU": ["power", "financial"],
  "ARE": ["financial", "transport"],
  "IRN": ["nuclear", "power"],
  "AUS": ["supply", "satellite", "healthcare"],
  "NZL": ["power", "healthcare"],
  "BRA": ["power", "supply", "healthcare"],
  "ARG": ["power", "transport"],
  "CHL": ["supply", "telecom"],
  "COL": ["telecom", "emergency"],
  "ZAF": ["power", "financial", "healthcare"],
  "EGY": ["telecom", "transport"],
  "NGA": ["power", "telecom"],
  "KEN": ["telecom", "emergency"],
}

// Sector icon positions on the map
const SECTOR_MARKERS = {
  financial: [
    { name: "Wall Street", coordinates: [-74.0060, 40.7128], region: "USA" },
    { name: "London", coordinates: [-0.1276, 51.5074], region: "GBR" },
    { name: "Hong Kong", coordinates: [114.1694, 22.3193], region: "CHN" },
    { name: "Zurich", coordinates: [8.5417, 47.3769], region: "CHE" },
  ],
  telecom: [
    { name: "Silicon Valley", coordinates: [-122.0322, 37.3688], region: "USA" },
    { name: "Seoul", coordinates: [126.9780, 37.5665], region: "KOR" },
    { name: "Stockholm", coordinates: [18.0686, 59.3293], region: "SWE" },
    { name: "Bangalore", coordinates: [77.5946, 12.9716], region: "IND" },
  ],
  power: [
    { name: "Texas Grid", coordinates: [-97.7431, 30.2672], region: "USA" },
    { name: "European Grid", coordinates: [10.4515, 51.1657], region: "DEU" },
    { name: "Three Gorges", coordinates: [111.0027, 30.8265], region: "CHN" },
    { name: "Moscow", coordinates: [37.6173, 55.7558], region: "RUS" },
  ],
  water: [
    { name: "Colorado River", coordinates: [-111.8911, 36.0544], region: "USA" },
    { name: "Thames", coordinates: [-0.1276, 51.5074], region: "GBR" },
    { name: "Nile Delta", coordinates: [31.2357, 30.0444], region: "EGY" },
    { name: "Yangtze", coordinates: [118.7969, 32.0603], region: "CHN" },
  ],
  transport: [
    { name: "FAA Hub", coordinates: [-77.0369, 38.9072], region: "USA" },
    { name: "Eurocontrol", coordinates: [4.3517, 50.8503], region: "DEU" },
    { name: "Tokyo Rail", coordinates: [139.6917, 35.6895], region: "JPN" },
    { name: "Dubai Port", coordinates: [55.2708, 25.2048], region: "ARE" },
  ],
  healthcare: [
    { name: "CDC Atlanta", coordinates: [-84.3880, 33.7490], region: "USA" },
    { name: "WHO Geneva", coordinates: [6.1432, 46.2044], region: "CHE" },
    { name: "NHS UK", coordinates: [-0.1276, 51.5074], region: "GBR" },
    { name: "Tokyo Medical", coordinates: [139.6917, 35.6895], region: "JPN" },
  ],
  government: [
    { name: "Pentagon", coordinates: [-77.0369, 38.9072], region: "USA" },
    { name: "Kremlin", coordinates: [37.6173, 55.7558], region: "RUS" },
    { name: "Beijing", coordinates: [116.4074, 39.9042], region: "CHN" },
    { name: "Brussels EU", coordinates: [4.3517, 50.8503], region: "DEU" },
  ],
  emergency: [
    { name: "FEMA", coordinates: [-77.0369, 38.9072], region: "USA" },
    { name: "EU Emergency", coordinates: [4.3517, 50.8503], region: "DEU" },
    { name: "Tokyo Disaster", coordinates: [139.6917, 35.6895], region: "JPN" },
    { name: "Nairobi", coordinates: [36.8219, -1.2921], region: "KEN" },
  ],
  satellite: [
    { name: "Cape Canaveral", coordinates: [-80.6077, 28.3922], region: "USA" },
    { name: "Baikonur", coordinates: [63.3167, 45.9650], region: "RUS" },
    { name: "ESA Kourou", coordinates: [-52.7683, 5.1594], region: "FRA" },
    { name: "Pine Gap", coordinates: [133.7356, -23.7990], region: "AUS" },
  ],
  supply: [
    { name: "LA Port", coordinates: [-118.2437, 34.0522], region: "USA" },
    { name: "Rotterdam", coordinates: [4.4777, 51.9244], region: "NLD" },
    { name: "Shanghai", coordinates: [121.4737, 31.2304], region: "CHN" },
    { name: "Singapore", coordinates: [103.8198, 1.3521], region: "SGP" },
  ],
  media: [
    { name: "NYC Media", coordinates: [-74.0060, 40.7128], region: "USA" },
    { name: "BBC London", coordinates: [-0.1276, 51.5074], region: "GBR" },
    { name: "Tokyo Broadcast", coordinates: [139.6917, 35.6895], region: "JPN" },
    { name: "Seoul Media", coordinates: [126.9780, 37.5665], region: "KOR" },
  ],
  nuclear: [
    { name: "US Nuclear", coordinates: [-106.6504, 35.0844], region: "USA" },
    { name: "French Nuclear", coordinates: [2.3522, 48.8566], region: "FRA" },
    { name: "Russian Nuclear", coordinates: [37.6173, 55.7558], region: "RUS" },
    { name: "Fukushima", coordinates: [141.0328, 37.4211], region: "JPN" },
  ],
}

// Sector icons and names
const SECTOR_ICONS = {
  financial: "💰",
  telecom: "📡",
  power: "⚡",
  water: "💧",
  transport: "🚁",
  healthcare: "🏥",
  government: "🏛️",
  emergency: "🚨",
  satellite: "🛰️",
  supply: "🚢",
  media: "📺",
  nuclear: "☢️",
}

const SECTOR_NAMES = {
  financial: "Financial Systems",
  telecom: "Telecommunications",
  power: "Power Grid",
  water: "Water Systems",
  transport: "Transportation",
  healthcare: "Healthcare",
  government: "Government/Military",
  emergency: "Emergency Services",
  satellite: "Satellite/Space",
  supply: "Supply Chain",
  media: "Media/Broadcast",
  nuclear: "Nuclear Systems",
}

// Get color based on compromise level
function getCompromiseColor(percent) {
  if (percent < 25) return "#00ff88"
  if (percent < 50) return "#ffcc00"
  if (percent < 75) return "#ff6600"
  return "#ff0033"
}

function getStatusText(percent) {
  if (percent < 25) return "SECURE"
  if (percent < 50) return "COMPROMISED"
  if (percent < 75) return "CRITICAL"
  return "LOST"
}

// Country name to code mapping
const COUNTRY_NAME_TO_CODE = {
  "United States of America": "USA",
  "United States": "USA",
  "Canada": "CAN",
  "Mexico": "MEX",
  "United Kingdom": "GBR",
  "Germany": "DEU",
  "France": "FRA",
  "Italy": "ITA",
  "Spain": "ESP",
  "Netherlands": "NLD",
  "Switzerland": "CHE",
  "Russia": "RUS",
  "Ukraine": "UKR",
  "Poland": "POL",
  "Sweden": "SWE",
  "Norway": "NOR",
  "China": "CHN",
  "Japan": "JPN",
  "South Korea": "KOR",
  "Korea": "KOR",
  "India": "IND",
  "Singapore": "SGP",
  "Taiwan": "TWN",
  "Israel": "ISR",
  "Saudi Arabia": "SAU",
  "United Arab Emirates": "ARE",
  "Iran": "IRN",
  "Australia": "AUS",
  "New Zealand": "NZL",
  "Brazil": "BRA",
  "Argentina": "ARG",
  "Chile": "CHL",
  "Colombia": "COL",
  "South Africa": "ZAF",
  "Egypt": "EGY",
  "Nigeria": "NGA",
  "Kenya": "KEN",
}

// Get country code from geography
function getCountryCode(geo) {
  return geo?.properties?.ISO_A3 || 
         geo?.properties?.iso_a3 ||
         COUNTRY_NAME_TO_CODE[geo?.properties?.NAME] ||
         COUNTRY_NAME_TO_CODE[geo?.properties?.name] ||
         geo?.id
}

// Get country color based on its sectors' compromise levels
function getCountryColor(geo, domains) {
  const countryCode = getCountryCode(geo)
  const countrySectors = REGION_SECTORS[countryCode]
  if (!countrySectors || !domains) return "#1a1a2e"
  
  let totalCompromise = 0
  let sectorCount = 0
  
  countrySectors.forEach(sectorId => {
    const domain = domains[sectorId]
    if (domain) {
      totalCompromise += domain.compromise_percent
      sectorCount++
    }
  })
  
  if (sectorCount === 0) return "#1a1a2e"
  
  const avgCompromise = totalCompromise / sectorCount
  return getCompromiseColor(avgCompromise)
}

// Country Detail Panel Component
function CountryDetailPanel({ countryCode, domains, onClose }) {
  const countrySectors = REGION_SECTORS[countryCode] || []
  const countryName = COUNTRY_NAMES[countryCode] || countryCode
  
  // Calculate average compromise for this country
  let totalCompromise = 0
  let sectorCount = 0
  countrySectors.forEach(sectorId => {
    const domain = domains?.[sectorId]
    if (domain) {
      totalCompromise += domain.compromise_percent
      sectorCount++
    }
  })
  const avgCompromise = sectorCount > 0 ? totalCompromise / sectorCount : 0
  
  return (
    <motion.div 
      className="country-detail-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="panel-header">
        <button className="back-btn" onClick={onClose}>
          ← GLOBAL VIEW
        </button>
        <h3>{countryName}</h3>
        <div 
          className="country-status"
          style={{ color: getCompromiseColor(avgCompromise) }}
        >
          {getStatusText(avgCompromise)}
        </div>
      </div>
      
      <div className="panel-stats">
        <div className="stat-box">
          <span className="stat-label">OVERALL COMPROMISE</span>
          <span 
            className="stat-value large"
            style={{ color: getCompromiseColor(avgCompromise) }}
          >
            {avgCompromise.toFixed(1)}%
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">SECTORS UNDER ATTACK</span>
          <span className="stat-value">{countrySectors.length}</span>
        </div>
      </div>
      
      <div className="panel-sectors">
        <h4>CRITICAL INFRASTRUCTURE</h4>
        <div className="sector-list">
          {countrySectors.map(sectorId => {
            const domain = domains?.[sectorId]
            const percent = domain?.compromise_percent || 0
            return (
              <div key={sectorId} className="sector-item">
                <div className="sector-info">
                  <span className="sector-icon">{SECTOR_ICONS[sectorId]}</span>
                  <span className="sector-name">{SECTOR_NAMES[sectorId]}</span>
                </div>
                <div className="sector-status">
                  <div className="mini-progress">
                    <div 
                      className="mini-progress-fill"
                      style={{ 
                        width: `${percent}%`,
                        background: getCompromiseColor(percent)
                      }}
                    />
                  </div>
                  <span 
                    className="sector-percent"
                    style={{ color: getCompromiseColor(percent) }}
                  >
                    {percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="panel-attacks">
        <h4>ACTIVE ATTACK VECTORS</h4>
        <div className="attack-list">
          {countrySectors.map(sectorId => {
            const domain = domains?.[sectorId]
            if (!domain || domain.compromise_percent < 5) return null
            return (
              <div key={sectorId} className="attack-item">
                <span className="attack-icon">⚠</span>
                <span className="attack-text">
                  {SECTOR_NAMES[sectorId]} - {domain.status || 'ATTACK IN PROGRESS'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function WorldMap({ domains, activeDomain, onSelectDomain }) {
  const [hoveredCountry, setHoveredCountry] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [attackLines, setAttackLines] = useState([])
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1 })
  
  // Handle country click
  const handleCountryClick = useCallback((geo) => {
    const countryCode = getCountryCode(geo)
    
    // Only zoom to countries we have sector data for
    if (REGION_SECTORS[countryCode] && COUNTRY_CENTERS[countryCode]) {
      setSelectedCountry(countryCode)
      const { center, zoom } = COUNTRY_CENTERS[countryCode]
      setPosition({ coordinates: center, zoom })
    }
  }, [])
  
  // Handle back to global view
  const handleBackToGlobal = useCallback(() => {
    setSelectedCountry(null)
    setPosition({ coordinates: [10, 20], zoom: 1 })
  }, [])
  
  // Generate attack lines
  useEffect(() => {
    const generateAttackLines = () => {
      const lines = []
      const centerPoints = [
        [-74.0060, 40.7128],
        [0, 20],
        [100, 30],
      ]
      
      Object.entries(SECTOR_MARKERS).forEach(([sectorId, markers]) => {
        const domain = domains?.[sectorId]
        if (domain && domain.compromise_percent > 0) {
          markers.forEach((marker, idx) => {
            if (Math.random() < domain.compromise_percent / 100) {
              const center = centerPoints[idx % centerPoints.length]
              lines.push({
                from: center,
                to: marker.coordinates,
                sectorId,
                opacity: Math.min(domain.compromise_percent / 100, 0.8),
              })
            }
          })
        }
      })
      setAttackLines(lines)
    }
    
    generateAttackLines()
    const interval = setInterval(generateAttackLines, 3000)
    return () => clearInterval(interval)
  }, [domains])
  
  // Calculate stats
  const compromisedCountries = Object.keys(REGION_SECTORS).filter(code => {
    const countrySectors = REGION_SECTORS[code]
    if (!countrySectors || !domains) return false
    return countrySectors.some(sectorId => {
      const domain = domains[sectorId]
      return domain && domain.compromise_percent > 0
    })
  }).length
  
  return (
    <div className="world-map-container">
      <div className="map-header">
        <span className="map-title">🌐 GLOBAL THREAT VISUALIZATION</span>
        <span className="map-stats">
          <span className="stat-item">
            <span className="stat-label">NATIONS AFFECTED:</span>
            <span className="stat-value critical">{compromisedCountries}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">ACTIVE VECTORS:</span>
            <span className="stat-value">{attackLines.length}</span>
          </span>
        </span>
      </div>
      
      <div className="map-content">
        <div className={`map-wrapper ${selectedCountry ? 'with-panel' : ''}`}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 130,
              center: [10, 20],
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={setPosition}
              minZoom={1}
              maxZoom={12}
            >
              <defs>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0ff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* World countries */}
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const countryCode = getCountryCode(geo)
                    const countryColor = getCountryColor(geo, domains)
                    const isSelected = selectedCountry === countryCode
                    const isClickable = REGION_SECTORS[countryCode] && COUNTRY_CENTERS[countryCode]
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={countryColor}
                        stroke={isSelected ? "#0ff" : "#0ff"}
                        strokeWidth={isSelected ? 1.5 : 0.3}
                        onClick={() => handleCountryClick(geo)}
                        style={{
                          default: {
                            outline: 'none',
                            opacity: isSelected ? 1 : 0.7,
                            filter: isSelected ? 'brightness(1.3)' : 'none',
                          },
                          hover: {
                            fill: countryColor,
                            outline: 'none',
                            opacity: 1,
                            filter: 'brightness(1.5)',
                            cursor: isClickable ? 'pointer' : 'default',
                            strokeWidth: isClickable ? 1 : 0.3,
                          },
                          pressed: {
                            outline: 'none',
                          },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
              
              {/* Attack vector lines */}
              {attackLines.map((line, idx) => (
                <Line
                  key={`line-${idx}`}
                  from={line.from}
                  to={line.to}
                  stroke={getCompromiseColor(domains?.[line.sectorId]?.compromise_percent || 0)}
                  strokeWidth={1}
                  strokeOpacity={line.opacity}
                  strokeLinecap="round"
                  className="attack-line"
                />
              ))}
              
              {/* Sector markers */}
              {Object.entries(SECTOR_MARKERS).map(([sectorId, markers]) => {
                const domain = domains?.[sectorId]
                if (!domain) return null
                
                // Filter markers based on selected country
                const filteredMarkers = selectedCountry 
                  ? markers.filter(m => m.region === selectedCountry)
                  : markers
                
                return filteredMarkers.map((marker, idx) => {
                  const isActive = activeDomain === sectorId
                  const compromiseLevel = domain.compromise_percent
                  
                  return (
                    <Marker key={`${sectorId}-${idx}`} coordinates={marker.coordinates}>
                      <g 
                        className={`sector-marker ${isActive ? 'active' : ''} ${compromiseLevel > 50 ? 'critical' : ''}`}
                        onClick={() => onSelectDomain && onSelectDomain(sectorId)}
                        style={{ cursor: 'pointer' }}
                      >
                        {compromiseLevel > 25 && (
                          <circle
                            r={selectedCountry ? 12 : 8}
                            fill="none"
                            stroke={getCompromiseColor(compromiseLevel)}
                            strokeWidth={1}
                            className="pulse-ring"
                          />
                        )}
                        <circle
                          r={selectedCountry ? 10 : 6}
                          fill={getCompromiseColor(compromiseLevel)}
                          fillOpacity={0.8}
                          stroke="#000"
                          strokeWidth={0.5}
                        />
                        <text
                          textAnchor="middle"
                          y={selectedCountry ? 5 : 4}
                          style={{
                            fontSize: selectedCountry ? '12px' : '8px',
                            filter: 'drop-shadow(0 0 2px #000)',
                          }}
                        >
                          {SECTOR_ICONS[sectorId]}
                        </text>
                        {/* Show marker name when zoomed in */}
                        {selectedCountry && (
                          <text
                            textAnchor="middle"
                            y={22}
                            style={{
                              fontSize: '8px',
                              fill: '#0ff',
                              textShadow: '0 0 3px #000',
                            }}
                          >
                            {marker.name}
                          </text>
                        )}
                      </g>
                    </Marker>
                  )
                })
              })}
            </ZoomableGroup>
          </ComposableMap>
          
          {/* Scanlines overlay */}
          <div className="map-scanlines"></div>
          
          {/* Corner decorations */}
          <div className="map-corner top-left"></div>
          <div className="map-corner top-right"></div>
          <div className="map-corner bottom-left"></div>
          <div className="map-corner bottom-right"></div>
          
          {/* Zoom hint */}
          {!selectedCountry && (
            <div className="zoom-hint">
              Click a highlighted country to zoom in
            </div>
          )}
        </div>
        
        {/* Country Detail Panel */}
        <AnimatePresence>
          {selectedCountry && (
            <CountryDetailPanel
              countryCode={selectedCountry}
              domains={domains}
              onClose={handleBackToGlobal}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">THREAT LEVEL</div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#00ff88' }}></span>
            <span>SECURE</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ffcc00' }}></span>
            <span>COMPROMISED</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ff6600' }}></span>
            <span>CRITICAL</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ff0033' }}></span>
            <span>LOST</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorldMap
