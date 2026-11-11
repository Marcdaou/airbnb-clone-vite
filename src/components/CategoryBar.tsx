import { useSearchParams } from 'react-router-dom'
import { Waves, TreePine, WavesLadder, Wheat, Home, Flame, Sailboat, Gem, type LucideIcon } from 'lucide-react'
import { CATEGORIES } from '../lib/types'

const ICONS: Record<string, LucideIcon> = {
  Beachfront: Waves, Cabins: TreePine, 'Amazing pools': WavesLadder, Countryside: Wheat,
  'Tiny homes': Home, Trending: Flame, Lakefront: Sailboat, Design: Gem,
}

export default function CategoryBar() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category')

  const select = (c: string) => {
    const next = new URLSearchParams(params)
    if (active === c) next.delete('category'); else next.set('category', c)
    setParams(next)
  }

  return (
    <div className="sticky top-[81px] z-30 bg-white border-b border-gray-100">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 flex gap-8 overflow-x-auto [scrollbar-width:none] pt-4">
        {CATEGORIES.map(c => {
          const Icon = ICONS[c]
          const on = active === c
          return (
            <button key={c} onClick={() => select(c)}
              className={`flex flex-col items-center gap-2 pb-3 border-b-2 shrink-0 text-xs font-medium transition ${on ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}>
              <Icon size={24} strokeWidth={1.5} />
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}
