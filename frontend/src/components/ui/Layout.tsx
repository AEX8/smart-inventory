import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Truck,
  Building2, BarChart2, LogOut, ChevronRight,
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
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <aside
        className="w-58 flex flex-col fixed h-full z-10"
        style={{
          width: '232px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Identity */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              <Package size={13} color="white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)', fontFamily: 'Libre Baskerville, Georgia, serif' }}>
                SmartInventory
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Hospitality Supply</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex items-center gap-3.5 px-4 py-3 rounded text-[16px] font-medium tracking-[0.01em] transition-colors"
              style={({ isActive }) =>
                isActive
                  ? { background: 'var(--primary)', color: 'white', borderRadius: '5px' }
                  : { color: 'var(--text)' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={19} strokeWidth={isActive ? 1.75 : 1.5} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded cursor-pointer hover:bg-gray-50 transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
            >
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{user?.email}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{user?.role.replace('_', ' ')}</p>
            </div>
            <button onClick={logout} className="flex-shrink-0" title="Sign out">
              <LogOut size={14} color="var(--text-secondary)" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen" style={{ marginLeft: '232px' }}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout