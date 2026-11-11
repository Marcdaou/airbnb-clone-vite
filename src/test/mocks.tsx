/* Shared test doubles: a fake react-leaflet and a fake Supabase query builder. */
import { vi } from 'vitest'
import type { ReactNode } from 'react'
import L from 'leaflet'
import type { Listing } from '../lib/types'

type Handlers = Record<string, (...a: unknown[]) => void>

export const mapState = {
  bounds: L.latLngBounds([-90, -180], [90, 180]),
  handlers: {} as Handlers,
  tile: null as null | { url: string; attribution: string },
}

export const fakeMap = {
  fitBounds: vi.fn(),
  setView: vi.fn(),
  invalidateSize: vi.fn(),
  getBounds: () => mapState.bounds,
}

export const reactLeafletMock = {
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: (p: { url: string; attribution: string }) => { mapState.tile = p; return <div data-testid="tiles" /> },
  ZoomControl: () => null,
  useMap: () => fakeMap,
  useMapEvents: (h: Handlers) => { mapState.handlers = h; return fakeMap },
  Marker: (p: { title: string; icon: L.DivIcon; zIndexOffset: number; eventHandlers: { click: () => void } }) => (
    <button data-testid="pin" title={p.title} data-z={p.zIndexOffset} onClick={() => p.eventHandlers.click()}
      dangerouslySetInnerHTML={{ __html: String(p.icon.options.html) }} />
  ),
  Popup: ({ children }: { children: ReactNode }) => <div data-testid="popup">{children}</div>,
}

export const mk = (o: Partial<Listing> & { id: string }): Listing => ({
  title: `Stay ${o.id}`, description: '', city: 'City', country: 'Land', category: 'Beachfront',
  price_per_night: 100, max_guests: 4, bedrooms: 1, beds: 1, baths: 1,
  images: [`https://img/${o.id}.jpg`], amenities: [], rating: 4.9, review_count: 3,
  host_name: 'H', host_avatar: '', lat: 0, lng: 0, ...o,
})

export const db = { listings: [] as Listing[], calls: [] as string[], hold: false }

/** Chainable, thenable builder applying eq/gte/or filters to db.listings. */
export function fromMock(table: string) {
  db.calls.push(table)
  let rows = table === 'listings' ? [...db.listings] : []
  const b = {
    select: () => b,
    eq: (c: string, v: unknown) => { rows = rows.filter(r => (r as Record<string, unknown>)[c] === v); return b },
    gte: (c: string, v: number) => { rows = rows.filter(r => ((r as Record<string, unknown>)[c] as number) >= v); return b },
    or: (expr: string) => {
      const w = /%(.*?)%/.exec(expr)?.[1]?.toLowerCase() ?? ''
      rows = rows.filter(r => [r.city, r.country, r.title].some(s => s.toLowerCase().includes(w)))
      return b
    },
    then: (res: (v: { data: Listing[]; error: null }) => unknown) => db.hold ? new Promise(() => {}) : Promise.resolve({ data: rows, error: null }).then(res),
  }
  return b
}

export function setViewport(width: number) {
  window.matchMedia = ((q: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(q)?.[1] ?? 0)
    return { matches: width >= min, media: q, addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false }
  }) as unknown as typeof window.matchMedia
}
