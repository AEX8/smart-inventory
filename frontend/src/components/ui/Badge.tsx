import { cn } from '../../utils/cn'

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray'

type BadgeProps = {
  children: React.ReactNode
  variant: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red:   'bg-red-50 text-red-700 border-red-200',
  blue:  'bg-blue-50 text-blue-700 border-blue-200',
  gray:  'bg-gray-50 text-gray-600 border-gray-200',
}

const Badge = ({ children, variant }: BadgeProps) => (
  <span className={cn(
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
    variants[variant]
  )}>
    {children}
  </span>
)

export default Badge

// helpers
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
    cancelled:   { label: 'Cancelled',  variant: 'red' },
  }
  return map[status] ?? { label: status, variant: 'gray' as BadgeVariant }
}