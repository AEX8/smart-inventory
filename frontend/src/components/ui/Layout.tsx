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
    <div className="min-h-screen flex" style={{ background: '#f4f5f7' }}>
      <aside className="w-56 flex flex-col fixed h-full z-10" style={{ background: '#1a1f36', borderRight: '1px solid #232840' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #232840' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#4f5ef7' }}>
              <Package size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#e2e4f0' }}>SmartInventory</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                )
              }
              style={({ isActive }) => isActive
                ? { background: '#2d3561', color: '#ffffff' }
                : {}
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} color={isActive ? '#818cf8' : undefined} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #232840' }}>
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium truncate" style={{ color: '#9da3c8' }}>{user?.email}</p>
            <p className="text-xs capitalize mt-0.5" style={{ color: '#4a5080' }}>{user?.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
            style={{ color: '#4a5080' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9da3c8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a5080')}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout