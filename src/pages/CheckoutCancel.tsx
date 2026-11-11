import { Link, useNavigate } from 'react-router-dom'
import { CircleSlash } from 'lucide-react'

export default function CheckoutCancel() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <CircleSlash className="h-12 w-12 text-gray-400" />
      <h1 className="mt-4 text-2xl font-semibold">Payment cancelled</h1>
      <p className="mt-2 text-gray-600">No worries, you haven't been charged. Your dates aren't reserved until you complete payment.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={() => navigate(-2)} className="rounded-lg border border-gray-900 px-5 py-3 font-semibold">Back to listing</button>
        <Link to="/" className="rounded-lg bg-brand px-5 py-3 font-semibold text-white">Keep exploring</Link>
      </div>
    </div>
  )
}
