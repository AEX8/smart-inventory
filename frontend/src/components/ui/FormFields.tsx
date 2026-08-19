import { cn } from '../../utils/cn'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = ({ label, error, className, ...props }: InputProps) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <input
      className={cn(
        'w-full border rounded-lg px-3 py-2 text-sm text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'placeholder:text-gray-400',
        error ? 'border-red-300' : 'border-gray-300',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <select
      className={cn(
        'w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        error ? 'border-red-300' : 'border-gray-300',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
  const variants = {
    // primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    primary: 'text-white disabled:opacity-50',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }
  return (
    <button
      type={type}
      className={cn(
        'rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      style={variant === 'primary' ? { background: '#4f5ef7' } : {}}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}