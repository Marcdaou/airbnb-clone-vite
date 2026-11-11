import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react'
import type { Listing } from '../lib/types'

type Props = { listing: Listing; wished: boolean; onToggleWish: (id: string) => void; onHover?: (id: string | null) => void }

export default function ListingCard({ listing, wished, onToggleWish, onHover }: Props) {
  const [i, setI] = useState(0)
  const imgs = listing.images?.length ? listing.images : ['']
  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault(); e.stopPropagation()
    setI(p => (p + d + imgs.length) % imgs.length)
  }

  return (
    <Link to={`/rooms/${listing.id}`} className="group block"
      onMouseEnter={() => onHover?.(listing.id)} onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(listing.id)} onBlur={() => onHover?.(null)}>
      <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-gray-200">
        {imgs[i] && <img src={imgs[i]} alt={listing.title} loading="lazy" className="h-full w-full object-cover" />}
        <button aria-label="Save to wishlist"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleWish(listing.id) }}
          className="absolute top-3 right-3 p-1 hover:scale-110 transition">
          <Heart size={24} className={`stroke-white drop-shadow ${wished ? 'fill-brand' : 'fill-black/50'}`} />
        </button>
        {imgs.length > 1 && <>
          {i > 0 && <button aria-label="Previous" onClick={e => go(e, -1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow opacity-0 group-hover:opacity-100 transition"><ChevronLeft size={16} /></button>}
          {i < imgs.length - 1 && <button aria-label="Next" onClick={e => go(e, 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow opacity-0 group-hover:opacity-100 transition"><ChevronRight size={16} /></button>}
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1">
            {imgs.slice(0, 5).map((_, d) => (
              <span key={d} className={`h-1.5 w-1.5 rounded-full ${d === Math.min(i, 4) ? 'bg-white' : 'bg-white/60'}`} />
            ))}
          </div>
        </>}
      </div>
      <div className="mt-3 text-[15px]">
        <div className="flex justify-between gap-2">
          <h3 className="font-semibold truncate">{listing.city}, {listing.country}</h3>
          <span className="flex items-center gap-1 shrink-0"><Star size={14} className="fill-current" />{Number(listing.rating).toFixed(2)}</span>
        </div>
        <p className="text-gray-500">{listing.category}</p>
        <p className="mt-1"><span className="font-semibold">${listing.price_per_night}</span> night</p>
      </div>
    </Link>
  )
}
