import type { LatLngBounds } from 'leaflet'
import type { Listing } from './types'

export type GeoListing = Listing & { lat: number; lng: number }

export function hasCoords(l: Listing): l is GeoListing {
  return typeof l.lat === 'number' && typeof l.lng === 'number'
    && Number.isFinite(l.lat) && Number.isFinite(l.lng)
}

export function inBounds(l: Listing, b: LatLngBounds): boolean {
  return hasCoords(l) && b.contains([l.lat, l.lng])
}
