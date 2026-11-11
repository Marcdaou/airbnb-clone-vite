import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'Payments are not configured yet' }, 500)

    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''))
    if (!user) return json({ error: 'Unauthorized' }, 401)

    let body: Record<string, unknown>
    try { body = await req.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }
    const { listing_id, check_in, check_out } = body
    const guests = Number(body.guests)
    if (typeof listing_id !== 'string' || !listing_id) return json({ error: 'listing_id is required' }, 400)
    if (typeof check_in !== 'string' || typeof check_out !== 'string' || !DATE_RE.test(check_in) || !DATE_RE.test(check_out))
      return json({ error: 'check_in and check_out must be YYYY-MM-DD' }, 400)
    if (!Number.isInteger(guests) || guests < 1) return json({ error: 'guests must be a positive integer' }, 400)

    const inDate = new Date(check_in + 'T00:00:00Z')
    const outDate = new Date(check_out + 'T00:00:00Z')
    if (isNaN(+inDate) || isNaN(+outDate)) return json({ error: 'Invalid dates' }, 400)
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
    if (inDate < today) return json({ error: 'Check-in must be today or later' }, 400)
    const nights = Math.round((+outDate - +inDate) / 86400000)
    if (nights < 1) return json({ error: 'Check-out must be after check-in' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: listing, error: lErr } = await admin.from('listings').select('*').eq('id', listing_id).maybeSingle()
    if (lErr) return json({ error: lErr.message }, 500)
    if (!listing) return json({ error: 'Listing not found' }, 404)
    if (guests > listing.max_guests) return json({ error: `This place allows at most ${listing.max_guests} guests` }, 400)

    const price = Number(listing.price_per_night)
    const subtotal = nights * price
    const total = subtotal + Math.round(price * 0.15) + Math.round(subtotal * 0.12)

    const { data: booking, error: bErr } = await admin.from('bookings').insert({
      user_id: user.id, listing_id, check_in, check_out, guests, total_price: total, status: 'pending',
    }).select().single()
    if (bErr) return json({ error: bErr.message }, 500)

    const origin = req.headers.get('Origin') ?? 'http://localhost:5173'
    const stripe = new Stripe(stripeKey)
    const image = Array.isArray(listing.images) ? listing.images[0] : undefined
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: total * 100,
          product_data: {
            name: listing.title,
            description: `${check_in} to ${check_out} · ${nights} night${nights > 1 ? 's' : ''} · ${guests} guest${guests > 1 ? 's' : ''}`,
            ...(image ? { images: [image] } : {}),
          },
        },
      }],
      metadata: { booking_id: booking.id },
      customer_email: user.email ?? undefined,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?booking_id=${booking.id}`,
    })

    await admin.from('bookings').update({ stripe_session_id: session.id }).eq('id', booking.id)
    return json({ url: session.url })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
