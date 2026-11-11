import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import L, { type LatLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Listing } from '../lib/types'
import { hasCoords, type GeoListing } from '../lib/geo'
import MapPinCard from './MapPinCard'

type Props = {
  listings: Listing[]
  hoveredId: string | null
  selectedId: string | null
  onSelect: (id: string | null) => void
  searchAsMove: boolean
  onSearchAsMoveChange: (v: boolean) => void
  onBoundsChange: (b: LatLngBounds) => void
  fitKey: string
  resultCount: number
  /** Listings to fit bounds to (defaults to `listings`); lets a refit cover all fetched results, not just the area-filtered ones (E5). */
  fitTo?: Listing[]
  /** Mobile: show the selected card docked at the bottom instead of a popup. */
  docked?: boolean
}

const WORLD: [number, number] = [20, 0]
const WORLD_ZOOM = 2

/** Fits the map to the pins whenever fitKey changes (never on search-as-move result changes). */
function FitController({ pins, fitKey }: { pins: GeoListing[]; fitKey: string }) {
  const map = useMap()
  const pinsRef = useRef(pins)
  useEffect(() => { pinsRef.current = pins })
  useEffect(() => {
    if (fitKey.endsWith('|true')) return // still loading (E1)
    const p = pinsRef.current
    map.invalidateSize()
    if (p.length) map.fitBounds(L.latLngBounds(p.map(l => [l.lat, l.lng] as [number, number])), { padding: [48, 48], maxZoom: 13 })
    else map.setView(WORLD, WORLD_ZOOM)
  }, [fitKey, map])
  return null
}

/** Reports bounds on moveend (debounced 300ms) and clears selection on map click. */
function MapEvents({ onBoundsChange, onSelect }: Pick<Props, 'onBoundsChange' | 'onSelect'>) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const report = useRef(onBoundsChange)
  useEffect(() => { report.current = onBoundsChange })
  const map = useMapEvents({
    moveend: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => report.current(map.getBounds()), 300)
    },
    click: () => onSelect(null),
  })
  useEffect(() => {
    report.current(map.getBounds())
    return () => clearTimeout(timer.current)
  }, [map])
  return null
}

const pinIcon = (price: number, active: boolean) => L.divIcon({
  className: '',
  iconSize: [0, 0],
  html: `<div class="price-pin${active ? ' is-active' : ''}">$${price}</div>`,
})

export default function ListingMap({
  listings, hoveredId, selectedId, onSelect, searchAsMove, onSearchAsMoveChange,
  onBoundsChange, fitKey, resultCount, fitTo, docked = false,
}: Props) {
  const pins = useMemo(() => listings.filter(hasCoords), [listings])
  const fitPins = useMemo(() => (fitTo ? fitTo.filter(hasCoords) : pins), [fitTo, pins])
  const selected = pins.find(l => l.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSelect(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedId, onSelect])

  return (
    <div className="relative isolate h-full w-full">
      <MapContainer center={WORLD} zoom={WORLD_ZOOM} keyboard worldCopyJump zoomControl={false} className="h-full w-full">
        <ZoomControl position="topright" />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        <FitController pins={fitPins} fitKey={fitKey} />
        <MapEvents onBoundsChange={onBoundsChange} onSelect={onSelect} />
        {pins.map(l => {
          const active = l.id === hoveredId || l.id === selectedId
          return (
            <Marker key={l.id} position={[l.lat, l.lng]} icon={pinIcon(l.price_per_night, active)}
              zIndexOffset={active ? 1000 : 0} title={`${l.title}, $${l.price_per_night} night`}
              eventHandlers={{ click: () => onSelect(l.id) }} />
          )
        })}
        {selected && !docked && (
          <Popup key={selected.id} position={[selected.lat, selected.lng]} className="map-pin-popup"
            offset={[0, -14]} closeButton={false} autoPanPadding={[24, 24]}
            eventHandlers={{ remove: () => onSelect(null) }}>
            <MapPinCard listing={selected} onClose={() => onSelect(null)} />
          </Popup>
        )}
      </MapContainer>

      <div className="absolute top-4 left-4 z-[1000] rounded-xl bg-white px-4 py-3 text-sm shadow-lg">
        <label className="flex cursor-pointer items-center gap-2 font-semibold">
          <input type="checkbox" checked={searchAsMove} onChange={e => onSearchAsMoveChange(e.target.checked)}
            className="h-4 w-4 accent-neutral-900" />
          Search as I move the map
        </label>
        {searchAsMove && <p className="mt-1 text-gray-600">{resultCount} {resultCount === 1 ? 'stay' : 'stays'} in map area</p>}
      </div>

      {selected && docked && (
        <div className="absolute inset-x-4 bottom-24 z-[1000] flex justify-center">
          <div className="w-full max-w-[420px] overflow-hidden rounded-xl shadow-xl">
            <MapPinCard listing={selected} onClose={() => onSelect(null)} docked />
          </div>
        </div>
      )}
    </div>
  )
}
