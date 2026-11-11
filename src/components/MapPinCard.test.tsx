import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MapPinCard from './MapPinCard'
import ViewToggle from './ViewToggle'
import { mk } from '../test/mocks'

describe('MapPinCard', () => {
  it('R6/E8: long titles truncate to one line, photo uses 20/19 aspect, 5-digit price renders', () => {
    const l = mk({ id: 'x', title: 'A'.repeat(200), price_per_night: 12345 })
    render(<MemoryRouter><MapPinCard listing={l} onClose={() => {}} /></MemoryRouter>)
    expect(screen.getByText('A'.repeat(200))).toHaveClass('truncate')
    expect(screen.getByRole('img').parentElement).toHaveClass('aspect-[20/19]')
    expect(screen.getByText('$12345')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/rooms/x')
  })

  it('R6: close button calls onClose without following the link', () => {
    const onClose = vi.fn()
    render(<MemoryRouter><MapPinCard listing={mk({ id: 'y' })} onClose={onClose} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ViewToggle', () => {
  it('R8: shows "Map" in list view and "List" in map view, hidden at md+', () => {
    const onChange = vi.fn()
    const { rerender } = render(<ViewToggle view="list" onChange={onChange} />)
    const btn = screen.getByRole('button', { name: 'Map' })
    expect(btn).toHaveClass('md:hidden', 'bottom-6', 'left-1/2')
    expect(btn.querySelector('svg')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onChange).toHaveBeenCalledWith('map')
    rerender(<ViewToggle view="map" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(onChange).toHaveBeenLastCalledWith('list')
  })
})
