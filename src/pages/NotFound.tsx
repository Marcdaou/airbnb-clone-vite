import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-8xl font-bold text-brand">404</p>
      <Compass className="mt-6 h-10 w-10 text-gray-400" />
      <h1 className="mt-4 text-2xl font-semibold">We can't seem to find that page</h1>
      <p className="mt-2 text-gray-600">It may have moved, or the link might be broken. Let's get you back on track.</p>
      <Link to="/" className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:opacity-90">Go home</Link>
    </div>
  )
}
