import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/types'
import CategoryBar from '../components/CategoryBar'
import ListingCard from '../components/ListingCard'
import { useWishlist } from '../lib/useWishlist'

export default function Home() {
  const [params, setParams] = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const { ids, toggle } = useWishlist()
  const category = params.get('category')
  const where = params.get('where')?.trim()
  const guests = Number(params.get('guests')) || 0

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

  return (
    <>
      <CategoryBar />
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 py-6">
        {!loading && listings.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-2xl font-semibold">No exact matches</h2>
            <p className="mt-2 text-gray-500">Try changing or removing some of your filters.</p>
            <button onClick={() => setParams({})}
              className="mt-6 rounded-lg border border-gray-900 px-5 py-3 font-semibold hover:bg-gray-50">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
            {loading
              ? Array.from({ length: 10 }).map((_, k) => (
                  <div key={k} className="animate-pulse">
                    <div className="aspect-[20/19] rounded-xl bg-gray-200" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-gray-200" />
                  </div>
                ))
              : listings.map(l => <ListingCard key={l.id} listing={l} wished={ids.has(l.id)} onToggleWish={toggle} />)}
          </div>
        )}
      </div>
    </>
  )
}
