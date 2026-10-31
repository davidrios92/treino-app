import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Btn, inputCls } from './ui'

type Mode = 'signin' | 'signup' | 'forgot'

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState(() => localStorage.getItem('treino.email') ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setInfo(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const em = email.trim()
    localStorage.setItem('treino.email', em)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password })
        if (error) setError(error.message.includes('not confirmed') ? 'Primero confirma tu email con el link que te mandamos.' : 'Email o contraseña incorrectos.')
      } else if (mode === 'signup') {
        if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
        const { data, error } = await supabase.auth.signUp({ email: em, password, options: { emailRedirectTo: location.origin } })
        if (error) return setError(error.message)
        if (!data.session) {
          setInfo('Te mandamos un email de confirmación. Toca el link (puede abrirse en Safari, no pasa nada) y después vuelve aquí y entra con tu contraseña.')
          setMode('signin')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: location.origin })
        if (error) return setError(error.message)
        setInfo('Te mandamos un link para crear una contraseña nueva. Ábrelo en Safari.')
        setMode('signin')
      }
    } finally {
      setBusy(false)
    }
  }

  const label = { signin: 'Entrar', signup: 'Crear cuenta', forgot: 'Enviarme el link' }[mode]

  return (
    <div className="pt-safe flex min-h-full flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-accent p-3 text-accent-ink">
            <Dumbbell size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Treino</h1>
            <p className="text-sm text-mute">Tu entrenamiento, en cualquier celular.</p>
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-panel p-1">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-xl py-2 text-sm ${mode === m ? 'bg-panel-2 font-semibold text-accent' : 'text-mute'}`}
              >
                {m === 'signin' ? 'Entrar' : 'Crear cuenta'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            className={inputCls}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode !== 'forgot' && (
            <input
              className={inputCls}
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={mode === 'signup' ? 'Contraseña (mín. 6 caracteres)' : 'Contraseña'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
          <Btn type="submit" className="w-full" disabled={busy || !email || (mode !== 'forgot' && !password)}>
            {busy ? 'Un momento…' : label}
          </Btn>
        </form>

        {mode === 'signin' && (
          <button className="mt-3 w-full py-2 text-sm text-mute" onClick={() => switchMode('forgot')}>
            Olvidé mi contraseña
          </button>
        )}
        {mode === 'forgot' && (
          <button className="mt-3 w-full py-2 text-sm text-mute" onClick={() => switchMode('signin')}>
            Volver
          </button>
        )}
        {info && <p className="mt-4 rounded-xl bg-accent/10 p-3 text-sm text-accent">{info}</p>}
        {error && <p className="mt-4 rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
      </div>
    </div>
  )
}

/** Shown after opening a password-reset link. */
export function SetNewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    onDone()
  }

  return (
    <div className="pt-safe flex min-h-full flex-col justify-center px-6">
      <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">Nueva contraseña</h1>
        <input
          className={inputCls}
          type="password"
          autoComplete="new-password"
          placeholder="Contraseña nueva (mín. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <Btn type="submit" className="w-full" disabled={busy || !password}>
          Guardar
        </Btn>
        {error && <p className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
      </form>
    </div>
  )
}
