import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

type SlideOverProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: 'sm' | 'md'
}

const SlideOver = ({ open, onClose, title, children, width = 'md' }: SlideOverProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 z-20 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'fixed right-0 top-0 h-full border-l z-30',
        'transform transition-transform duration-200 ease-out flex flex-col',
        width === 'md' ? 'w-[480px]' : 'w-[360px]',
        open ? 'translate-x-0' : 'translate-x-full'
        
      )}
        style={{ background: '#ffffff', borderLeft: '1px solid #e8eaf0' }}
      >
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </>
  )
}

export default SlideOver