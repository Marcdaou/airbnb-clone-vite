import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Loader2, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Listing } from '../lib/types'

export default function Wishlists() {
  const { user, loading: authLoading, openAuth } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase.from('wishlists').select('listing:listings(*)').eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setListings(((data ?? []) as unknown as { listing: Listing | null }[]).map(r => r.listing).filter((l): l is Listing => !!l))
        setLoading(false)
      })
  }, [user])

  const remove = async (id: string) => {
    if (!user) return
    const prev = listings
    setListings(ls => ls.filter(l => l.id !== id))
    const { error } = await supabase.from('wishlists').delete().eq('user_id', user.id).eq('listing_id', id)
    if (error) { setListings(prev); setError(error.message) }
  }

  if (authLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>

  if (!user) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <Heart className="mx-auto h-12 w-12 text-gray-400" />
      <h1 className="mt-4 text-2xl font-semibold">Log in to view your wishlists</h1>
      <p className="mt-2 text-gray-600">Save the places you love and find them here.</p>
      <button onClick={openAuth} className="mt-6 rounded-lg bg-brand px-6 py-3 font-semibold text-white">Log in</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Wishlists</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
      ) : listings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold">No saved places yet</h2>
          <p className="mt-1 text-gray-600">Tap the heart on any listing to save it here.</p>
          <Link to="/" className="mt-6 inline-block rounded-lg border border-gray-900 px-5 py-3 font-semibold">Start exploring</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map(l => (
            <div key={l.id} className="group relative">
              <Link to={`/rooms/${l.id}`}>
                <img src={l.images?.[0]} alt={l.title} className="aspect-square w-full rounded-xl bg-gray-100 object-cover" />
                <div className="mt-3 flex justify-between gap-2">
                  <h3 className="truncate font-semibold">{l.title}</h3>
                  {l.rating > 0 && <span className="flex shrink-0 items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-current" />{Number(l.rating).toFixed(2)}</span>}
                </div>
                <p className="text-gray-500">{l.city}, {l.country}</p>
                <p className="mt-1"><span className="font-semibold">${l.price_per_night}</span> night</p>
              </Link>
              <button onClick={() => remove(l.id)} aria-label="Remove from wishlist"
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow transition hover:scale-110">
                <Heart className="h-5 w-5 fill-brand text-brand" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
