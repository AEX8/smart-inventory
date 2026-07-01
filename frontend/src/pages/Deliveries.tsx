import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { deliveriesApi } from '../api/deliveries'
import { useAuth } from '../hooks/useAuth'
import type { DeliveryOut } from '../types/delivery'
import Badge, { deliveryStatusBadge } from '../components/ui/Badge'
import SlideOver from '../components/ui/SlideOver'
import Modal from '../components/ui/Modal'
import { Button } from '../components/ui/FormFields'
import { DeliveryForm, StatusUpdateForm } from '../components/deliveries/DeliveryForm'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'processing', label: 'Processing' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const Deliveries = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Deliveries</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} total</p>
        </div>
        {user?.role !== 'driver' && (
          <Button onClick={() => setShowCreateModal(true)}>
            <span className="flex items-center gap-1.5">
              <Plus size={14} />
              New delivery
            </span>
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
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
              <th className="text-left px-5 py-3 font-medium">Product</th>
              <th className="text-left px-5 py-3 font-medium">Qty</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">ETA</th>
              <th className="text-left px-5 py-3 font-medium">Created</th>
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
                  No deliveries found
                </td>
              </tr>
            )}
            {data?.items.map((d) => {
              const badge = deliveryStatusBadge(d.status)
              return (
                <tr
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{d.product_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{d.quantity}</td>
                  <td className="px-5 py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {d.eta ? new Date(d.eta).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  {user?.role !== 'driver' && (
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setSelected(d); setShowStatusModal(true) }}
                          className="text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Update
                        </button>
                        {user?.role === 'admin' && ['processing', 'cancelled'].includes(d.status) && (
                          <button
                            onClick={() => deleteMutation.mutate(d.id)}
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

      {/* Detail slide-over */}
      <SlideOver
        open={!!liveDelivery && !showStatusModal}
        onClose={() => setSelected(null)}
        title="Delivery details"
      >
        {liveDelivery && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Product</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{liveDelivery.product_name ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Quantity</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{liveDelivery.quantity} units</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Status</p>
                <div className="mt-1">
                  <Badge variant={deliveryStatusBadge(liveDelivery.status).variant}>
                    {deliveryStatusBadge(liveDelivery.status).label}
                  </Badge>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">ETA</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {liveDelivery.eta ? new Date(liveDelivery.eta).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            {liveDelivery.notes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{liveDelivery.notes}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p>Created {new Date(liveDelivery.created_at).toLocaleString()}</p>
              <p>Updated {new Date(liveDelivery.updated_at).toLocaleString()}</p>
            </div>

            {user?.role !== 'driver' && (
              <Button
                onClick={() => setShowStatusModal(true)}
                variant="secondary"
                className="w-full"
              >
                Update status
              </Button>
            )}
          </div>
        )}
      </SlideOver>

      {/* Status update modal */}
      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update status">
        {liveDelivery && (
          <StatusUpdateForm
            delivery={liveDelivery}
            onClose={() => setShowStatusModal(false)}
          />
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