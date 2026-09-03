import { useState } from 'react'
import {
  LayoutDashboard,
  Settings,
  Cpu,
  MousePointer,
  Activity,
  X,
  Minus,
  Square,
} from 'lucide-react'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'macros', label: 'Macro', icon: Cpu },
  { id: 'detection', label: 'Detection', icon: Activity },
  { id: 'buttons', label: 'Buttons', icon: MousePointer },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleMinimize = () => {
    window.electronAPI?.minimize()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximize()
  }

  const handleClose = () => {
    window.electronAPI?.close()
  }

  return (
    <div className="w-[240px] h-full bg-[#0c0c12] border-r border-[#1e1e2e] flex flex-col">
      <div className="h-[52px] flex items-center justify-between px-4 drag-region">
        <div className="flex items-center gap-2 no-drag">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] text-white">Macro App</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#27272a] transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#27272a] transition-colors"
          >
            <Square className="w-3 h-3 text-zinc-400" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            const isHovered = hoveredItem === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1a1a24]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="font-medium text-[14px]">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-3 border-t border-[#1e1e2e]">
        <div className="px-3 py-2 rounded-lg bg-[#1a1a24]">
          <div className="text-xs text-zinc-500 mb-1">Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm text-zinc-300">Waiting for Roblox</span>
          </div>
        </div>
      </div>
    </div>
  )
}
