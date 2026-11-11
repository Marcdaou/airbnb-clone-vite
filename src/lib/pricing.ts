export function computePrice(pricePerNight: number, nights: number) {
  const n = Math.max(0, nights)
  const subtotal = pricePerNight * n
  const cleaning = n > 0 ? Math.round(pricePerNight * 0.15) : 0
  const service = Math.round(subtotal * 0.12)
  return { nights: n, subtotal, cleaning, service, total: subtotal + cleaning + service }
}
