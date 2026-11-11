import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import L from 'leaflet'
import Home from './Home'
import { db, fakeMap, mapState, mk, setViewport } from '../test/mocks'

vi.mock('react-leaflet', async () => (await import('../test/mocks')).reactLeafletMock)
vi.mock('../lib/supabase', async () => ({ supabase: { from: (await import('../test/mocks')).fromMock } }))
vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: null, openAuth: vi.fn() }) }))

const PARIS = mk({ id: 'paris', title: 'Paris loft', city: 'Paris', country: 'France', lat: 48.85, lng: 2.35, price_per_night: 180, category: 'Beachfront', max_guests: 2 })
const LONDON = mk({ id: 'london', title: 'London flat', city: 'London', country: 'UK', lat: 51.5, lng: -0.12, price_per_night: 250, category: 'Cabins', max_guests: 6 })
const LISBON = mk({ id: 'lisbon', title: 'Lisbon house', city: 'Lisbon', country: 'Portugal', lat: 38.7, lng: -9.1, price_per_night: 120, category: 'Beachfront', max_guests: 6 })
const NOGEO = mk({ id: 'nogeo', title: 'Mystery cabin', city: 'Nowhere', country: 'Unknown', lat: null, lng: null, price_per_night: 99, category: 'Beachfront', max_guests: 6 })
const ALL = [PARIS, LONDON, LISBON, NOGEO]

const where = { search: '' }
function Loc() { const s = useLocation().search; useEffect(() => { where.search = s }); return null }

