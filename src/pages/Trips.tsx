import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Loader2, Luggage } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Booking } from '../lib/types'

const badge: Record<Booking['status'], string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-gray-200 text-gray-700',
}
const label: Record<Booking['status'], string> = { paid: 'Confirmed', pending: 'Payment pending', cancelled: 'Cancelled' }

function TripCard({ b }: { b: Booking }) {
  const l = b.listing
  return (
    <Link to={`/rooms/${b.listing_id}`} className="group flex gap-4 rounded-2xl border border-gray-200 p-3 transition hover:shadow-md">
      <img src={l?.images?.[0]} alt={l?.title} className="h-28 w-28 shrink-0 rounded-xl bg-gray-100 object-cover sm:h-32 sm:w-40" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold group-hover:underline">{l?.title ?? 'Listing'}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge[b.status]}`}>{label[b.status]}</span>
        </div>
        {l && <p className="text-sm text-gray-500">{l.city}, {l.country}</p>}
        <p className="mt-2 text-sm">{format(parseISO(b.check_in), 'MMM d')} – {format(parseISO(b.check_out), 'MMM d, yyyy')}</p>
        <p className="mt-auto text-sm text-gray-600">{b.guests} guest{b.guests > 1 ? 's' : ''} · ${b.total_price.toLocaleString()} total</p>
      </div>
    </Link>
  )
}

export default function Trips() {
  const { user, loading: authLoading, openAuth } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase.from('bookings').select('*, listing:listings(*)').order('check_in', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setBookings((data ?? []) as Booking[])
        setLoading(false)
      })
  }, [user])

  if (authLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>

  if (!user) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <Luggage className="mx-auto h-12 w-12 text-gray-400" />
      <h1 className="mt-4 text-2xl font-semibold">Log in to view your trips</h1>
      <p className="mt-2 text-gray-600">Your upcoming and past reservations will appear here.</p>
      <button onClick={openAuth} className="mt-6 rounded-lg bg-brand px-6 py-3 font-semibold text-white">Log in</button>
    </div>
  )

  const today = format(new Date(), 'yyyy-MM-dd')
  const upcoming = bookings.filter(b => b.check_out >= today && b.status !== 'cancelled')
  const past = bookings.filter(b => !upcoming.includes(b)).reverse()

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Trips</h1>
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
      ) : error ? (
        <p className="mt-8 text-red-600">{error}</p>
      ) : bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold">No trips booked... yet!</h2>
          <p className="mt-1 text-gray-600">Time to dust off your bags and start planning your next adventure.</p>
          <Link to="/" className="mt-6 inline-block rounded-lg border border-gray-900 px-5 py-3 font-semibold">Start searching</Link>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Upcoming</h2>
            {upcoming.length ? <div className="grid gap-4 md:grid-cols-2">{upcoming.map(b => <TripCard key={b.id} b={b} />)}</div>
              : <p className="text-gray-600">No upcoming trips.</p>}
          </section>
          {past.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-semibold">Past</h2>
              <div className="grid gap-4 md:grid-cols-2">{past.map(b => <TripCard key={b.id} b={b} />)}</div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
