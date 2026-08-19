import { cn } from '../../utils/cn'

type StatCardProps = {
  label: string
  value: number | string
  icon: React.ReactNode
  alert?: boolean
  sublabel?: string
}

const StatCard = ({ label, value, icon, alert, sublabel }: StatCardProps) => (
  <div
    className="bg-white rounded-xl p-5 flex items-start justify-between"
    style={{
      border: '1px solid #e5e7eb',
      borderLeft: alert ? '3px solid #ef4444' : '3px solid #4f5ef7',
    }}
  >
    <div>
      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">{label}</p>
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
      alert ? 'bg-red-50 text-red-400' : 'bg-indigo-50 text-indigo-500'
    )}>
      {icon}
    </div>
  </div>
)

export default StatCard