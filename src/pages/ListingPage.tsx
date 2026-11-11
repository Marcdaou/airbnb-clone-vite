import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Star, Share, Heart, Grid3x3, X, Check, Wifi, Car, Waves, Utensils, Tv, Wind, Flame, WashingMachine,
  Dumbbell, Coffee, Mountain, Laptop, PawPrint, Bath, Snowflake, TreePine, ShieldCheck, type LucideIcon,
} from 'lucide-react'
import { hasCoords } from '../lib/geo'
import type { Listing, Review } from '../lib/types'
import { supabase } from '../lib/supabase'
import BookingCard from '../components/BookingCard'
import { useWishlist } from '../lib/useWishlist'

const ICONS: [string, LucideIcon][] = [
  ['wifi', Wifi], ['parking', Car], ['pool', Waves], ['kitchen', Utensils], ['tv', Tv],
  ['air', Snowflake], ['fan', Wind], ['heating', Flame], ['fireplace', Flame], ['wash', WashingMachine], ['dryer', WashingMachine],
  ['gym', Dumbbell], ['coffee', Coffee], ['view', Mountain], ['workspace', Laptop], ['pet', PawPrint],
  ['tub', Bath], ['bath', Bath], ['garden', TreePine], ['bbq', Flame], ['grill', Flame], ['beach', Waves], ['smoke', ShieldCheck],
]
const iconFor = (a: string) => ICONS.find(([k]) => a.toLowerCase().includes(k))?.[1] ?? Check

export default function ListingPage() {
  const { id } = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const wish = useWishlist()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      supabase.from('listings').select('*').eq('id', id).maybeSingle(),
      supabase.from('reviews').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
    ]).then(([l, r]) => {
      setListing((l.data as Listing) ?? null)
      setReviews((r.data as Review[]) ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="mx-auto max-w-6xl animate-pulse px-6 py-8"><div className="mb-6 h-8 w-1/2 rounded bg-gray-200" /><div className="h-[420px] rounded-2xl bg-gray-200" /></div>
  if (!listing) return <div className="py-24 text-center text-lg">Listing not found.</div>

  const imgs = listing.images ?? []
  const d = 0.01
  const bbox = hasCoords(listing) ? `${listing.lng - d},${listing.lat - d},${listing.lng + d},${listing.lat + d}` : null
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : listing.rating
  const s = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <h1 className="text-2xl font-semibold md:text-3xl">{listing.title}</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-1 font-medium">
          <Star size={14} className="fill-current" /> {Number(listing.rating).toFixed(2)} · <span className="underline">{s(listing.review_count, 'review')}</span> · <span className="underline">{listing.city}, {listing.country}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="flex items-center gap-1 rounded-lg px-3 py-2 underline hover:bg-gray-100"><Share size={16} /> Share</button>
          <button onClick={() => listing && wish.toggle(listing.id)} className="flex items-center gap-1 rounded-lg px-3 py-2 underline hover:bg-gray-100"><Heart size={16} className={listing && wish.ids.has(listing.id) ? 'fill-brand text-brand' : ''} /> Save</button>
        </div>
      </div>

      <div className="relative mt-6 grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:h-[440px]">
        {imgs.slice(0, 5).map((src, i) => (
          <img key={i} src={src} alt="" onClick={() => setShowAll(true)}
            className={`h-full w-full cursor-pointer object-cover hover:brightness-90 ${i === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block'}`} />
        ))}
        <button onClick={() => setShowAll(true)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-gray-900 bg-white px-4 py-1.5 text-sm font-semibold">
          <Grid3x3 size={16} /> Show all photos
        </button>
      </div>

      {showAll && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <div className="sticky top-0 flex bg-white p-4"><button onClick={() => setShowAll(false)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close"><X /></button></div>
          <div className="mx-auto max-w-3xl space-y-3 px-4 pb-12">{imgs.map((src, i) => <img key={i} src={src} alt="" className="w-full rounded-lg" />)}</div>
        </div>
      )}

      <div className="mt-10 grid gap-16 md:grid-cols-[1fr_380px]">
        <div>
          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-xl font-semibold">Entire home hosted by {listing.host_name}</h2>
              <p className="text-gray-600">{s(listing.max_guests, 'guest')} · {s(listing.bedrooms, 'bedroom')} · {s(listing.beds, 'bed')} · {s(listing.baths, 'bath')}</p>
            </div>
            <img src={listing.host_avatar} alt={listing.host_name} className="h-14 w-14 rounded-full object-cover" />
          </div>
          <p className="whitespace-pre-line border-b border-gray-200 py-8 leading-relaxed text-gray-800">{listing.description}</p>
          <section className="border-b border-gray-200 py-8">
            <h3 className="mb-4 text-xl font-semibold">What this place offers</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {listing.amenities.map((a) => { const I = iconFor(a); return <div key={a} className="flex items-center gap-4"><I size={22} strokeWidth={1.5} />{a}</div> })}
            </div>
          </section>
        </div>
        <div><div className="sticky top-28"><BookingCard listing={listing} /></div></div>
      </div>

      <section className="border-b border-gray-200 py-10">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold"><Star size={18} className="fill-current" /> {Number(avg).toFixed(2)} · {s(reviews.length, 'review')}</h3>
        <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id}>
              <div className="mb-2 flex items-center gap-3">
                {r.author_avatar ? <img src={r.author_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 font-semibold text-white">{r.author_name[0]}</div>}
                <div><p className="font-semibold">{r.author_name}</p><p className="text-sm text-gray-500">{format(new Date(r.created_at), 'MMMM yyyy')}</p></div>
              </div>
              <div className="mb-1 flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={10} className={i < r.rating ? 'fill-current' : 'text-gray-300'} />)}</div>
              <p className="text-gray-800">{r.comment}</p>
            </div>
          ))}
          {!reviews.length && <p className="text-gray-600">No reviews yet.</p>}
        </div>
      </section>

      <section className="py-10">
        <h3 className="mb-2 text-xl font-semibold">Where you'll be</h3>
        <p className="mb-4 text-gray-700">{listing.city}, {listing.country}</p>
        {bbox && <iframe title="map" className="h-[400px] w-full rounded-2xl border-0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${listing.lat},${listing.lng}`} />}
      </section>
    </div>
  )
}
