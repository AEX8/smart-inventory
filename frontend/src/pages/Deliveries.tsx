import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { deliveriesApi } from '../api/deliveries'
import { useAuth } from '../hooks/useAuth'
import type { DeliveryOut } from '../types/delivery'
import Badge, { deliveryStatusBadge } from '../components/ui/Badge'
import ProductThumb from '../components/ui/ProductThumb'
import SlideOver from '../components/ui/SlideOver'
import Modal from '../components/ui/Modal'
import { Button } from '../components/ui/FormFields'
import { DeliveryForm, StatusUpdateForm } from '../components/deliveries/DeliveryForm'
import { cn } from '../utils/cn'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'processing', label: 'Processing' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const muted = { color: 'var(--text-secondary)' }
const ink = { color: 'var(--text)' }
const th = 'text-left px-4 py-3 text-sm font-medium'
const tileStyle = { background: 'var(--surface-subtle)' }

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="rounded p-3" style={tileStyle}>
    <p className="text-xs" style={muted}>{label}</p>
    <div className="text-[15px] font-medium mt-0.5" style={ink}>{children}</div>
  </div>
)

const Deliveries = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canEdit = user?.role !== 'driver'

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<DeliveryOut | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', { statusFilter, page }],
    queryFn: () => deliveriesApi.list({
      status: statusFilter || undefined,
      page,
      page_size: 25,
    }),
    placeholderData: (prev) => prev,
  })

  // always pull from live cache so slide-over reflects status updates immediately
  const liveDelivery = selected
    ? data?.items.find((d) => d.id === selected.id) ?? selected
    : null

  const deleteMutation = useMutation({
    mutationFn: deliveriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setSelected(null)
    },
  })

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1
  const colCount = canEdit ? 7 : 6

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[40px] leading-tight" style={ink}>Deliveries</h1>
          <p className="font-serif text-lg mt-1" style={muted}>
            {data?.total ?? 0} {statusFilter ? STATUS_TABS.find((t) => t.value === statusFilter)?.label.toLowerCase() : 'total'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreateModal(true)} className="py-2.5">
            <span className="flex items-center gap-2">
              <Plus size={16} />
              New delivery
            </span>
          </Button>
        )}
      </div>

      {/* Status tabs */}
      <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {STATUS_TABS.map((t) => {
          const active = statusFilter === t.value
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => { setStatusFilter(t.value); setPage(1) }}
              className={cn('px-4 py-2.5 text-[15px] -mb-px transition-colors', active ? 'font-medium' : 'hover:text-[var(--text)]')}
              style={{
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <section className="rounded-md overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="p-2 overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead>
              <tr style={{ background: 'var(--surface-subtle)' }}>
                <th className={th} style={muted}>Product</th>
                <th className={th} style={muted}>Supplier</th>
                <th className={th} style={muted}>Quantity</th>
                <th className={th} style={muted}>Status</th>
                <th className={th} style={muted}>ETA</th>
                <th className={th} style={muted}>Created</th>
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
                  <td colSpan={colCount} className="px-4 py-10 text-center text-sm" style={muted}>No deliveries found</td>
                </tr>
              )}
              {data?.items.map((d) => {
                const badge = deliveryStatusBadge(d.status)
                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className="cursor-pointer transition-colors hover:bg-[var(--background)] last:border-b-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb name={d.product_name} src={d.product_image_url} size={48} />
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={ink}>{d.product_name ?? 'Unknown product'}</p>
                          <p className="text-sm mt-0.5" style={muted}>
                            {[d.product_sku, d.product_category].filter(Boolean).join('  |  ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={ink}>{d.supplier_name ?? 'Not set'}</td>
                    <td className="px-4 py-3">
                      <p className="tabular-nums" style={ink}>{d.quantity}</p>
                      <p className="text-sm" style={muted}>units</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: d.status === 'delayed' ? 'var(--danger)' : 'var(--text)' }}>
                      {d.eta ? formatDate(d.eta) : 'Not set'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={muted}>{formatDate(d.created_at)}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelected(d); setShowStatusModal(true) }}
                            className="text-sm font-medium px-3 py-1.5 rounded transition-colors hover:bg-[var(--primary-soft)]"
                            style={{ color: 'var(--primary)' }}
                          >
                            Update
                          </button>
                          {user?.role === 'admin' && ['processing', 'cancelled'].includes(d.status) && (
                            <button
                              onClick={() => deleteMutation.mutate(d.id)}
                              aria-label={`Delete delivery of ${d.product_name ?? 'product'}`}
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

      {/* Detail slide-over */}
      <SlideOver
        open={!!liveDelivery && !showStatusModal}
        onClose={() => setSelected(null)}
        title="Delivery details"
      >
        {liveDelivery && (
          <div className="space-y-7">
            <div className="flex items-center gap-4">
              <ProductThumb name={liveDelivery.product_name} src={liveDelivery.product_image_url} size={96} />
              <div className="min-w-0">
                <p className="font-serif text-xl leading-snug" style={ink}>{liveDelivery.product_name ?? 'Unknown product'}</p>
                <p className="text-sm mt-1" style={muted}>
                  {[liveDelivery.product_sku, liveDelivery.product_category].filter(Boolean).join('  |  ')}
                </p>
                <div className="mt-2">
                  <Badge variant={deliveryStatusBadge(liveDelivery.status).variant}>
                    {deliveryStatusBadge(liveDelivery.status).label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Detail label="Quantity">{liveDelivery.quantity} units</Detail>
              <Detail label="Supplier">{liveDelivery.supplier_name ?? 'Not set'}</Detail>
              <Detail label="ETA">
                <span style={{ color: liveDelivery.status === 'delayed' ? 'var(--danger)' : 'var(--text)' }}>
                  {liveDelivery.eta ? formatDate(liveDelivery.eta) : 'Not set'}
                </span>
              </Detail>
              <Detail label="Created">{formatDate(liveDelivery.created_at)}</Detail>
            </div>

            {liveDelivery.notes && (
              <div>
                <h3 className="font-serif text-lg mb-2" style={ink}>Notes</h3>
                <p className="text-[15px] leading-relaxed" style={ink}>{liveDelivery.notes}</p>
              </div>
            )}

            <p className="text-sm" style={muted}>Last updated {formatDateTime(liveDelivery.updated_at)}</p>

            {canEdit && (
              <Button onClick={() => setShowStatusModal(true)} className="w-full">
                Update status
              </Button>
            )}
          </div>
        )}
      </SlideOver>

      {/* Status update modal */}
      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update status">
        {liveDelivery && (
          <StatusUpdateForm delivery={liveDelivery} onClose={() => setShowStatusModal(false)} />
        )}
      </Modal>

      {/* Create delivery modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New delivery">
        <DeliveryForm onClose={() => setShowCreateModal(false)} />
      </Modal>
    </div>
  )
}

export default Deliveries
