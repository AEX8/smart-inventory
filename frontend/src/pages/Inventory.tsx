import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, Pencil } from 'lucide-react'
import { inventoryApi } from '../api/inventory'
import { useAuth } from '../hooks/useAuth'
import type { ProductOut } from '../types/product'
import Badge, { stockStatusBadge } from '../components/ui/Badge'
import SlideOver from '../components/ui/SlideOver'
import Modal from '../components/ui/Modal'
import { Button } from '../components/ui/FormFields'
import ProductForm, { StockAdjustForm, EditProductForm } from '../components/inventory/ProductForm'
import { forecastApi } from '../api/forecast'
import type { ForecastOut } from '../types/forecast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'low', label: 'Low' },
  { value: 'critical', label: 'Critical' },
]

const Inventory = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} products</p>
        </div>
        {user?.role !== 'driver' && (
          <Button onClick={() => setShowAddModal(true)}>
            <span className="flex items-center gap-1.5">
              <Plus size={14} />
              Add product
            </span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={stockStatus}
          onChange={(e) => { setStockStatus(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">SKU</th>
              <th className="text-left px-5 py-3 font-medium">Category</th>
              <th className="text-left px-5 py-3 font-medium">Stock</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              {user?.role !== 'driver' && (
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-xs">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-xs">
                  No products found
                </td>
              </tr>
            )}
            {data?.items.map((product) => {
              const badge = stockStatusBadge(product.quantity, product.threshold)
              return (
                <tr
                  key={product.id}
                  onClick={() => { setSelectedProduct(product); setShowEditForm(false) }}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{product.sku}</td>
                  <td className="px-5 py-3 text-gray-500">{product.category ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-900">
                    {product.quantity}
                    <span className="text-gray-400 text-xs ml-1">/ {product.threshold} min</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  {user?.role !== 'driver' && (
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setSelectedProduct(product); setShowAdjustModal(true) }}
                          className="text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Adjust
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => deleteMutation.mutate(product.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 size={13} />
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

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
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
      </div>

      {/* Product detail slide-over */}
      <SlideOver
        open={!!liveProduct && !showAdjustModal}
        onClose={() => { setSelectedProduct(null); setShowEditForm(false) }}
        title={showEditForm ? `Edit — ${liveProduct?.name}` : liveProduct?.name ?? ''}
      >
        {liveProduct && (
          <>
            {showEditForm ? (
              <EditProductForm
                product={liveProduct}
                onClose={() => setShowEditForm(false)}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">SKU</p>
                    <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">{liveProduct.sku}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Category</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{liveProduct.category ?? '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Current stock</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{liveProduct.quantity} units</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Reorder threshold</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{liveProduct.threshold} units</p>
                  </div>
                  {liveProduct.supplier && (
                    <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-400">Supplier</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{liveProduct.supplier.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{liveProduct.supplier.lead_time_days}d lead time</p>
                    </div>
                  )}
                </div>

                {user?.role !== 'driver' && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowEditForm(true)}
                      variant="secondary"
                      className="flex-1"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Pencil size={13} />
                        Edit
                      </span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowAdjustModal(true)}
                      variant="secondary"
                      className="flex-1"
                    >
                      Adjust stock
                    </Button>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Movement history
                  </h3>
                  <div className="space-y-2">
                    {!movements?.length && (
                      <p className="text-xs text-gray-400">No movements recorded</p>
                    )}
                    {movements?.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div>
                          <p className="text-xs font-medium text-gray-700 capitalize">
                            {m.reason.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-sm font-semibold ${m.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {m.delta > 0 ? '+' : ''}{m.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Forecast */}
      {forecast && !forecast.insufficient_data && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            14-day forecast
          </h3>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Stockout in</p>
              <p className={`text-sm font-semibold mt-0.5 ${
                forecast.days_remaining !== null && forecast.days_remaining <= 7
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}>
                {forecast.days_remaining !== null
                  ? `${forecast.days_remaining} days`
                  : 'Not predicted'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Reorder qty</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {forecast.recommended_reorder_qty ?? '—'} units
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 col-span-2">
              <p className="text-xs text-gray-400">Confidence</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${forecast.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(forecast.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Forecast chart */}
          {forecast.forecast_series.length > 0 && (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={forecast.forecast_series}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    boxShadow: 'none',
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                />
                <ReferenceLine
                  y={liveProduct.threshold}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: 'min', fontSize: 10, fill: '#f59e0b' }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_stock"
                  name="Predicted stock"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {forecast.anomaly_flag && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs text-red-600 font-medium">⚠ Anomaly detected</p>
              <p className="text-xs text-red-400 mt-0.5">
                Unusual stock movement pattern detected for this product
              </p>
            </div>
          )}
        </div>
      )}

      {forecast?.insufficient_data && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 font-medium">Forecast unavailable</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Not enough movement history to generate a forecast. Keep tracking stock and it'll appear automatically.
          </p>
        </div>
      )}
              </div>
            )}
          </>
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