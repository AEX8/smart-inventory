import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, LabelList,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, ChevronRight, Truck, Scale } from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { inventoryApi } from '../api/inventory'
import { deliveryStatusBadge } from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import ProductThumb from '../components/ui/ProductThumb'

// chart colours, validated for colour-blind separation against the surface colour
const SERIES = { restocked: '#2E6DA4', reduced: '#C46A2E' }
const CATEGORY_BAR = '#344D68'
// fixed status order so colours follow the status, never its rank
const STATUS_ORDER = ['delivered', 'in_transit', 'processing', 'delayed', 'cancelled']
const STATUS_COLOR: Record<string, string> = {
  delivered: '#2F8045',
  in_transit: '#2E6DA4',
  processing: '#A3A7AB',
  delayed: '#D08A17',
  cancelled: '#B23A30',
}

const INK = '#20272B'
const MUTED = '#62666A'
const GRID = '#DEDAD2'
const tick = { fontSize: 13, fill: MUTED }
const tooltipStyle = {
  fontSize: 13,
  border: `1px solid ${GRID}`,
  borderRadius: 6,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  background: '#FFFDFA',
  color: INK,
}

const muted = { color: 'var(--text-secondary)' }
const ink = { color: 'var(--text)' }

const shortDate = (v: string) => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
const longDate = (v: string) => new Date(v).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long' })

const Panel = ({ title, subtitle, action, children, className = '' }: {
  title: string
  subtitle: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) => (
  <section
    className={`rounded-md p-6 ${className}`}
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-serif text-[22px] leading-tight" style={ink}>{title}</h2>
        <p className="text-sm mt-1" style={muted}>{subtitle}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
)

const LegendItem = ({ color, label, value }: { color: string; label: string; value?: number }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
    <span style={ink}>{label}</span>
    {value !== undefined && <span className="ml-auto tabular-nums pl-4" style={muted}>{value}</span>}
  </div>
)

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="h-[260px] flex items-center justify-center text-sm" style={muted}>{children}</div>
)

const Analytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: dashboardApi.analytics,
  })

  const { data: reorder } = useQuery({
    queryKey: ['inventory', { stock_status: 'reorder', page_size: 8 }],
    queryFn: () => inventoryApi.list({ stock_status: 'reorder', page_size: 8 }),
  })

  const trend = data?.movement_trend ?? []
  const restocked = trend.reduce((sum, p) => sum + p.restocked, 0)
  const reduced = trend.reduce((sum, p) => sum + p.reduced, 0)
  const net = restocked - reduced

  const statusData = STATUS_ORDER
    .map((s) => ({
      status: s,
      name: deliveryStatusBadge(s).label,
      value: data?.delivery_status_counts.find((d) => d.status === s)?.count ?? 0,
    }))
    .filter((d) => d.value > 0)
  const totalDeliveries = statusData.reduce((sum, d) => sum + d.value, 0)

  const categories = [...(data?.category_stock ?? [])].sort((a, b) => b.total_quantity - a.total_quantity)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[40px] leading-tight" style={ink}>Analytics</h1>
        <p className="font-serif text-lg mt-1" style={muted}>Stock and delivery insights over the last 30 days</p>
      </div>

      {/* Headline numbers */}
      <div className="flex flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        <StatCard
          label="Units restocked"
          value={isLoading ? '...' : restocked.toLocaleString()}
          icon={<ArrowUpRight size={24} strokeWidth={1.5} />}
          sublabel="Received into stock"
        />
        <StatCard
          label="Units used"
          value={isLoading ? '...' : reduced.toLocaleString()}
          icon={<ArrowDownRight size={24} strokeWidth={1.5} />}
          sublabel="Sold, damaged or written off"
        />
        <StatCard
          label="Net change"
          value={isLoading ? '...' : `${net > 0 ? '+' : ''}${net.toLocaleString()}`}
          icon={<Scale size={24} strokeWidth={1.5} />}
          sublabel={net >= 0 ? 'Stock is building up' : 'Stock is drawing down'}
        />
        <StatCard
          label="Deliveries tracked"
          value={isLoading ? '...' : totalDeliveries}
          icon={<Truck size={24} strokeWidth={1.5} />}
          sublabel="Across all statuses"
        />
      </div>

      {/* Stock movement */}
      <Panel
        title="Stock movement"
        subtitle="Units restocked vs units used per day, last 30 days"
        action={
          <div className="flex gap-5 pt-1">
            <LegendItem color={SERIES.restocked} label="Restocked" />
            <LegendItem color={SERIES.reduced} label="Used" />
          </div>
        }
      >
        {!trend.length ? (
          <Empty>No movement data yet</Empty>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
              <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} tickFormatter={shortDate} minTickGap={24} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={longDate}
                cursor={{ stroke: MUTED, strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="restocked"
                name="Restocked"
                stroke={SERIES.restocked}
                strokeWidth={2}
                fill={SERIES.restocked}
                fillOpacity={0.08}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFDFA' }}
              />
              <Area
                type="monotone"
                dataKey="reduced"
                name="Used"
                stroke={SERIES.reduced}
                strokeWidth={2}
                fill={SERIES.reduced}
                fillOpacity={0.08}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFDFA' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Stock by category */}
        <Panel title="Stock by category" subtitle="Total units on hand in each category">
          {!categories.length ? (
            <Empty>No products yet</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, categories.length * 52)}>
              <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={14}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ ...tick, fill: INK }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: '#EEEBE4', opacity: 0.6 }}
                  formatter={(v: number, _n, item) => [`${v} units, ${item.payload.product_count} products`, 'Stock']}
                />
                <Bar dataKey="total_quantity" fill={CATEGORY_BAR} radius={[0, 4, 4, 0]} maxBarSize={26}>
                  <LabelList dataKey="total_quantity" position="right" style={{ fontSize: 13, fill: INK }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Delivery status */}
        <Panel title="Delivery status" subtitle="Every delivery by its current status">
          {!statusData.length ? (
            <Empty>No deliveries yet</Empty>
          ) : (
            <div className="flex flex-wrap items-center gap-8">
              <div className="relative w-[220px] h-[220px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={104}
                      startAngle={90}
                      endAngle={-270}
                      stroke="#FFFDFA"
                      strokeWidth={2}
                    >
                      {statusData.map((d) => (
                        <Cell key={d.status} fill={STATUS_COLOR[d.status]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-serif text-[34px] leading-none tabular-nums" style={ink}>{totalDeliveries}</span>
                  <span className="text-sm mt-1" style={muted}>deliveries</span>
                </div>
              </div>
              <div className="flex-1 min-w-[180px] space-y-3">
                {statusData.map((d) => (
                  <LegendItem key={d.status} color={STATUS_COLOR[d.status]} label={d.name} value={d.value} />
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Products needing reorder */}
      <Panel
        title="Products needing reorder"
        subtitle="Most urgent first, by share of reorder threshold left"
        action={
          <Link to="/inventory" className="text-sm font-medium flex items-center gap-1 hover:underline pt-1" style={{ color: 'var(--primary)' }}>
            View inventory <ChevronRight size={15} />
          </Link>
        }
      >
        {!reorder?.items.length ? (
          <p className="text-sm" style={muted}>All products are above their reorder threshold</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5">
            {reorder.items.map((p) => {
              const share = p.threshold ? p.quantity / p.threshold : 0
              const color = share <= 0.25 ? 'var(--danger)' : 'var(--warning)'
              return (
                <div key={p.id} className="flex items-center gap-4">
                  <ProductThumb name={p.name} src={p.image_url} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <p className="font-medium truncate" style={ink}>{p.name}</p>
                      <p className="text-sm tabular-nums whitespace-nowrap">
                        <span style={{ color }}>{p.quantity}</span>
                        <span style={muted}> / {p.threshold} min</span>
                      </p>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: 'var(--surface-subtle)' }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.max(Math.min(share * 100, 100), 2)}%`, background: color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}

export default Analytics
