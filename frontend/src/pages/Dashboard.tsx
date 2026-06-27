import { useQuery } from '@tanstack/react-query'
import { Package, Truck, AlertTriangle, TrendingDown } from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { deliveriesApi } from '../api/deliveries'
import { inventoryApi } from '../api/inventory'
import StatCard from '../components/ui/StatCard'
import Badge, { deliveryStatusBadge, stockStatusBadge } from '../components/ui/Badge'

const Dashboard = () => {
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: 30_000,
  })

  const { data: deliveries } = useQuery({
    queryKey: ['deliveries', { page_size: 8 }],
    queryFn: () => deliveriesApi.list({ page_size: 8 }),
  })

  const { data: lowStock } = useQuery({
    queryKey: ['inventory', { stock_status: 'low', page_size: 6 }],
    queryFn: () => inventoryApi.list({ stock_status: 'low', page_size: 6 }),
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live inventory and delivery status</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total products"
          value={summary?.total_products ?? '—'}
          icon={<Package size={18} />}
        />
        <StatCard
          label="Low stock"
          value={(summary?.low_stock_count ?? 0) + (summary?.critical_stock_count ?? 0)}
          icon={<TrendingDown size={18} />}
          alert={(summary?.critical_stock_count ?? 0) > 0}
          sublabel={summary?.critical_stock_count ? `${summary.critical_stock_count} critical` : undefined}
        />
        <StatCard
          label="Pending deliveries"
          value={summary?.pending_deliveries ?? '—'}
          icon={<Truck size={18} />}
        />
        <StatCard
          label="Delayed"
          value={summary?.delayed_deliveries ?? '—'}
          icon={<AlertTriangle size={18} />}
          alert={(summary?.delayed_deliveries ?? 0) > 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent deliveries</h2>
            <a href="/deliveries" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium">Qty</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deliveries?.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-xs">
                    No deliveries yet
                  </td>
                </tr>
              )}
              {deliveries?.items.map((d) => {
                const badge = deliveryStatusBadge(d.status)
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-900 font-medium">{d.product_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{d.quantity}</td>
                    <td className="px-5 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                    <td className="px-5 py-3 text-gray-500">
                      {d.eta ? new Date(d.eta).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Reorder alerts</h2>
            <a href="/inventory" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {!lowStock?.items.length && (
              <p className="px-5 py-8 text-center text-gray-400 text-xs">All stock levels healthy</p>
            )}
            {lowStock?.items.map((p) => {
              const badge = stockStatusBadge(p.quantity, p.threshold)
              return (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.quantity} / {p.threshold} min</p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard