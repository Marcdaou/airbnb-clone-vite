export type Listing = {
  id: string
  title: string
  description: string
  city: string
  country: string
  category: string
  price_per_night: number
  max_guests: number
  bedrooms: number
  beds: number
  baths: number
  images: string[]
  amenities: string[]
  rating: number
  review_count: number
  host_name: string
  host_avatar: string
  lat: number
  lng: number
}

export type Review = {
  id: string
  listing_id: string
  author_name: string
  author_avatar: string | null
  rating: number
  comment: string
  created_at: string
}

export type Booking = {
  id: string
  user_id: string
  listing_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'paid' | 'cancelled'
  stripe_session_id: string | null
  created_at: string
  listing?: Listing
}

export const CATEGORIES = [
  'Beachfront', 'Cabins', 'Amazing pools', 'Countryside',
  'Tiny homes', 'Trending', 'Lakefront', 'Design',
] as const
