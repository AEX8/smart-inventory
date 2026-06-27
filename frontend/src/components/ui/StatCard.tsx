import { cn } from '../../utils/cn'

type StatCardProps = {
  label: string
  value: number | string
  icon: React.ReactNode
  alert?: boolean
  sublabel?: string
}

const StatCard = ({ label, value, icon, alert, sublabel }: StatCardProps) => (
  <div className={cn(
    'bg-white rounded-xl border p-5 flex items-start justify-between',
    alert ? 'border-red-200' : 'border-gray-200'
  )}>
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={cn(
        'text-3xl font-semibold',
        alert ? 'text-red-600' : 'text-gray-900'
      )}>
        {value}
      </p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
    <div className={cn(
      'p-2 rounded-lg',
      alert ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
    )}>
      {icon}
    </div>
  </div>
)

export default StatCard