import { cn } from '../../utils/cn'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = ({ label, error, className, ...props }: InputProps) => (
  <div>
    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
    <input
      className={cn(
        'w-full rounded px-3 py-2 text-sm transition-colors',
        'focus:outline-none',
        'placeholder:text-gray-400',
        className
      )}
      style={{
        background: 'var(--surface)',
        border: error ? '1px solid var(--danger)' : '1px solid var(--border)',
        color: 'var(--text)',
      }}
      onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onBlur={e => (e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border)')}
      {...props}
    />
    {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
  </div>
)

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = ({ label, error, options, placeholder, className, ...props }: SelectProps) => (
  <div>
    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
    <select
      className={cn('w-full rounded px-3 py-2 text-sm focus:outline-none', className)}
      style={{
        background: 'var(--surface)',
        border: error ? '1px solid var(--danger)' : '1px solid var(--border)',
        color: 'var(--text)',
      }}
      onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onBlur={e => (e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border)')}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
  </div>
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  type = 'button',
  ...props
}: ButtonProps) => {
  const base = 'rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }

  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'var(--on-primary)', border: 'none' },
    secondary: { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: 'white', border: 'none' },
  }

  return (
    <button
      type={type}
      className={cn(base, sizes[size], className)}
      style={styles[variant]}
      onMouseEnter={e => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--primary-hover)'
        if (variant === 'secondary') e.currentTarget.style.background = 'var(--surface-subtle)'
      }}
      onMouseLeave={e => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--primary)'
        if (variant === 'secondary') e.currentTarget.style.background = 'transparent'
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}