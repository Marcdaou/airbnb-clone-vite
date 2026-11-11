import { List, Map } from 'lucide-react'

type View = 'list' | 'map'
type Props = { view: View; onChange: (v: View) => void }

export default function ViewToggle({ view, onChange }: Props) {
  const toMap = view === 'list'
  return (
    <button type="button" onClick={() => onChange(toMap ? 'map' : 'list')}
      className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:scale-105 transition md:hidden">
      {toMap ? <>Map <Map size={16} /></> : <>List <List size={16} /></>}
    </button>
  )
}
