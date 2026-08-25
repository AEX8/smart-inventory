import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Truck,
  Building2, BarChart2, LogOut,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/deliveries', icon: Truck, label: 'Deliveries' },
  { to: '/suppliers', icon: Building2, label: 'Suppliers' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
]

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2f5' }}>
      <aside
        className="w-60 flex flex-col fixed h-full z-10"
        style={{ background: '#ffffff', borderRight: '2px solid #0552a1' }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #e8eaf0' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: '#0552a1' }}
            >
              <Package size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>
              SmartInventory
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={({ isActive }) =>
                isActive
                  ? { background: '#e8f0fb', color: '#0552a1', fontWeight: 500 }
                  : { color: '#5a6478' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} color={isActive ? '#0552a1' : '#8a94a8'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #e8eaf0' }}>
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium truncate" style={{ color: '#0d1b2a' }}>
              {user?.email}
            </p>
            <p className="text-xs capitalize mt-0.5" style={{ color: '#8a94a8' }}>
              {user?.role.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
            style={{ color: '#8a94a8' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0552a1')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a94a8')}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout