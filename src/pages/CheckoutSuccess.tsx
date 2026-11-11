import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Booking } from '../lib/types'

export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const { user, loading: authLoading, openAuth } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!sessionId) { setError('Missing checkout session.'); setLoading(false); return }
    if (!user) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase.functions.invoke('verify-checkout', { body: { session_id: sessionId } })
      .then(async ({ data, error }) => {
        if (cancelled) return
        if (error) {
          let msg = error.message
          try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) msg = b.error } catch { /* ignore */ }
          setError(msg)
        } else setBooking(data.booking)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [authLoading, user, sessionId])

  if (loading || authLoading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand" /> Confirming your payment...
    </div>
  )

  if (!user) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Log in to see your booking</h1>
      <button onClick={openAuth} className="mt-6 rounded-lg bg-brand px-6 py-3 font-semibold text-white">Log in</button>
    </div>
  )

  if (error || !booking) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <XCircle className="mx-auto h-12 w-12 text-red-500" />
      <h1 className="mt-4 text-2xl font-semibold">We couldn't confirm your booking</h1>
      <p className="mt-2 text-gray-600">{error ?? 'Booking not found.'}</p>
      <Link to="/trips" className="mt-6 inline-block rounded-lg border border-gray-900 px-6 py-3 font-semibold">Go to trips</Link>
    </div>
  )

  const l = booking.listing
  const paid = booking.status === 'paid'
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="text-center">
        <CheckCircle2 className={`mx-auto h-14 w-14 ${paid ? 'text-green-600' : 'text-amber-500'}`} />
        <h1 className="mt-4 text-3xl font-semibold">{paid ? 'Your trip is booked!' : 'Payment processing'}</h1>
        <p className="mt-2 text-gray-600">{paid ? 'Pack your bags. A confirmation is on its way.' : "We'll update your trip as soon as payment completes."}</p>
      </div>
      <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        {l?.images?.[0] && <img src={l.images[0]} alt={l.title} className="h-56 w-full object-cover" />}
        <div className="space-y-4 p-6">
          <div>
            <h2 className="text-xl font-semibold">{l?.title}</h2>
            {l && <p className="text-gray-500">{l.city}, {l.country}</p>}
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 text-sm">
            <div><dt className="text-gray-500">Check-in</dt><dd className="font-medium">{format(parseISO(booking.check_in), 'EEE, MMM d, yyyy')}</dd></div>
            <div><dt className="text-gray-500">Checkout</dt><dd className="font-medium">{format(parseISO(booking.check_out), 'EEE, MMM d, yyyy')}</dd></div>
            <div><dt className="text-gray-500">Guests</dt><dd className="font-medium">{booking.guests}</dd></div>
            <div><dt className="text-gray-500">{paid ? 'Total paid' : 'Total'}</dt><dd className="font-medium">${booking.total_price.toLocaleString()} USD</dd></div>
          </dl>
          <Link to="/trips" className="block rounded-lg bg-brand py-3 text-center font-semibold text-white hover:opacity-90">View trips</Link>
        </div>
      </div>
    </div>
  )
}
