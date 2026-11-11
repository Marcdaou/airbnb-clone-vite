import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { LatLngBounds } from 'leaflet'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/types'
import CategoryBar from '../components/CategoryBar'
import ListingCard from '../components/ListingCard'
import ListingMap from '../components/ListingMap'
import ViewToggle from '../components/ViewToggle'
import { useWishlist } from '../lib/useWishlist'
import { inBounds } from '../lib/geo'

/** Header (h-20 + 1px border) + CategoryBar height; keep in sync if either changes. */
const TOP_OFFSET = 'top-[160px]'
const MAP_HEIGHT = 'h-[calc(100vh-160px)]'

const MD_QUERY = '(min-width: 768px)'
const subscribeMd = (cb: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(MD_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const getMd = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(MD_QUERY).matches

export default function Home() {
  const [params, setParams] = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const { ids, toggle } = useWishlist()
  const category = params.get('category')
  const where = params.get('where')?.trim()
  const guests = Number(params.get('guests')) || 0
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [bounds, setBounds] = useState<LatLngBounds | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const isDesktop = useSyncExternalStore(subscribeMd, getMd, () => false)

  useEffect(() => {
    let active = true
    setLoading(true)
    let q = supabase.from('listings').select('*')
    if (category) q = q.eq('category', category)
    if (where) {
      const w = where.replace(/[,()%*]/g, ' ')
      q = q.or(`city.ilike.%${w}%,country.ilike.%${w}%,title.ilike.%${w}%`)
    }
    if (guests) q = q.gte('max_guests', guests)
    q.then(({ data }) => {
      if (!active) return
      setListings((data as Listing[]) ?? [])
      setLoading(false)
    })
    return () => { active = false }
  }, [category, where, guests])

  const visible = useMemo(
    () => (searchAsMove && bounds ? listings.filter(l => inBounds(l, bounds)) : listings),
    [listings, searchAsMove, bounds],
  )
  // Selection is dropped when the selected listing leaves the visible set (filter change or area filter).
  const activeSelectedId = selectedId && visible.some(l => l.id === selectedId) ? selectedId : null
  const fitKey = `${category}|${where}|${guests}|${loading}`
  const onBoundsChange = useCallback((b: LatLngBounds) => setBounds(b), [])
  const areaEmpty = !loading && searchAsMove && listings.length > 0 && visible.length === 0

  const map = (docked: boolean) => (
    <ListingMap listings={loading ? [] : visible} hoveredId={hoveredId} selectedId={activeSelectedId}
      onSelect={setSelectedId} searchAsMove={searchAsMove} onSearchAsMoveChange={setSearchAsMove}
      onBoundsChange={onBoundsChange} fitKey={fitKey} fitTo={listings} resultCount={visible.length} docked={docked} />
  )

  return (
    <>
      <CategoryBar />
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_42%]">
        <div className={`px-6 md:px-10 py-6 ${!isDesktop && mobileView === 'map' ? 'hidden' : ''}`}>
          {!loading && listings.length === 0 ? (
            <div className="py-24 text-center">
              <h2 className="text-2xl font-semibold">No exact matches</h2>
              <p className="mt-2 text-gray-500">Try changing or removing some of your filters.</p>
              <button onClick={() => setParams({})}
                className="mt-6 rounded-lg border border-gray-900 px-5 py-3 font-semibold hover:bg-gray-50">Clear filters</button>
            </div>
          ) : areaEmpty ? (
            <div className="py-24 text-center">
              <h2 className="text-2xl font-semibold">No stays in this map area</h2>
              <p className="mt-2 text-gray-500">Zoom out or move the map to see more stays.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
              {loading
                ? Array.from({ length: 10 }).map((_, k) => (
                    <div key={k} className="animate-pulse">
                      <div className="aspect-[20/19] rounded-xl bg-gray-200" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
                      <div className="mt-2 h-4 w-1/3 rounded bg-gray-200" />
                    </div>
                  ))
                : visible.map(l => <ListingCard key={l.id} listing={l} wished={ids.has(l.id)} onToggleWish={toggle} onHover={setHoveredId} />)}
            </div>
          )}
        </div>
        {isDesktop && (
          <div className={`sticky ${TOP_OFFSET} ${MAP_HEIGHT}`}>{map(false)}</div>
        )}
      </div>
      {!isDesktop && mobileView === 'map' && (
        <div className={`fixed inset-x-0 bottom-0 ${TOP_OFFSET} z-20`}>{map(true)}</div>
      )}
      {!isDesktop && <ViewToggle view={mobileView} onChange={setMobileView} />}
    </>
  )
}
