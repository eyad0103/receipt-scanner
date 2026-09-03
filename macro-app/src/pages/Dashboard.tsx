import {
  Activity,
  Cpu,
  Clock,
  Trophy,
  Zap,
  AlertCircle,
  Play,
  Target,
  Settings,
} from 'lucide-react'

const statusCards = [
  {
    title: 'Macro Status',
    value: 'Stopped',
    icon: Cpu,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    description: 'Not currently running',
  },
  {
    title: 'Roblox Status',
    value: 'Waiting',
    icon: Activity,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    description: 'Waiting for game window',
  },
  {
    title: 'Profile',
    value: 'No Profile',
    icon: Target,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    description: 'No profile selected',
  },
  {
    title: 'Session Time',
    value: '00:00:00',
    icon: Clock,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Current session duration',
  },
]

const stats = [
  { label: 'Wins', value: 0, icon: Trophy, color: 'text-green-400' },
  { label: 'Losses', value: 0, icon: AlertCircle, color: 'text-red-400' },
  { label: 'Runs', value: 0, icon: Play, color: 'text-blue-400' },
  { label: 'Current Action', value: 'Idle', icon: Zap, color: 'text-purple-400' },
]

const activities = [
  { time: '00:00:00', message: 'Application Started', icon: Settings, color: 'text-blue-400' },
  { time: '00:00:01', message: 'Waiting for Roblox', icon: Activity, color: 'text-yellow-400' },
  { time: '00:00:02', message: 'Ready', icon: Play, color: 'text-green-400' },
]

export function Dashboard() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-zinc-400 text-base">
            Monitor and control your macro automation
          </p>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-8">
          {statusCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 hover:border-[#2a2a3a] transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <div className="mb-1">
                  <p className="text-zinc-400 text-sm font-medium">{card.title}</p>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-zinc-500 text-xs">{card.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Statistics</h2>
          <div className="grid grid-cols-4 gap-5">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 hover:border-[#2a2a3a] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-zinc-400 text-sm font-medium">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Activity</h2>
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="max-h-[200px] overflow-y-auto">
              {activities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-[#1e1e2e] last:border-b-0 hover:bg-[#1a1a24] transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${activity.color} shrink-0`} />
                    <span className="text-zinc-400 text-xs font-mono w-16 shrink-0">
                      {activity.time}
                    </span>
                    <span className="text-zinc-200 text-sm">{activity.message}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
