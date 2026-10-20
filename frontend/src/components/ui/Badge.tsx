import { cn } from '../../utils/cn'

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray'

type BadgeProps = {
  children: React.ReactNode
  variant: BadgeVariant
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #c3dcc5' },
  amber: { background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid #f0d5a0' },
  red:   { background: 'var(--danger-bg)',  color: 'var(--danger)',  border: '1px solid #efc4bc' },
  blue:  { background: 'var(--info-bg)',    color: 'var(--info)',    border: '1px solid #bdd0e0' },
  gray:  { background: 'var(--neutral-bg)', color: 'var(--neutral)', border: '1px solid #d4d8db' },
}

const Badge = ({ children, variant }: BadgeProps) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium"
    style={variantStyles[variant]}
  >
    <span
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: 'currentColor' }}
    />
    {children}
  </span>
)

export default Badge

export const stockStatusBadge = (quantity: number, threshold: number) => {
  if (quantity === 0) return { label: 'Critical', variant: 'red' as BadgeVariant }
  if (quantity <= threshold) return { label: 'Low', variant: 'amber' as BadgeVariant }
  if (quantity > threshold * 5) return { label: 'Overstock', variant: 'blue' as BadgeVariant }
  return { label: 'Healthy', variant: 'green' as BadgeVariant }
}

export const deliveryStatusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    processing: { label: 'Processing', variant: 'gray' },
    in_transit:  { label: 'In Transit', variant: 'blue' },
    delivered:   { label: 'Delivered',  variant: 'green' },
    delayed:     { label: 'Delayed',    variant: 'amber' },
    cancelled:   { label: 'Cancelled',  variant: 'gray' },
  }
  return map[status] ?? { label: status, variant: 'gray' as BadgeVariant }
}