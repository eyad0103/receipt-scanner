import { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  title: string
  icon: LucideIcon
}

export function ComingSoon({ title, icon: Icon }: ComingSoonProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1a24] border border-[#27272a] flex items-center justify-center mx-auto mb-5">
          <Icon className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-zinc-400">Coming Soon</p>
      </div>
    </div>
  )
}
