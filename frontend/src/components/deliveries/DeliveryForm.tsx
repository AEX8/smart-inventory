import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '../../api/deliveries'
import { inventoryApi } from '../../api/inventory'
import { Input, Select, Button } from '../ui/FormFields'
import type { DeliveryStatus, DeliveryOut } from '../../types/delivery'
import { STATUS_TRANSITIONS } from '../../types/delivery'
import { deliveryStatusBadge } from '../ui/Badge'

type DeliveryFormProps = {
  onClose: () => void
}

export const DeliveryForm = ({ onClose }: DeliveryFormProps) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    product_id: '',
    quantity: 1,
    eta: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const { data: products } = useQuery({
    queryKey: ['inventory', { page_size: 100 }],
    queryFn: () => inventoryApi.list({ page_size: 100 }),
  })

  const mutation = useMutation({
    mutationFn: () => deliveriesApi.create({
      product_id: form.product_id,
      quantity: form.quantity,
      eta: form.eta || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail ?? 'Something went wrong')
    },
  })

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const productOptions = products?.items.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.sku})`,
  })) ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Product"
        value={form.product_id}
        onChange={(e) => set('product_id', e.target.value)}
        options={productOptions}
        placeholder="Select a product..."
        required
      />
      <Input
        label="Quantity"
        type="number"
        min={1}
        value={form.quantity}
        onChange={(e) => set('quantity', Number(e.target.value))}
      />
      <Input
        label="Expected arrival (optional)"
        type="datetime-local"
        value={form.eta}
        onChange={(e) => set('eta', e.target.value)}
      />
      <Input
        label="Notes (optional)"
        value={form.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Any additional info..."
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!form.product_id || form.quantity < 1}
          className="flex-1"
        >
          Create delivery
        </Button>
      </div>
    </form>
  )
}


type StatusUpdateFormProps = {
  delivery: DeliveryOut
  onClose: () => void
}

export const StatusUpdateForm = ({ delivery, onClose }: StatusUpdateFormProps) => {
  const queryClient = useQueryClient()
  const allowed = STATUS_TRANSITIONS[delivery.status as DeliveryStatus]
  const [status, setStatus] = useState(allowed[0] ?? '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => deliveriesApi.updateStatus(delivery.id, status, notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail ?? 'Something went wrong')
    },
  })

  const statusOptions = allowed.map((s) => ({
    value: s,
    label: deliveryStatusBadge(s).label,
  }))

  if (allowed.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          This delivery is <span className="font-medium text-gray-900">{delivery.status}</span> —
          a terminal status and cannot be updated further.
        </p>
        <Button type="button" variant="secondary" onClick={onClose} className="w-full">Close</Button>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500">Updating delivery for</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{delivery.product_name ?? '—'}</p>
        <p className="text-xs text-gray-400 mt-1">
          Current status: <span className="capitalize">{delivery.status.replace('_', ' ')}</span>
        </p>
      </div>

      <Select
        label="New status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        options={statusOptions}
      />
      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reason for status change..."
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!status}
          className="flex-1"
        >
          Update status
        </Button>
      </div>
    </form>
  )
}