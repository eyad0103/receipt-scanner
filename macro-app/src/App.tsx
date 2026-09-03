import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { ComingSoon } from './pages/ComingSoon'
import { Cpu, Activity, MousePointer, Settings } from 'lucide-react'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'macros':
        return <ComingSoon title="Macro" icon={Cpu} />
      case 'detection':
        return <ComingSoon title="Detection" icon={Activity} />
      case 'buttons':
        return <ComingSoon title="Buttons" icon={MousePointer} />
      case 'settings':
        return <ComingSoon title="Settings" icon={Settings} />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
