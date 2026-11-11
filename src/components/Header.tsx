import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { format, parseISO } from 'date-fns'
import { Menu, Minus, Plus, Search, User as UserIcon, Tent } from 'lucide-react'
import { useAuth } from '../lib/auth'

const fmt = (d?: Date) => (d ? format(d, 'MMM d') : '')

export default function Header() {
  const { user, openAuth, signOut } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [where, setWhere] = useState(params.get('where') ?? '')
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const ci = params.get('checkin'), co = params.get('checkout')
    return ci ? { from: parseISO(ci), to: co ? parseISO(co) : undefined } : undefined
  })
  const [guests, setGuests] = useState(Number(params.get('guests')) || 1)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const search = () => {
    const q = new URLSearchParams()
    const cat = params.get('category')
    if (cat) q.set('category', cat)
    if (where.trim()) q.set('where', where.trim())
    if (range?.from) q.set('checkin', format(range.from, 'yyyy-MM-dd'))
    if (range?.to) q.set('checkout', format(range.to, 'yyyy-MM-dd'))
    if (guests > 1) q.set('guests', String(guests))
    setOpen(false)
    navigate(`/?${q}`)
  }

  const dates = range?.from ? `${fmt(range.from)}${range.to ? ` – ${fmt(range.to)}` : ''}` : 'Any week'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-[1760px] mx-auto h-20 px-6 md:px-10 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-1.5 text-brand shrink-0">
          <Tent size={30} strokeWidth={2.2} />
          <span className="hidden lg:inline text-xl font-bold tracking-tight">Airbnb Clone</span>
        </Link>

        <div ref={panelRef} className="relative flex-1 md:flex-none flex justify-center">
          <button onClick={() => setOpen(o => !o)}
            className="w-full md:w-auto flex items-center rounded-full border border-gray-200 shadow-sm hover:shadow-md transition pl-5 pr-2 py-2 text-sm">
            <span className="md:hidden flex-1 text-left font-semibold">{where || 'Where to?'}<span className="block text-xs font-normal text-gray-500">{dates} · {guests} guest{guests > 1 ? 's' : ''}</span></span>
            <span className="hidden md:inline font-semibold px-3">{where || 'Anywhere'}</span>
            <span className="hidden md:inline border-l border-gray-300 px-4 font-semibold">{dates}</span>
            <span className="hidden md:inline border-l border-gray-300 px-4 text-gray-500">{guests > 1 ? `${guests} guests` : 'Add guests'}</span>
            <span className="ml-2 rounded-full bg-brand p-2 text-white"><Search size={14} strokeWidth={3} /></span>
          </button>

          {open && (
            <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[min(92vw,720px)] rounded-3xl bg-white shadow-2xl border border-gray-100 p-6 z-50">
              <label className="block text-xs font-semibold">Where</label>
              <input autoFocus value={where} onChange={e => setWhere(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()} placeholder="Search destinations"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-900" />
              <div className="mt-5 flex flex-col md:flex-row gap-6">
                <div>
                  <p className="text-xs font-semibold mb-2">Check in – Check out</p>
                  <DayPicker mode="range" selected={range} onSelect={setRange}
                    disabled={{ before: new Date() }} numberOfMonths={1}
                    style={{ '--rdp-accent-color': 'var(--color-brand)', '--rdp-accent-background-color': '#ffe4ea' } as React.CSSProperties} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-2">Who</p>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <div><p className="font-semibold">Guests</p><p className="text-sm text-gray-500">Ages 13 or above</p></div>
                    <div className="flex items-center gap-3">
                      <button aria-label="Fewer guests" disabled={guests <= 1} onClick={() => setGuests(g => g - 1)}
                        className="rounded-full border border-gray-300 p-1.5 disabled:opacity-30"><Minus size={14} /></button>
                      <span className="w-5 text-center">{guests}</span>
                      <button aria-label="More guests" disabled={guests >= 16} onClick={() => setGuests(g => g + 1)}
                        className="rounded-full border border-gray-300 p-1.5 disabled:opacity-30"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <button onClick={() => { setWhere(''); setRange(undefined); setGuests(1) }} className="text-sm font-semibold underline">Clear all</button>
                    <button onClick={search} className="flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-dark px-6 py-3 font-semibold text-white">
                      <Search size={16} /> Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button onClick={() => setMenu(m => !m)} aria-label="User menu"
            className="flex items-center gap-3 rounded-full border border-gray-200 py-1.5 pl-3 pr-1.5 hover:shadow-md transition">
            <Menu size={16} />
            <span className="h-8 w-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-semibold">
              {user?.email ? user.email[0].toUpperCase() : <UserIcon size={18} />}
            </span>
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-2 text-sm z-50"
              onClick={() => setMenu(false)}>
              {user ? <>
                <Link to="/trips" className="block px-4 py-3 font-semibold hover:bg-gray-50">Trips</Link>
                <Link to="/wishlists" className="block px-4 py-3 font-semibold hover:bg-gray-50">Wishlists</Link>
                <hr className="my-2 border-gray-200" />
                <button onClick={() => signOut()} className="w-full text-left px-4 py-3 hover:bg-gray-50">Log out</button>
              </> : <>
                <button onClick={openAuth} className="w-full text-left px-4 py-3 font-semibold hover:bg-gray-50">Log in</button>
                <button onClick={openAuth} className="w-full text-left px-4 py-3 hover:bg-gray-50">Sign up</button>
              </>}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
