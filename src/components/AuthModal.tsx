import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function AuthModal() {
  const { authOpen, closeAuth } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuth() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [authOpen, closeAuth])

  useEffect(() => { if (!authOpen) { setError(null); setInfo(null); setPassword('') } }, [authOpen])

  if (!authOpen) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        closeAuth()
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        if (error) throw error
        if (data.session) closeAuth()
        else setInfo('Check your email to confirm your account.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setBusy(false) }
  }

  const input = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeAuth}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="relative border-b border-gray-200 px-6 py-4 text-center font-semibold">
          <button onClick={closeAuth} className="absolute left-4 top-3.5 rounded-full p-1 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </div>
        <form onSubmit={submit} className="space-y-3 p-6">
          <h2 className="mb-2 text-xl font-semibold">Welcome to the stay</h2>
          {mode === 'signup' && <input className={input} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
          <p className="pt-2 text-center text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" className="font-semibold underline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null) }}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
