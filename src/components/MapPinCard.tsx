import { Link } from 'react-router-dom'
import { Star, X } from 'lucide-react'
import type { Listing } from '../lib/types'

type Props = { listing: Listing; onClose: () => void }

export default function MapPinCard({ listing, onClose }: Props) {
  const img = listing.images?.[0]
  return (
    <div className="relative w-[280px] overflow-hidden rounded-xl bg-white text-neutral-900">
      <Link to={`/rooms/${listing.id}`} className="block !text-inherit no-underline">
        <div className="aspect-[20/19] bg-gray-200">
          {img && <img src={img} alt={listing.title} className="h-full w-full object-cover" />}
        </div>
        <div className="p-3 text-[15px]">
          <div className="flex justify-between gap-2">
            <h3 className="truncate font-semibold">{listing.city}, {listing.country}</h3>
            <span className="flex shrink-0 items-center gap-1"><Star size={14} className="fill-current" />{Number(listing.rating).toFixed(2)}</span>
          </div>
          <p className="truncate text-gray-500">{listing.title}</p>
          <p className="mt-1"><span className="font-semibold">${listing.price_per_night}</span> night</p>
        </div>
      </Link>
      <button type="button" aria-label="Close"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onClose() }}
        className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow hover:scale-105 transition">
        <X size={14} />
      </button>
    </div>
  )
}
