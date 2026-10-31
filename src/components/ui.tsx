import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div
        className="pb-safe max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-full bg-panel-2 p-2" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Btn({
  children,
  onClick,
  kind = 'primary',
  className = '',
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'ghost' | 'danger'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const styles = {
    primary: 'bg-accent text-accent-ink font-semibold',
    ghost: 'bg-panel-2 text-ink',
    danger: 'bg-bad/15 text-bad',
  }[kind]
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 transition active:scale-[0.98] disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-mute">{label}</span>
      {children}
    </label>
  )
}

export const inputCls = 'w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent'

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mute">{children}</div>
}
