import { describe, it, expect } from 'vitest'
import L from 'leaflet'
import { hasCoords, inBounds } from './geo'
import { mk } from '../test/mocks'

describe('geo', () => {
  it('R9: hasCoords accepts finite lat/lng and rejects null, NaN and Infinity', () => {
    expect(hasCoords(mk({ id: 'a', lat: 48.8, lng: 2.3 }))).toBe(true)
    expect(hasCoords(mk({ id: 'z', lat: 0, lng: 0 }))).toBe(true)
    expect(hasCoords(mk({ id: 'b', lat: null, lng: 2 }))).toBe(false)
    expect(hasCoords(mk({ id: 'c', lat: 2, lng: null }))).toBe(false)
    expect(hasCoords(mk({ id: 'd', lat: NaN, lng: 2 }))).toBe(false)
    expect(hasCoords(mk({ id: 'e', lat: 2, lng: Infinity }))).toBe(false)
  })

  it('R7: inBounds is true only for listings inside the bounds', () => {
    const b = L.latLngBounds([40, -5], [55, 5])
    expect(inBounds(mk({ id: 'paris', lat: 48.85, lng: 2.35 }), b)).toBe(true)
    expect(inBounds(mk({ id: 'lisbon', lat: 38.7, lng: -9.1 }), b)).toBe(false)
  })

  it('R9/E4: inBounds excludes listings without coords even with world bounds', () => {
    const world = L.latLngBounds([-90, -180], [90, 180])
    expect(inBounds(mk({ id: 'n', lat: null, lng: null }), world)).toBe(false)
  })
})
