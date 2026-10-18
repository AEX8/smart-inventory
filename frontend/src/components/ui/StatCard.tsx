type StatCardProps = {
  label: string
  value: number | string
  icon: React.ReactNode
  alert?: boolean
  sublabel?: string
}

const StatCard = ({ label, value, icon, alert, sublabel }: StatCardProps) => (
  <div className="flex-1 px-8 py-6 flex items-start gap-4 border-r border-[var(--border)] last:border-r-0 first:pl-0">
    <div className="mt-1" style={{ color: alert ? 'var(--danger)' : 'var(--text-secondary)' }}>
      {icon}
    </div>
    <div>
      <p className="text-base mb-2" style={{ color: 'var(--text)' }}>{label}</p>
      <p
        className="tabular-nums leading-none"
        style={{
          fontFamily: 'Libre Baskerville, Georgia, serif',
          fontSize: '38px',
          color: alert ? 'var(--danger)' : 'var(--text)',
        }}
      >
        {value}
      </p>
      {sublabel && <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{sublabel}</p>}
    </div>
  </div>
)

export default StatCard