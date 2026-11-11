import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { differenceInCalendarDays, format, isValid, parseISO, startOfToday } from 'date-fns'
import type { Listing } from '../lib/types'
import { computePrice } from '../lib/pricing'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function parse(v: string | null) {
  if (!v) return undefined
  const d = parseISO(v)
  return isValid(d) && d >= startOfToday() ? d : undefined
}

export default function BookingCard({ listing }: { listing: Listing }) {
  const [params] = useSearchParams()
  const { user, openAuth } = useAuth()
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = parse(params.get('checkin'))
    const to = parse(params.get('checkout'))
    return from ? { from, to: to && to > from ? to : undefined } : undefined
  })
  const [showCal, setShowCal] = useState(false)
  const [guests, setGuests] = useState(() => {
    const g = Number(params.get('guests'))
    return g >= 1 && g <= listing.max_guests ? g : 1
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0
  const p = useMemo(() => computePrice(listing.price_per_night, nights), [listing.price_per_night, nights])

  async function reserve() {
    setError(null)
    if (!user) return openAuth()
    if (!range?.from || !range?.to || nights < 1) { setShowCal(true); return setError('Select check-in and check-out dates') }
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { listing_id: listing.id, check_in: format(range.from, 'yyyy-MM-dd'), check_out: format(range.to, 'yyyy-MM-dd'), guests },
      })
      if (error) throw error
      if (!data?.url) throw new Error(data?.error ?? 'Could not start checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setLoading(false)
    }
  }

  const fmt = (d?: Date) => (d ? format(d, 'MMM d, yyyy') : 'Add date')
  return (
    <div className="rounded-2xl border border-gray-200 p-6 shadow-xl">
      <p className="mb-4"><span className="text-2xl font-semibold">${listing.price_per_night}</span> <span className="text-gray-600">night</span></p>
      <div className="rounded-xl border border-gray-400">
        <button type="button" onClick={() => setShowCal((s) => !s)} className="grid w-full grid-cols-2 text-left">
          <div className="border-r border-gray-400 p-3"><div className="text-[10px] font-bold uppercase">Check-in</div><div className="text-sm">{fmt(range?.from)}</div></div>
          <div className="p-3"><div className="text-[10px] font-bold uppercase">Checkout</div><div className="text-sm">{fmt(range?.to)}</div></div>
        </button>
        <label className="block border-t border-gray-400 p-3">
          <div className="text-[10px] font-bold uppercase">Guests</div>
          <select className="w-full bg-transparent text-sm outline-none" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {Array.from({ length: listing.max_guests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
          </select>
        </label>
      </div>
      {showCal && (
        <div className="mt-3 flex flex-col items-center rounded-xl border border-gray-200 p-2">
          <DayPicker mode="range" selected={range} onSelect={setRange} disabled={{ before: startOfToday() }} excludeDisabled />
          <button className="self-end px-2 text-sm font-semibold underline" onClick={() => setRange(undefined)}>Clear dates</button>
        </div>
      )}
      <button onClick={reserve} disabled={loading} className="mt-4 w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {loading ? 'Redirecting...' : 'Reserve'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {nights > 0 && (
        <div className="mt-4 space-y-3 text-gray-700">
          <p className="text-center text-sm">You won't be charged yet</p>
          <Row l={`$${listing.price_per_night} x ${nights} night${nights > 1 ? 's' : ''}`} r={p.subtotal} />
          <Row l="Cleaning fee" r={p.cleaning} />
          <Row l="Service fee" r={p.service} />
          <div className="flex justify-between border-t border-gray-200 pt-4 font-semibold text-gray-900"><span>Total</span><span>${p.total}</span></div>
        </div>
      )}
    </div>
  )
}

function Row({ l, r }: { l: string; r: number }) {
  return <div className="flex justify-between"><span className="underline">{l}</span><span>${r}</span></div>
}