function renderHome(url = '/') {
  return render(<MemoryRouter initialEntries={[url]}><Home /><Loc /></MemoryRouter>)
}
const cards = () => screen.queryAllByRole('link').filter(a => /^\/rooms\//.test(a.getAttribute('href') ?? '') && !a.closest('[data-testid="popup"]'))
const pins = () => screen.queryAllByTestId('pin')
const pinFor = (price: number) => pins().find(p => p.textContent === `$${price}`)!
const isActive = (el: HTMLElement) => el.querySelector('.price-pin')!.classList.contains('is-active')
const settle = async () => { await screen.findAllByText(/night/) }

async function moveMapTo(b: L.LatLngBounds) {
  mapState.bounds = b
  act(() => mapState.handlers.moveend())
  await act(() => new Promise(r => setTimeout(r, 350)))
}

beforeEach(() => {
  db.listings = ALL; db.calls = []; db.hold = false
  mapState.bounds = L.latLngBounds([-90, -180], [90, 180])
  vi.clearAllMocks()
  setViewport(1280)
})

describe('Home split view (desktop)', () => {
  it('R1: at md and up renders the list column and a sticky map column side by side', async () => {
    const { container } = renderHome(); await settle()
    expect(container.querySelector('.md\\:grid-cols-\\[minmax\\(0\\,1fr\\)_42\\%\\]')).toBeInTheDocument()
    const map = screen.getByTestId('map')
    expect(map.closest('.sticky')).toBeInTheDocument()
    expect(cards()).toHaveLength(4)
    expect(screen.queryByRole('button', { name: /^(Map|List)$/ })).not.toBeInTheDocument()
  })

  it('R2: uses OpenStreetMap tiles with the OSM attribution and no API key', async () => {
    renderHome(); await settle()
    expect(mapState.tile!.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(mapState.tile!.attribution).toMatch(/OpenStreetMap/)
    expect(mapState.tile!.attribution).toContain('https://www.openstreetmap.org/copyright')
  })

  it('R3: renders one price pin per listing with coords, showing $price', async () => {
    renderHome(); await settle()
    expect(pins().map(p => p.textContent).sort()).toEqual(['$120', '$180', '$250'])
    expect(pins()[0].querySelector('.price-pin')).toBeInTheDocument()
  })

  it.each([
    ['/?category=Beachfront', ['$120', '$180'], 3],
    ['/?category=Cabins', ['$250'], 1],
    ['/?guests=5', ['$120', '$250'], 3],
    ['/?where=paris', ['$180'], 1],
  ])('R3: pins follow the same filtered results as the grid (%s)', async (url, expected, cardCount) => {
    renderHome(url); await settle()
    expect(cards()).toHaveLength(cardCount)
    expect(pins().map(p => p.textContent).sort()).toEqual(expected)
  })

  it('R3: pins update when a category is clicked', async () => {
    renderHome(); await settle()
    expect(pins()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Cabins' }))
    await waitFor(() => expect(pins().map(p => p.textContent)).toEqual(['$250']))
  })

  it('R4: on load fits bounds to all pins with padding 48 and maxZoom 13', async () => {
    renderHome(); await settle()
    await waitFor(() => expect(fakeMap.fitBounds).toHaveBeenCalled())
    const [b, opts] = fakeMap.fitBounds.mock.calls.at(-1)!
    expect(opts).toEqual({ padding: [48, 48], maxZoom: 13 })
    for (const l of [PARIS, LONDON, LISBON]) expect(b.contains([l.lat!, l.lng!])).toBe(true)
    expect(b.getSouth()).toBeCloseTo(38.7); expect(b.getNorth()).toBeCloseTo(51.5)
  })

  it('R4: refits after a filter change', async () => {
    renderHome(); await settle()
    fakeMap.fitBounds.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Cabins' }))
    await waitFor(() => expect(pins().map(p => p.textContent)).toEqual(['$250']))
    await act(() => new Promise(r => setTimeout(r, 50)))
    expect(fakeMap.fitBounds).toHaveBeenCalled()
    const [b] = fakeMap.fitBounds.mock.calls.at(-1)!
    expect(b.getNorth()).toBeCloseTo(51.5); expect(b.getSouth()).toBeCloseTo(51.5)
  })

  it('R4: does not refit when results change because of search-as-move', async () => {
    renderHome(); await settle()
    fakeMap.fitBounds.mockClear(); fakeMap.setView.mockClear()
    fireEvent.click(screen.getByRole('checkbox', { name: /Search as I move the map/ }))
    await moveMapTo(L.latLngBounds([45, -5], [55, 5]))
    expect(cards()).toHaveLength(2)
    expect(fakeMap.fitBounds).not.toHaveBeenCalled()
    expect(fakeMap.setView).not.toHaveBeenCalled()
  })

  it('R4/E3: with no pins (all listings lack coords) shows default world view, cards still listed', async () => {
    db.listings = [NOGEO, mk({ id: 'n2', lat: null, lng: 5 })]
    renderHome(); await settle()
    await waitFor(() => expect(fakeMap.setView).toHaveBeenCalledWith([20, 0], 2))
    expect(fakeMap.fitBounds).not.toHaveBeenCalled()
    expect(pins()).toHaveLength(0)
    expect(cards()).toHaveLength(2)
  })

  it('R5: hovering a card highlights its pin and leaving clears it', async () => {
    renderHome(); await settle()
    const card = cards().find(a => a.getAttribute('href') === '/rooms/paris')!
    expect(isActive(pinFor(180))).toBe(false)
    fireEvent.mouseEnter(card)
    expect(isActive(pinFor(180))).toBe(true)
    expect(pinFor(180).dataset.z).toBe('1000')
    expect(isActive(pinFor(250))).toBe(false)
    fireEvent.mouseLeave(card)
    expect(isActive(pinFor(180))).toBe(false)
  })

  it('R5/E10: keyboard focus on a card highlights its pin; blur clears it', async () => {
    renderHome(); await settle()
    const card = cards().find(a => a.getAttribute('href') === '/rooms/london')!
    fireEvent.focus(card)
    expect(isActive(pinFor(250))).toBe(true)
    fireEvent.blur(card)
    expect(isActive(pinFor(250))).toBe(false)
  })

  it('R6: clicking a pin opens a mini card linking to /rooms/:id with photo, place, title, rating, price', async () => {
    renderHome(); await settle()
    fireEvent.click(pinFor(180))
    const popup = screen.getByTestId('popup')
    const link = within(popup).getByRole('link')
    expect(link).toHaveAttribute('href', '/rooms/paris')
    expect(within(popup).getByRole('img')).toHaveAttribute('src', 'https://img/paris.jpg')
    expect(within(popup).getByText('Paris, France')).toBeInTheDocument()
    expect(within(popup).getByText('Paris loft')).toHaveClass('truncate')
    expect(within(popup).getByText('4.90')).toBeInTheDocument()
    expect(within(popup).getByText('$180')).toBeInTheDocument()
    expect(isActive(pinFor(180))).toBe(true)
  })

  it('R6: the close button closes the mini card', async () => {
    renderHome(); await settle()
    fireEvent.click(pinFor(180))
    fireEvent.click(within(screen.getByTestId('popup')).getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
    expect(isActive(pinFor(180))).toBe(false)
  })

  it('R6/E10: Escape closes the mini card', async () => {
    renderHome(); await settle()
    fireEvent.click(pinFor(250))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
  })

  it('R6: a map click closes the mini card', async () => {
    renderHome(); await settle()
    fireEvent.click(pinFor(250))
    act(() => mapState.handlers.click())
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
  })

  it('R7: "Search as I move the map" is unchecked by default and moving the map does not change results', async () => {
    renderHome(); await settle()
    const box = screen.getByRole('checkbox', { name: /Search as I move the map/ })
    expect(box).not.toBeChecked()
    await moveMapTo(L.latLngBounds([45, -5], [55, 5]))
    expect(cards()).toHaveLength(4)
    expect(pins()).toHaveLength(3)
    expect(screen.queryByText(/in map area/)).not.toBeInTheDocument()
  })

  it('R7: when checked, list and pins are limited to the map area after a debounced moveend, with a count line', async () => {
    renderHome(); await settle()
    fireEvent.click(screen.getByRole('checkbox', { name: /Search as I move the map/ }))
    mapState.bounds = L.latLngBounds([45, -5], [55, 5])
    act(() => mapState.handlers.moveend())
    await act(() => new Promise(r => setTimeout(r, 100)))
    expect(pins()).toHaveLength(3) // still debouncing
    await act(() => new Promise(r => setTimeout(r, 300)))
    expect(cards().map(a => a.getAttribute('href')).sort()).toEqual(['/rooms/london', '/rooms/paris'])
    expect(pins().map(p => p.textContent).sort()).toEqual(['$180', '$250'])
    expect(screen.getByText('2 stays in map area')).toBeInTheDocument()
  })

  it('R7/E4: unchecking restores the full filtered set, including listings without coords', async () => {
    renderHome(); await settle()
    const box = screen.getByRole('checkbox', { name: /Search as I move the map/ })
    fireEvent.click(box)
    await moveMapTo(L.latLngBounds([-90, -180], [90, 180]))
    expect(screen.queryByText('Mystery cabin')).not.toBeInTheDocument() // E4: no coords, not in area
    expect(cards()).toHaveLength(3)
    fireEvent.click(box)
    expect(cards()).toHaveLength(4)
    expect(screen.getByText('Nowhere, Unknown')).toBeInTheDocument()
  })

  it('R7/E4: no stays in the area shows the map-area message, not the filter empty state', async () => {
    renderHome(); await settle()
    fireEvent.click(screen.getByRole('checkbox', { name: /Search as I move the map/ }))
    await moveMapTo(L.latLngBounds([-50, 100], [-40, 110]))
    expect(screen.getByText('No stays in this map area')).toBeInTheDocument()
    expect(screen.queryByText('No exact matches')).not.toBeInTheDocument()
    expect(screen.getByText('0 stays in map area')).toBeInTheDocument()
  })

  it('R9: a listing without coords appears in the grid but gets no pin', async () => {
    renderHome(); await settle()
    expect(screen.getByText('Nowhere, Unknown')).toBeInTheDocument()
    expect(pins().some(p => p.textContent === '$99')).toBe(false)
    const [b] = fakeMap.fitBounds.mock.calls.at(-1)!
    expect(b.isValid()).toBe(true) // fit computed from coords only, null not coerced to 0
    expect(b.getEast()).toBeCloseTo(2.35); expect(b.getSouth()).toBeCloseTo(38.7)
  })

  it('R10: shows 10 loading skeletons and no pins while loading (E1)', async () => {
    db.hold = true
    const { container } = renderHome()
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(10)
    expect(pins()).toHaveLength(0)
    expect(fakeMap.fitBounds).not.toHaveBeenCalled()
    expect(fakeMap.setView).not.toHaveBeenCalled()
  })

  it('R10: list grid uses 1/2/3 columns in split view', async () => {
    const { container } = renderHome(); await settle()
    expect(container.querySelector('.grid-cols-1.sm\\:grid-cols-2.xl\\:grid-cols-3')).toBeInTheDocument()
  })

  it('R10/E2: empty results show "No exact matches" + Clear filters, map visible without pins; Clear resets params', async () => {
    renderHome('/?category=Design')
    expect(await screen.findByText('No exact matches')).toBeInTheDocument()
    expect(screen.getByTestId('map')).toBeInTheDocument()
    expect(pins()).toHaveLength(0)
    fakeMap.fitBounds.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(cards()).toHaveLength(4))
    expect(where.search).toBe('')
    await waitFor(() => expect(fakeMap.fitBounds).toHaveBeenCalled())
  })

  it('R10: still issues the single listings query with the filters', async () => {
    renderHome('/?category=Cabins&guests=3'); await settle()
    expect(db.calls.filter(t => t === 'listings')).toHaveLength(1)
  })
})

describe('Home mobile (<768px)', () => {
  beforeEach(() => setViewport(390))

  it('R8: defaults to list view with a "Map" toggle and no map', async () => {
    renderHome(); await settle()
    expect(cards()).toHaveLength(4)
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Map' })).toHaveClass('bg-neutral-900', 'text-white', 'fixed')
  })

  it('R8: toggling switches to a full-screen map and back, without changing URL params or refetching', async () => {
    renderHome('/?category=Beachfront'); await settle()
    const before = where.search
    const calls = db.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Map' }))
    const map = screen.getByTestId('map')
    expect(map.closest('.fixed')).toBeInTheDocument()
    expect(pins()).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument()
    expect(where.search).toBe(before)
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
    expect(cards()).toHaveLength(3)
    expect(where.search).toBe(before)
    expect(db.calls.length).toBe(calls)
  })

  it('R6/E9: on mobile the mini card docks at the bottom of the map instead of a popup', async () => {
    renderHome(); await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Map' }))
    fireEvent.click(pinFor(180))
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
    const mapView = screen.getByTestId('map').parentElement!
    const link = within(mapView).getByRole('link')
    expect(link).toHaveAttribute('href', '/rooms/paris')
    expect(link.closest('.bottom-24')).toBeInTheDocument()
    fireEvent.click(within(mapView).getByRole('button', { name: 'Close' }))
    expect(within(mapView).queryByRole('link')).not.toBeInTheDocument()
  })

  it('R7: search-as-move control is also available on the mobile map view', async () => {
    renderHome(); await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Map' }))
    expect(screen.getByRole('checkbox', { name: /Search as I move the map/ })).not.toBeChecked()
  })
})
