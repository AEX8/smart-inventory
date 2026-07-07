import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../../api/inventory'
import { suppliersApi } from '../../api/suppliers'
import { Input, Select, Button } from '../ui/FormFields'
import type { ProductOut } from '../../types/product'

const REASONS = [
  { value: 'restock', label: 'Restock' },
  { value: 'sold', label: 'Sold' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'returned', label: 'Returned' },
  { value: 'audit_correction', label: 'Audit correction' },
]

type ProductFormProps = {
  onClose: () => void
}

const ProductForm = ({ onClose }: ProductFormProps) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    initial_stock: 0,
    threshold: 10,
    supplier_id: '',
  })
  const [error, setError] = useState('')

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list(),
  })

  const supplierOptions = suppliers?.items.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.lead_time_days}d lead time)`,
  })) ?? []

  const mutation = useMutation({
    mutationFn: () => inventoryApi.create({
      name: form.name,
      sku: form.sku,
      category: form.category || undefined,
      initial_stock: form.initial_stock,
      threshold: form.threshold,
      supplier_id: form.supplier_id || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail ?? 'Something went wrong')
    },
  })

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="e.g. Widget A"
        required
      />
      <Input
        label="SKU"
        value={form.sku}
        onChange={(e) => set('sku', e.target.value.toUpperCase())}
        placeholder="e.g. WDG-001"
        required
      />
      <Input
        label="Category"
        value={form.category}
        onChange={(e) => set('category', e.target.value)}
        placeholder="e.g. Electronics"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Initial stock"
          type="number"
          min={0}
          value={form.initial_stock}
          onChange={(e) => set('initial_stock', Number(e.target.value))}
        />
        <Input
          label="Reorder threshold"
          type="number"
          min={1}
          value={form.threshold}
          onChange={(e) => set('threshold', Number(e.target.value))}
        />
      </div>
      <Select
        label="Supplier (optional)"
        value={form.supplier_id}
        onChange={(e) => set('supplier_id', e.target.value)}
        options={supplierOptions}
        placeholder="No supplier"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!form.name || !form.sku}
          className="flex-1"
        >
          Add product
        </Button>
      </div>
    </form>
  )
}

export default ProductForm


type StockAdjustFormProps = {
  productId: string
  productName: string
  currentStock: number
  onClose: () => void
}

export const StockAdjustForm = ({
  productId, productName, currentStock, onClose
}: StockAdjustFormProps) => {
  const queryClient = useQueryClient()
  const [delta, setDelta] = useState<string>('')
  const [reason, setReason] = useState('restock')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => inventoryApi.adjust(productId, Number(delta), reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['movements', productId] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail ?? 'Something went wrong')
    },
  })

  const newStock = currentStock + (Number(delta) || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500">Adjusting stock for</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{productName}</p>
        <p className="text-xs text-gray-400 mt-1">Current: {currentStock} units</p>
      </div>

      <Input
        label="Adjustment (use negative to reduce)"
        type="number"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        placeholder="Enter the amount"
      />

      <Select
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        options={REASONS}
      />

      {delta !== '' && Number(delta) !== 0 && (
        <div className={`text-xs px-3 py-2 rounded-lg ${newStock < 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          New stock will be: <span className="font-semibold">{newStock} units</span>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={delta === '' || Number(delta) === 0 || newStock < 0}
          className="flex-1"
        >
          Apply
        </Button>
      </div>
    </form>
  )
}

type EditProductFormProps = {
  product: ProductOut
  onClose: () => void
}

export const EditProductForm = ({ product, onClose }: EditProductFormProps) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: product.name,
    category: product.category ?? '',
    threshold: product.threshold.toString(),
    supplier_id: product.supplier_id ?? '',
  })
  const [error, setError] = useState('')

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list(),
  })

  const supplierOptions = suppliers?.items.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.lead_time_days}d lead time)`,
  })) ?? []

  const mutation = useMutation({
    mutationFn: () => inventoryApi.update(product.id, {
      name: form.name,
      category: form.category || undefined,
      threshold: Number(form.threshold),
      supplier_id: form.supplier_id || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail ?? 'Something went wrong')
    },
  })

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        required
      />
      <Input
        label="Category"
        value={form.category}
        onChange={(e) => set('category', e.target.value)}
        placeholder="e.g. Electronics"
      />
      <Input
        label="Reorder threshold"
        type="number"
        min={1}
        value={form.threshold}
        onChange={(e) => set('threshold', e.target.value)}
      />
      <Select
        label="Supplier (optional)"
        value={form.supplier_id}
        onChange={(e) => set('supplier_id', e.target.value)}
        options={supplierOptions}
        placeholder="No supplier"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!form.name}
          className="flex-1"
        >
          Save changes
        </Button>
      </div>
    </form>
  )
}