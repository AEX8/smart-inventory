import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Search, Mail, Clock, Package } from 'lucide-react'
import { suppliersApi } from '../api/suppliers'
import { useAuth } from '../hooks/useAuth'
import type { SupplierOut } from '../types/supplier'
import Modal from '../components/ui/Modal'
import { Button, Input } from '../components/ui/FormFields'

const muted = { color: 'var(--text-secondary)' }
const ink = { color: 'var(--text)' }

const apiError = (err: any) => {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail[0]?.msg ?? 'Invalid input'
  return detail ?? 'Something went wrong'
}

// "Stone & Clay Co." -> "SC"
const monogram = (name: string) => {
  const words = name.split(/\s+/).filter((w) => /^[a-z]/i.test(w))
  return (words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase()
}

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
        name: form.name,
        contact_email: form.contact_email,
        lead_time_days: form.lead_time_days,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      onClose()
    },
    onError: (err) => setError(apiError(err)),
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
        placeholder="e.g. Stone & Clay Co."
        required
      />
      <Input
        label="Contact email"
        type="email"
        value={form.contact_email}
        onChange={(e) => set('contact_email', e.target.value)}
        placeholder="orders@supplier.com"
        required
      />
      <Input
        label="Lead time (days)"
        type="number"
        min={1}
        value={form.lead_time_days}
        onChange={(e) => set('lead_time_days', Number(e.target.value))}
      />
      {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!form.name || !form.contact_email}
          className="flex-1"
        >
          {initial ? 'Save changes' : 'Add supplier'}
        </Button>
      </div>
    </form>
  )
}

const Fact = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 text-[15px] min-w-0" style={ink}>
    <span className="flex-shrink-0" style={muted}>{icon}</span>
    {children}
  </div>
)

const Suppliers = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'admin'
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<SupplierOut | null>(null)
  const [deleting, setDeleting] = useState<SupplierOut | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersApi.list(search || undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setDeleting(null)
    },
    onError: (err) => setDeleteError(apiError(err)),
  })

  const openDelete = (s: SupplierOut) => {
    setDeleteError('')
    setDeleting(s)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[40px] leading-tight" style={ink}>Suppliers</h1>
          <p className="font-serif text-lg mt-1" style={muted}>{data?.total ?? 0} trading partners</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setShowModal(true) }} className="py-2.5">
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Add supplier
            </span>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-fit">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={muted} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          aria-label="Search suppliers"
          className="w-80 pl-10 pr-4 py-2.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Cards */}
      {isLoading && <p className="text-sm" style={muted}>Loading...</p>}
      {!isLoading && data?.items.length === 0 && <p className="text-sm" style={muted}>No suppliers found</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {data?.items.map((s) => (
          <article
            key={s.id}
            className="rounded-md p-6 flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded flex items-center justify-center flex-shrink-0 font-serif text-lg"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                aria-hidden="true"
              >
                {monogram(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-xl leading-snug truncate" style={ink}>{s.name}</h2>
                <p className="text-sm mt-1" style={muted}>
                  Partner since {new Date(s.created_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <Fact icon={<Mail size={16} />}>
                {s.contact_email ? (
                  <a href={`mailto:${s.contact_email}`} className="truncate hover:underline" style={{ color: 'var(--primary)' }}>
                    {s.contact_email}
                  </a>
                ) : <span style={muted}>Not provided</span>}
              </Fact>
              <Fact icon={<Clock size={16} />}>
                {s.lead_time_days} day lead time
              </Fact>
              <Fact icon={<Package size={16} />}>
                {s.product_count} {s.product_count === 1 ? 'product' : 'products'} supplied
              </Fact>
            </div>

            {isAdmin && (
              <div className="mt-6 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Button variant="secondary" size="sm" onClick={() => { setEditing(s); setShowModal(true) }}>
                  <span className="flex items-center gap-1.5"><Pencil size={13} /> Edit</span>
                </Button>
                <button
                  onClick={() => openDelete(s)}
                  aria-label={`Delete ${s.name}`}
                  className="ml-auto p-2 rounded transition-colors hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                  style={muted}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit supplier' : 'Add supplier'}
      >
        <SupplierForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onClose={() => setShowModal(false)}
        />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete supplier">
        {deleting && (
          <div className="space-y-4">
            <p className="text-[15px]" style={ink}>
              Delete <span className="font-medium">{deleting.name}</span>? This cannot be undone.
            </p>
            {deleting.product_count > 0 && (
              <p className="text-sm rounded px-3 py-2" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                This supplier has {deleting.product_count} linked {deleting.product_count === 1 ? 'product' : 'products'}. Reassign them first.
              </p>
            )}
            {deleteError && <p className="text-sm" style={{ color: 'var(--danger)' }}>{deleteError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDeleting(null)} className="flex-1">Cancel</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                disabled={deleting.product_count > 0}
                onClick={() => deleteMutation.mutate(deleting.id)}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Suppliers
