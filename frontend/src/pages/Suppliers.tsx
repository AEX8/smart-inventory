import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { suppliersApi } from '../api/suppliers'
import { useAuth } from '../hooks/useAuth'
import type { SupplierOut } from '../types/supplier'
import Modal from '../components/ui/Modal'
import { Button, Input } from '../components/ui/FormFields'

const SupplierForm = ({
  initial, onClose,
}: {
  initial?: SupplierOut
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    contact_email: initial?.contact_email ?? '',
    lead_time_days: initial?.lead_time_days ?? 7,
  })
  const [error, setError] = useState('')
  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const mutation = useMutation({
    mutationFn: () => initial
      ? suppliersApi.update(initial.id, {
          ...form,
          contact_email: form.contact_email || undefined,
        })
      : suppliersApi.create({
          ...form,
          contact_email: form.contact_email || undefined,
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      onClose()
    },
    onError: (err: any) => setError(err.response?.data?.detail ?? 'Something went wrong'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Supplier name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="e.g. Acme Supplies"
        required
      />
      <Input
        label="Contact email (optional)"
        type="email"
        value={form.contact_email}
        onChange={(e) => set('contact_email', e.target.value)}
        placeholder="orders@supplier.com"
      />
      <Input
        label="Lead time (days)"
        type="number"
        min={1}
        value={form.lead_time_days}
        onChange={(e) => set('lead_time_days', Number(e.target.value))}
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
          {initial ? 'Save changes' : 'Add supplier'}
        </Button>
      </div>
    </form>
  )
}

const Suppliers = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<SupplierOut | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersApi.list(search || undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} suppliers</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => { setEditing(null); setShowModal(true) }}>
            <span className="flex items-center gap-1.5">
              <Plus size={14} />
              Add supplier
            </span>
          </Button>
        )}
      </div>

      <div className="max-w-xs">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">Contact email</th>
              <th className="text-left px-5 py-3 font-medium">Lead time</th>
              <th className="text-left px-5 py-3 font-medium">Added</th>
              {user?.role === 'admin' && (
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-xs">Loading...</td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-xs">No suppliers found</td>
              </tr>
            )}
            {data?.items.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-5 py-3 text-gray-500">{s.contact_email ?? '—'}</td>
                <td className="px-5 py-3 text-gray-500">{s.lead_time_days}d</td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                {user?.role === 'admin' && (
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditing(s); setShowModal(true) }}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit supplier' : 'Add supplier'}
      >
        <SupplierForm
          initial={editing ?? undefined}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default Suppliers