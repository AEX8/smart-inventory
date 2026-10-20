import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const Modal = ({ open, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(32, 39, 43, 0.25)' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative rounded-md z-50',
          'w-full max-w-md mx-4'
        )}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="modal-title" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: 'var(--text-secondary)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal