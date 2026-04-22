import { Component, StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const RUNTIME_CRASH_STORAGE_KEY = 'ps-runtime-crash'

function buildCrashPayload(error, context = {}) {
  const message =
    error && typeof error === 'object' && 'message' in error && error.message
      ? String(error.message)
      : typeof error === 'string'
        ? error
        : context.fallbackMessage || 'Unknown runtime error.'
  const stack =
    error && typeof error === 'object' && 'stack' in error && error.stack
      ? String(error.stack)
      : ''
  return {
    message,
    stack,
    source: context.source || 'runtime',
    timestamp: new Date().toISOString(),
    pathname:
      typeof window !== 'undefined' && window.location
        ? window.location.pathname
        : '',
  }
}

function persistCrashPayload(payload) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      RUNTIME_CRASH_STORAGE_KEY,
      JSON.stringify(payload),
    )
  } catch (error) {
    console.error('Failed persisting runtime crash payload', error)
  }
}

function readPersistedCrashPayload() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(RUNTIME_CRASH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch (error) {
    console.error('Failed reading runtime crash payload', error)
    return null
  }
}

function clearPersistedCrashPayload() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(RUNTIME_CRASH_STORAGE_KEY)
  } catch (error) {
    console.error('Failed clearing runtime crash payload', error)
  }
}

function RuntimeCrashScreen({ crash, onRetry }) {
  const diagnosticText = useMemo(
    () =>
      [
        `Source: ${crash && crash.source ? crash.source : 'runtime'}`,
        `Path: ${crash && crash.pathname ? crash.pathname : ''}`,
        `Time: ${crash && crash.timestamp ? crash.timestamp : ''}`,
        `Message: ${crash && crash.message ? crash.message : 'Unknown runtime error.'}`,
        crash && crash.stack ? `Stack:\n${crash.stack}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    [crash],
  )

  const copyDiagnostic = async () => {
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(diagnosticText)
      }
    } catch (error) {
      console.error('Failed copying runtime diagnostic', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-rose-200 bg-white shadow-2xl dark:border-rose-900 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 dark:border-rose-900 dark:bg-rose-950/30">
          <p className="text-sm font-bold text-rose-800 dark:text-rose-100">
            La app detecto un error y mostro este diagnostico.
          </p>
          <p className="mt-1 text-xs text-rose-700/90 dark:text-rose-200/90">
            Esto nos ayuda a ver el mensaje exacto del fallo en lugar del pantallazo blanco.
          </p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Error
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
              {crash && crash.message ? crash.message : 'Unknown runtime error.'}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {crash && crash.source ? crash.source : 'runtime'}
              {crash && crash.pathname ? ` - ${crash.pathname}` : ''}
            </p>
          </div>
          {crash && crash.stack ? (
            <pre className="max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-[11px] leading-5 text-slate-100 dark:border-slate-800">
              {crash.stack}
            </pre>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={copyDiagnostic}
              className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Copiar error
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Intentar otra vez
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Recargar pagina
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Root app crashed', error, info)
    if (typeof this.props.onCrash === 'function') {
      this.props.onCrash(
        buildCrashPayload(error, {
          source: 'root-boundary',
          fallbackMessage: 'The application crashed while rendering.',
        }),
      )
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function AppBootstrap() {
  const [runtimeCrash, setRuntimeCrash] = useState(() =>
    readPersistedCrashPayload(),
  )
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const handleCrash = (payload) => {
      persistCrashPayload(payload)
      setRuntimeCrash(payload)
    }

    const handleWindowError = (event) => {
      handleCrash(
        buildCrashPayload(event && event.error ? event.error : event.message, {
          source: 'window-error',
          fallbackMessage: 'Unhandled window error.',
        }),
      )
    }

    const handleWindowRejection = (event) => {
      handleCrash(
        buildCrashPayload(event ? event.reason : null, {
          source: 'unhandledrejection',
          fallbackMessage: 'Unhandled promise rejection.',
        }),
      )
    }

    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleWindowRejection)
    return () => {
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleWindowRejection)
    }
  }, [])

  if (runtimeCrash) {
    return (
      <RuntimeCrashScreen
        crash={runtimeCrash}
        onRetry={() => {
          clearPersistedCrashPayload()
          setRuntimeCrash(null)
          setRetryKey((value) => value + 1)
        }}
      />
    )
  }

  return (
    <RootErrorBoundary
      resetKey={retryKey}
      fallback={<RuntimeCrashScreen crash={readPersistedCrashPayload()} onRetry={() => {
        clearPersistedCrashPayload()
        setRuntimeCrash(null)
        setRetryKey((value) => value + 1)
      }} />}
      onCrash={(payload) => {
        persistCrashPayload(payload)
        setRuntimeCrash(payload)
      }}
    >
      <App />
    </RootErrorBoundary>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)
