/**
 * Configuration for API and WebSocket connections
 * Automatically detects if running in Docker (via nginx proxy) or locally
 */

// Check if we're in production (Docker/nginx) or development (Vite dev server)
const isProduction = import.meta.env.PROD

// In production (Docker), nginx proxies /api and /ws to the backend
// In development, we connect directly to localhost:8333
export const API_BASE = isProduction 
  ? '' 
  : 'http://localhost:8333'

export const WS_BASE = isProduction 
  ? `ws://${window.location.host}` 
  : 'ws://localhost:8333'

// WebSocket endpoints
export const WS_STATE = `${WS_BASE}/ws/state`
export const WS_CHAT = `${WS_BASE}/ws/chat`
export const getWsAttack = (domainId) => `${WS_BASE}/ws/attack/${domainId}`

// API endpoints
export const API_GAME = `${API_BASE}/api/game`
export const API_PASSWORD = `${API_BASE}/api/password`
export const API_MISSIONS = `${API_BASE}/api/missions`
export const API_SECTOR = `${API_BASE}/api/sector`
export const API_CHALLENGE = `${API_BASE}/api/challenge`
export const API_HINT = `${API_BASE}/api/hint`
export const API_EVENTS = `${API_BASE}/api/events`
export const API_PASSWORDS = `${API_BASE}/api/passwords`

export default {
  API_BASE,
  WS_BASE,
  WS_STATE,
  WS_CHAT,
  getWsAttack,
  API_GAME,
  API_PASSWORD,
  API_MISSIONS,
  API_SECTOR,
  API_CHALLENGE,
  API_HINT,
  API_EVENTS,
  API_PASSWORDS,
}


