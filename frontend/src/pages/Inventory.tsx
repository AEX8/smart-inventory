import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, Pencil, AlertTriangle } from 'lucide-react'
import { inventoryApi } from '../api/inventory'
import { useAuth } from '../hooks/useAuth'
import type { ProductOut } from '../types/product'
import Badge, { stockStatusBadge } from '../components/ui/Badge'
import ProductThumb from '../components/ui/ProductThumb'
import SlideOver from '../components/ui/SlideOver'
import Modal from '../components/ui/Modal'
import { Button } from '../components/ui/FormFields'
import ProductForm, { StockAdjustForm, EditProductForm } from '../components/inventory/ProductForm'
import { forecastApi } from '../api/forecast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'low', label: 'Low' },
  { value: 'critical', label: 'Critical' },
]

const muted = { color: 'var(--text-secondary)' }
const ink = { color: 'var(--text)' }
const th = 'text-left px-4 py-3 text-sm font-medium'
const field = 'rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]'
const fieldStyle = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
const tile = 'rounded p-3'
const tileStyle = { background: 'var(--surface-subtle)' }

const shortDate = (v: string) => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

const Detail = ({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) => (
  <div className={`${tile} ${wide ? 'col-span-2' : ''}`} style={tileStyle}>
    <p className="text-xs" style={muted}>{label}</p>
    <div className="text-[15px] font-medium mt-0.5" style={ink}>{children}</div>
  </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-serif text-lg mb-3" style={ink}>{children}</h3>
)

const Inventory = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canEdit = user?.role !== 'driver'

  const [searchParams] = useSearchParams()
  // the dashboard search links here with ?search=
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [stockStatus, setStockStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<ProductOut | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', { search, stockStatus, page }],
    queryFn: () => inventoryApi.list({
      search: search || undefined,
      stock_status: stockStatus || undefined,
      page,
      page_size: 25,
    }),
    placeholderData: (prev) => prev,
  })

  const liveProduct = selectedProduct
    ? data?.items.find((p) => p.id === selectedProduct.id) ?? selectedProduct
    : null

  const { data: movements } = useQuery({
    queryKey: ['movements', liveProduct?.id],
    queryFn: () => inventoryApi.movements(liveProduct!.id),
    enabled: !!liveProduct,
  })

  const { data: forecast } = useQuery({
    queryKey: ['forecast', liveProduct?.id],
    queryFn: () => forecastApi.getProduct(liveProduct!.id),
    enabled: !!liveProduct,
    staleTime: 5 * 60 * 1000, // 5 min matches Redis TTL
  })

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setSelectedProduct(null)
      setShowEditForm(false)
    },
  })

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1
  const colCount = canEdit ? 6 : 5

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[40px] leading-tight" style={ink}>Inventory</h1>
          <p className="font-serif text-lg mt-1" style={muted}>{data?.total ?? 0} products</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddModal(true)} className="py-2.5">
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Add product
            </span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={muted} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or SKU..."
            aria-label="Search products"
            className={`w-80 pl-10 pr-4 ${field}`}
            style={fieldStyle}
          />
        </div>
        <select
          value={stockStatus}
          onChange={(e) => { setStockStatus(e.target.value); setPage(1) }}
          aria-label="Filter by stock status"
          className={field}
          style={fieldStyle}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <section className="rounded-md overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="p-2 overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead>
              <tr style={{ background: 'var(--surface-subtle)' }}>
                <th className={th} style={muted}>Product</th>
                <th className={th} style={muted}>Category</th>
                <th className={th} style={muted}>Supplier</th>
                <th className={th} style={muted}>Stock / Threshold</th>
                <th className={th} style={muted}>Status</th>
                {canEdit && <th className={`${th} text-right`} style={muted}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={colCount} className="px-4 py-10 text-center text-sm" style={muted}>Loading...</td>
                </tr>
              )}
              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="px-4 py-10 text-center text-sm" style={muted}>No products found</td>
                </tr>
              )}
              {data?.items.map((product) => {
                const badge = stockStatusBadge(product.quantity, product.threshold)
                const below = product.quantity <= product.threshold
                return (
                  <tr
                    key={product.id}
                    onClick={() => { setSelectedProduct(product); setShowEditForm(false) }}
                    className="cursor-pointer transition-colors hover:bg-[var(--background)] last:border-b-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb name={product.name} src={product.image_url} size={48} />
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={ink}>{product.name}</p>
                          <p className="text-sm mt-0.5" style={muted}>{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={ink}>{product.category ?? 'Uncategorised'}</td>
                    <td className="px-4 py-3" style={ink}>{product.supplier?.name ?? 'Not set'}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      <span style={{ color: below ? 'var(--danger)' : 'var(--text)' }}>{product.quantity}</span>
                      <span style={muted}> / {product.threshold}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelectedProduct(product); setShowAdjustModal(true) }}
                            className="text-sm font-medium px-3 py-1.5 rounded transition-colors hover:bg-[var(--primary-soft)]"
                            style={{ color: 'var(--primary)' }}
                          >
                            Adjust
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => deleteMutation.mutate(product.id)}
                              aria-label={`Delete ${product.name}`}
                              className="p-2 rounded transition-colors hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                              style={muted}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-sm" style={muted}>Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Product detail slide-over */}
      <SlideOver
        open={!!liveProduct && !showAdjustModal}
        onClose={() => { setSelectedProduct(null); setShowEditForm(false) }}
        title={showEditForm ? `Edit ${liveProduct?.name}` : 'Product details'}
      >
        {liveProduct && (
          showEditForm ? (
            <EditProductForm product={liveProduct} onClose={() => setShowEditForm(false)} />
          ) : (
            <div className="space-y-7">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <ProductThumb name={liveProduct.name} src={liveProduct.image_url} size={96} />
                <div className="min-w-0">
                  <p className="font-serif text-xl leading-snug" style={ink}>{liveProduct.name}</p>
                  <p className="text-sm mt-1" style={muted}>{liveProduct.sku}</p>
                  <div className="mt-2">
                    <Badge variant={stockStatusBadge(liveProduct.quantity, liveProduct.threshold).variant}>
                      {stockStatusBadge(liveProduct.quantity, liveProduct.threshold).label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Detail label="Category">{liveProduct.category ?? 'Uncategorised'}</Detail>
                <Detail label="Current stock">{liveProduct.quantity} units</Detail>
                <Detail label="Reorder threshold">{liveProduct.threshold} units</Detail>
                <Detail label="Supplier">
                  {liveProduct.supplier ? (
                    <>
                      {liveProduct.supplier.name}
                      <span className="block text-xs font-normal mt-0.5" style={muted}>
                        {liveProduct.supplier.lead_time_days} day lead time
                      </span>
                    </>
                  ) : 'Not set'}
                </Detail>
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <Button type="button" onClick={() => setShowEditForm(true)} variant="secondary" className="flex-1">
                    <span className="flex items-center justify-center gap-1.5">
                      <Pencil size={14} />
                      Edit
                    </span>
                  </Button>
                  <Button type="button" onClick={() => setShowAdjustModal(true)} className="flex-1">
                    Adjust stock
                  </Button>
                </div>
              )}

              {/* Forecast */}
              {forecast && !forecast.insufficient_data && (
                <div>
                  <SectionTitle>14-day forecast</SectionTitle>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Detail label="Stockout in">
                      <span style={{ color: forecast.days_remaining !== null && forecast.days_remaining <= 7 ? 'var(--danger)' : 'var(--text)' }}>
                        {forecast.days_remaining !== null ? `${forecast.days_remaining} days` : 'Not predicted'}
                      </span>
                    </Detail>
                    <Detail label="Reorder qty">
                      {forecast.recommended_reorder_qty != null ? `${forecast.recommended_reorder_qty} units` : 'Not available'}
                    </Detail>
                    <Detail label="Confidence" wide>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${forecast.confidence * 100}%`, background: 'var(--primary)' }}
                          />
                        </div>
                        <span className="text-sm font-normal" style={muted}>{Math.round(forecast.confidence * 100)}%</span>
                      </div>
                    </Detail>
                  </div>

                  {forecast.forecast_series.length > 0 && (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={forecast.forecast_series}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: '#62666A' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={shortDate}
                          interval={6}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#62666A' }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip
                          contentStyle={{ fontSize: 13, border: '1px solid #DEDAD2', borderRadius: 6, boxShadow: 'none', background: '#FFFDFA' }}
                          labelFormatter={shortDate}
                        />
                        <ReferenceLine
                          y={liveProduct.threshold}
                          stroke="#936000"
                          strokeDasharray="3 3"
                          label={{ value: 'min', fontSize: 11, fill: '#936000' }}
                        />
                        <Line type="monotone" dataKey="predicted_stock" name="Predicted stock" stroke="#344D68" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}

                  {forecast.anomaly_flag && (
                    <div
                      className="mt-3 rounded px-3 py-2.5 flex gap-2.5"
                      style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                    >
                      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Anomaly detected</p>
                        <p className="text-sm mt-0.5 opacity-80">Unusual stock movement pattern for this product</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {forecast?.insufficient_data && (
                <div className={tile} style={tileStyle}>
                  <p className="text-sm font-medium" style={ink}>Forecast unavailable</p>
                  <p className="text-sm mt-0.5" style={muted}>
                    Not enough movement history yet. Keep tracking stock and it will appear automatically.
                  </p>
                </div>
              )}

              {/* Movement history */}
              <div>
                <SectionTitle>Movement history</SectionTitle>
                {!movements?.length && <p className="text-sm" style={muted}>No movements recorded</p>}
                {movements?.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div>
                      <p className="text-sm font-medium capitalize" style={ink}>{m.reason.replace('_', ' ')}</p>
                      <p className="text-xs mt-0.5" style={muted}>
                        {new Date(m.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className="text-[15px] font-semibold tabular-nums"
                      style={{ color: m.delta > 0 ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {m.delta > 0 ? '+' : ''}{m.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </SlideOver>

      {/* Stock adjust modal */}
      <Modal open={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Adjust stock">
        {liveProduct && (
          <StockAdjustForm
            productId={liveProduct.id}
            productName={liveProduct.name}
            currentStock={liveProduct.quantity}
            onClose={() => setShowAdjustModal(false)}
          />
        )}
      </Modal>

      {/* Add product modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add product">
        <ProductForm onClose={() => setShowAddModal(false)} />
      </Modal>
    </div>
  )
}

export default Inventory
