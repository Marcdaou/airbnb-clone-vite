import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export function useWishlist() {
  const { user, openAuth } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) { setIds(new Set()); return }
    let active = true
    supabase.from('wishlists').select('listing_id').eq('user_id', user.id).then(({ data }) => {
      if (active && data) setIds(new Set(data.map((r: { listing_id: string }) => r.listing_id)))
    })
    return () => { active = false }
  }, [user])

  const toggle = useCallback(async (id: string) => {
    if (!user) { openAuth(); return }
    const has = ids.has(id)
    setIds(prev => { const n = new Set(prev); if (has) n.delete(id); else n.add(id); return n })
    const { error } = has
      ? await supabase.from('wishlists').delete().eq('user_id', user.id).eq('listing_id', id)
      : await supabase.from('wishlists').insert({ listing_id: id })
    if (error) setIds(prev => { const n = new Set(prev); if (has) n.add(id); else n.delete(id); return n })
  }, [user, ids, openAuth])

  return { ids, toggle }
}
