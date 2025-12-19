import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  const [isTracking, setIsTracking] = useState(false)
  const [position, setPosition] = useState(null)
  const [path, setPath] = useState([])
  const [distance, setDistance] = useState(0)
  const [showStatus, setShowStatus] = useState(true)
  const [statusMessage, setStatusMessage] = useState({
    title: '🗺️ Prêt à Explorer',
    text: 'Autorisez la géolocalisation et commencez votre voyage cartographique'
  })
  const [showInfo, setShowInfo] = useState(false)
  const watchIdRef = useRef(null)
  const lastPositionRef = useRef(null)
  const centerRef = useRef({ lat: 48.8566, lon: 2.3522 })
  const scaleRef = useRef(5000)

  // Initialisation du canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      drawMap()
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [path])

  // Calculer la distance entre deux points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  // Convertir lat/lon en coordonnées canvas
  const latLonToCanvas = (lat, lon) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const x = rect.width / 2 + (lon - centerRef.current.lon) * scaleRef.current
    const y = rect.height / 2 - (lat - centerRef.current.lat) * scaleRef.current
    return { x, y }
  }

  // Dessiner la carte
  const drawMap = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    // Fond parchemin
    ctx.fillStyle = '#f5ead8'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Texture
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * rect.width
      const y = Math.random() * rect.height
      const radius = Math.random() * 15 + 10

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, 'rgba(139, 117, 87, 0.08)')
      gradient.addColorStop(1, 'rgba(139, 117, 87, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Grille décorative
    ctx.strokeStyle = 'rgba(58, 40, 23, 0.1)'
    ctx.lineWidth = 0.5
    for (let x = 0; x < rect.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.stroke()
    }
    for (let y = 0; y < rect.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }

    // Tracé du parcours
    if (path.length > 1) {
      // Ombre
      ctx.strokeStyle = 'rgba(58, 40, 23, 0.3)'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()

      path.forEach((point, i) => {
        const pos = latLonToCanvas(point.lat, point.lon)
        if (i === 0) ctx.moveTo(pos.x + 1, pos.y + 1)
        else ctx.lineTo(pos.x + 1, pos.y + 1)
      })
      ctx.stroke()

      // Tracé principal
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
      gradient.addColorStop(0, '#8b3a3a')
      gradient.addColorStop(0.5, '#6b2a2a')
      gradient.addColorStop(1, '#5a1a1a')

      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.beginPath()

      path.forEach((point, i) => {
        const pos = latLonToCanvas(point.lat, point.lon)
        if (i === 0) ctx.moveTo(pos.x, pos.y)
        else ctx.lineTo(pos.x, pos.y)
      })
      ctx.stroke()

      // Marqueur de départ
      const start = latLonToCanvas(path[0].lat, path[0].lon)
      drawMarker(ctx, start.x, start.y, '⚓', '#3a7a5a')

      // Position actuelle
      if (path.length > 0) {
        const current = latLonToCanvas(path[path.length - 1].lat, path[path.length - 1].lon)
        drawMarker(ctx, current.x, current.y, '📍', '#8b3a3a')
      }
    } else if (path.length === 0) {
      // Message "Terra Incognita"
      ctx.save()
      ctx.font = 'italic 24px "IM Fell DW Pica"'
      ctx.fillStyle = 'rgba(58, 40, 23, 0.15)'
      ctx.textAlign = 'center'
      ctx.fillText('Terra Incognita', rect.width / 2, rect.height / 2)
      ctx.restore()
    }
  }

  // Dessiner un marqueur
  const drawMarker = (ctx, x, y, symbol, color) => {
    // Ombre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.arc(x + 1, y + 1, 10, 0, Math.PI * 2)
    ctx.fill()

    // Cercle de fond
    ctx.fillStyle = '#f5ead8'
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fill()

    // Bordure
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.stroke()

    // Symbole
    ctx.font = '14px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(symbol, x, y)
  }

  // Gérer la position
  const handlePosition = (pos) => {
    const lat = pos.coords.latitude
    const lon = pos.coords.longitude
    const alt = pos.coords.altitude || 0

    setPosition({
      lat: lat.toFixed(6),
      lon: lon.toFixed(6),
      alt: Math.round(alt)
    })

    // Calculer distance
    if (lastPositionRef.current) {
      const dist = calculateDistance(
        lastPositionRef.current.lat,
        lastPositionRef.current.lon,
        lat,
        lon
      )
      setDistance(prev => prev + dist)
    }

    // Ajouter au parcours
    setPath(prev => [...prev, { lat, lon, alt, timestamp: Date.now() }])
    lastPositionRef.current = { lat, lon }

    // Recentrer si premier point
    if (path.length === 0) {
      centerRef.current = { lat, lon }
    }
  }

  // Gérer les erreurs
  const handleError = (error) => {
    let message = ''
    let title = 'Erreur'

    switch(error.code) {
      case error.PERMISSION_DENIED:
        title = '🚫 Permission refusée'
        message = 'Autorisez l\'accès à la localisation dans les paramètres de votre navigateur'
        break
      case error.POSITION_UNAVAILABLE:
        title = '📡 Position indisponible'
        message = 'Impossible de vous localiser. Sortez à l\'extérieur pour un meilleur signal GPS'
        break
      case error.TIMEOUT:
        title = '⏱️ Délai dépassé'
        message = 'La recherche de position prend trop de temps. Vérifiez votre signal GPS'
        break
      default:
        message = 'Erreur inconnue'
    }

    setStatusMessage({ title, text: message })
    setShowStatus(true)
    stopTracking()
  }

  // Démarrer le tracking
  const startTracking = async () => {
    if (!navigator.geolocation) {
      setStatusMessage({
        title: '❌ Non supporté',
        text: 'Votre navigateur ne supporte pas la géolocalisation'
      })
      return
    }

    setStatusMessage({
      title: '📡 Recherche...',
      text: 'Acquisition de votre position GPS...'
    })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShowStatus(false)
        setIsTracking(true)
        handlePosition(pos)

        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePosition,
          handleError,
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
          }
        )
      },
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }

  // Arrêter le tracking
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  // Réinitialiser
  const reset = () => {
    if (confirm('Effacer toute la carte ?')) {
      stopTracking()
      setPath([])
      setDistance(0)
      setPosition(null)
      lastPositionRef.current = null
      drawMap()
    }
  }

  // Formater la distance
  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(2)} km`
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>⚜ Cartographia ⚜</h1>
        <p className="subtitle">Exploratoria</p>
      </header>

      {/* Canvas carte */}
      <div className="map-container">
        <canvas ref={canvasRef} className="map-canvas" />
        
        {/* Rose des vents (mobile) */}
        <div className="compass-mobile">
          <svg viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="48" fill="#f5ead8" stroke="#3a2817" strokeWidth="2"/>
            <path d="M 50 10 L 55 45 L 50 40 L 45 45 Z" fill="#8b3a3a" stroke="#3a2817" strokeWidth="1"/>
            <text x="50" y="8" textAnchor="middle" fontSize="10" fill="#3a2817" fontWeight="bold">N</text>
            <circle cx="50" cy="50" r="4" fill="#3a2817"/>
          </svg>
        </div>

        {/* Bouton info */}
        <button 
          className="info-toggle"
          onClick={() => setShowInfo(!showInfo)}
        >
          📊
        </button>
      </div>

      {/* Panneau d'informations (mobile) */}
      {showInfo && position && (
        <div className="info-panel-mobile">
          <button className="close-btn" onClick={() => setShowInfo(false)}>✕</button>
          <h3>📜 Journal de Bord</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Latitude:</span>
              <span>{position.lat}°</span>
            </div>
            <div className="info-item">
              <span className="label">Longitude:</span>
              <span>{position.lon}°</span>
            </div>
            <div className="info-item">
              <span className="label">Altitude:</span>
              <span>{position.alt} m</span>
            </div>
            <div className="info-item">
              <span className="label">Distance:</span>
              <span>{formatDistance(distance)}</span>
            </div>
            <div className="info-item">
              <span className="label">Points:</span>
              <span>{path.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div className="controls">
        {!isTracking ? (
          <button className="btn btn-primary" onClick={startTracking}>
            ⚓ Commencer l'Exploration
          </button>
        ) : (
          <button className="btn btn-warning" onClick={stopTracking}>
            ⏸ Pause
          </button>
        )}
        <button className="btn btn-secondary" onClick={reset} disabled={path.length === 0}>
          🗑 Nouvelle Carte
        </button>
      </div>

      {/* Message de statut */}
      {showStatus && (
        <div className="status-overlay" onClick={() => setShowStatus(false)}>
          <div className="status-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{statusMessage.title}</h2>
            <p>{statusMessage.text}</p>
            <button className="btn btn-primary" onClick={() => setShowStatus(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
