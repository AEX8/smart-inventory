import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { dashboardApi } from '../api/dashboard'
import { deliveryStatusBadge } from '../components/ui/Badge'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const Analytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: dashboardApi.analytics,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Loading...</p>
        </div>
      </div>
    )
  }

  const pieData = data?.delivery_status_counts.map((d) => ({
    name: deliveryStatusBadge(d.status).label,
    value: d.count,
  })) ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stock and delivery insights</p>
      </div>

      {/* Top row — category stock + delivery breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Category stock */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Stock by category</h2>
          <p className="text-xs text-gray-400 mb-5">Total units across all products per category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.category_stock} barSize={32}>
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: 'none',
                }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar dataKey="total_quantity" name="Total units" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery status breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Delivery status breakdown</h2>
          <p className="text-xs text-gray-400 mb-5">Distribution of all deliveries by current status</p>
          {pieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
              No deliveries yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    boxShadow: 'none',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stock movement trend */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Stock movement — last 30 days</h2>
        <p className="text-xs text-gray-400 mb-5">Daily restocks vs reductions across all products</p>
        {!data?.movement_trend.length ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
            No movement data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.movement_trend}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: 'none',
                }}
                labelFormatter={(v) => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
              />
              <Line
                type="monotone"
                dataKey="restocked"
                name="Restocked"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="reduced"
                name="Reduced"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Low stock products */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Products needing reorder</h2>
        <p className="text-xs text-gray-400 mb-5">Sorted by how far below threshold — most urgent first</p>
        {!data?.low_stock_products.length ? (
          <p className="text-xs text-gray-400">All products are above their reorder threshold</p>
        ) : (
          <div className="space-y-3">
            {data.low_stock_products.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {p.quantity} / {p.threshold} min
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min((p.quantity / p.threshold) * 100, 100)}%`,
                      backgroundColor: p.quantity === 0 ? '#ef4444' : p.quantity <= p.threshold * 0.5 ? '#f59e0b' : '#3b82f6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics