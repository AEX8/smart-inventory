import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, Truck, AlertTriangle, Clock, Search, ChevronRight } from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { deliveriesApi } from '../api/deliveries'
import { inventoryApi } from '../api/inventory'
import { useAuth } from '../hooks/useAuth'
import StatCard from '../components/ui/StatCard'
import Badge, { deliveryStatusBadge } from '../components/ui/Badge'
import ProductThumb from '../components/ui/ProductThumb'
import Modal from '../components/ui/Modal'
import { Button } from '../components/ui/FormFields'
import { DeliveryForm } from '../components/deliveries/DeliveryForm'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

// share of the reorder threshold still in stock
const urgency = (quantity: number, threshold: number) =>
  quantity <= threshold * 0.25
    ? { label: 'High', color: 'var(--danger)' }
    : { label: 'Medium', color: 'var(--warning)' }

const Panel = ({ title, to, children }: { title: string; to: string; children: React.ReactNode }) => (
  <section
    className="rounded-md overflow-hidden"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="px-6 py-5 flex items-center justify-between">
      <h2 className="font-serif text-[24px] leading-tight" style={{ color: 'var(--text)' }}>{title}</h2>
      <Link to={to} className="text-sm font-medium flex items-center gap-1 hover:underline" style={{ color: 'var(--primary)' }}>
        View all <ChevronRight size={15} />
      </Link>
    </div>
    {children}
  </section>
)

const th = 'text-left px-4 py-3 text-sm font-medium'
const thStyle = { color: 'var(--text-secondary)' }

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: 30_000,
  })

  const { data: deliveries } = useQuery({
    queryKey: ['deliveries', { page_size: 8 }],
    queryFn: () => deliveriesApi.list({ page_size: 8 }),
  })

  const { data: reorder } = useQuery({
    queryKey: ['inventory', { stock_status: 'reorder', page_size: 8 }],
    queryFn: () => inventoryApi.list({ stock_status: 'reorder', page_size: 8 }),
  })

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const lowStock = summary ? summary.low_stock_count + summary.critical_stock_count : '...'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    navigate(term ? `/inventory?search=${encodeURIComponent(term)}` : '/inventory')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[40px] leading-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <p className="font-serif text-lg mt-1" style={{ color: 'var(--text-secondary)' }}>{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products by name or SKU..."
              aria-label="Search products"
              className="w-80 pl-10 pr-4 py-2.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </form>
          {user?.role !== 'driver' && (
            <Button onClick={() => setShowCreate(true)} className="py-2.5">
              <span className="flex items-center gap-2">
                <Truck size={16} />
                Create delivery
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Metric strip */}
      <div className="flex flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        <StatCard
          label="Total products"
          value={summary?.total_products ?? '...'}
          icon={<Package size={24} strokeWidth={1.5} />}
          sublabel="Across all categories"
        />
        <StatCard
          label="Low stock"
          value={lowStock}
          icon={<AlertTriangle size={24} strokeWidth={1.5} />}
          alert={typeof lowStock === 'number' && lowStock > 0}
          sublabel="Products below threshold"
        />
        <StatCard
          label="Pending deliveries"
          value={summary?.pending_deliveries ?? '...'}
          icon={<Truck size={24} strokeWidth={1.5} />}
          sublabel="Awaiting arrival"
        />
        <StatCard
          label="Delayed deliveries"
          value={summary?.delayed_deliveries ?? '...'}
          icon={<Clock size={24} strokeWidth={1.5} />}
          alert={(summary?.delayed_deliveries ?? 0) > 0}
          sublabel="Past estimated date"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* Recent deliveries */}
        <div className="xl:col-span-3">
          <Panel title="Recent deliveries" to="/deliveries">
            <div className="px-2 pb-2 overflow-x-auto">
              <table className="w-full text-[15px]">
                <thead>
                  <tr style={{ background: 'var(--surface-subtle)' }}>
                    <th className={th} style={thStyle}>Product</th>
                    <th className={th} style={thStyle}>Supplier</th>
                    <th className={th} style={thStyle}>Quantity</th>
                    <th className={th} style={thStyle}>Status</th>
                    <th className={th} style={thStyle}>ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries?.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm" style={thStyle}>No deliveries yet</td>
                    </tr>
                  )}
                  {deliveries?.items.map((d) => {
                    const badge = deliveryStatusBadge(d.status)
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }} className="last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb name={d.product_name} src={d.product_image_url} size={48} />
                            <div className="min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--text)' }}>{d.product_name ?? 'Unknown product'}</p>
                              <p className="text-sm mt-0.5" style={thStyle}>
                                {[d.product_sku, d.product_category].filter(Boolean).join('  |  ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{d.supplier_name ?? 'Not set'}</td>
                        <td className="px-4 py-3">
                          <p className="tabular-nums" style={{ color: 'var(--text)' }}>{d.quantity}</p>
                          <p className="text-sm" style={thStyle}>units</p>
                        </td>
                        <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: d.status === 'delayed' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {d.eta ? formatDate(d.eta) : 'Not set'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Reorder alerts */}
        <div className="xl:col-span-2">
          <Panel title="Reorder alerts" to="/inventory">
            <div className="px-2 pb-2 overflow-x-auto">
              <table className="w-full text-[15px]">
                <thead>
                  <tr style={{ background: 'var(--surface-subtle)' }}>
                    <th className={th} style={thStyle}>Product</th>
                    <th className={th} style={thStyle}>Stock / Threshold</th>
                    <th className={th} style={thStyle}>Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {reorder?.items.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm" style={thStyle}>All stock levels healthy</td>
                    </tr>
                  )}
                  {reorder?.items.map((p) => {
                    const u = urgency(p.quantity, p.threshold)
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }} className="last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb name={p.name} src={p.image_url} size={48} />
                            <div className="min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                              <p className="text-sm mt-0.5" style={thStyle}>{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          <span style={{ color: u.label === 'High' ? 'var(--danger)' : 'var(--text)' }}>{p.quantity}</span>
                          <span style={thStyle}> / </span>
                          <span style={{ color: 'var(--text)' }}>{p.threshold}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 font-medium" style={{ color: u.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: u.color }} />
                            {u.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New delivery">
        <DeliveryForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  )
}

export default Dashboard
