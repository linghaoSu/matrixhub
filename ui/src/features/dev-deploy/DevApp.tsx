import { MantineProvider } from '@mantine/core'
import { RouterProvider } from '@tanstack/react-router'
import {
  StrictMode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createRoot } from 'react-dom/client'

import '@mantine/core/styles.css'
import '../../index.css'
import { mantineTheme } from '../../mantineTheme'
import { router } from '../../router'

const STORAGE_KEY = 'dev-api-proxy-target'

function useServiceWorker() {
  const swRef = useRef<ServiceWorker | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    navigator.serviceWorker
      .register('/api-proxy-sw.js')
      .then((reg) => {
        const sw = reg.active || reg.installing || reg.waiting
        if (sw) {
          if (sw.state === 'activated') {
            swRef.current = sw
            setReady(true)
          } else {
            sw.addEventListener('statechange', () => {
              if (sw.state === 'activated') {
                swRef.current = sw
                setReady(true)
              }
            })
          }
        }
      })
  }, [])

  const sendTarget = useCallback((target: string) => {
    const sw = swRef.current ?? navigator.serviceWorker.controller
    sw?.postMessage({ type: 'SET_API_TARGET', target })
  }, [])

  return { ready, sendTarget }
}

function ConfigModal({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState('')

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 10000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        minWidth: 400,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Dev Deploy Configuration</h2>
        <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
          Enter the backend API server URL to proxy <code>/api</code> requests.
        </p>
        <input
          type="url"
          placeholder="https://your-api-server.example.com"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onSubmit(value.trim()) }}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 8,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          disabled={!value.trim()}
          onClick={() => onSubmit(value.trim())}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '10px 0',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: value.trim() ? '#228be6' : '#aaa',
            border: 'none',
            borderRadius: 8,
            cursor: value.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Connect
        </button>
      </div>
    </div>
  )
}

function DevToolbar({ target, onEdit }: { target: string, onEdit: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1a1b1e',
      color: '#c1c2c5',
      padding: '6px 16px',
      fontSize: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 10000,
      fontFamily: 'monospace',
    }}>
      <span style={{ color: '#51cf66', fontWeight: 700 }}>DEV</span>
      <span>API → {target}</span>
      <button
        type="button"
        onClick={onEdit}
        style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: '1px solid #555',
          color: '#c1c2c5',
          borderRadius: 4,
          padding: '2px 10px',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        Edit
      </button>
    </div>
  )
}

function DevAppRoot() {
  const { ready, sendTarget } = useServiceWorker()
  const [apiTarget, setApiTarget] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [editing, setEditing] = useState(!apiTarget)

  useEffect(() => {
    if (ready && apiTarget) {
      sendTarget(apiTarget)
    }
  }, [ready, apiTarget, sendTarget])

  const handleSubmit = (url: string) => {
    localStorage.setItem(STORAGE_KEY, url)
    setApiTarget(url)
    setEditing(false)
    sendTarget(url)
  }

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666' }}>
        Initializing service worker...
      </div>
    )
  }

  if (editing || !apiTarget) {
    return (
      <MantineProvider theme={mantineTheme}>
        <ConfigModal onSubmit={handleSubmit} />
      </MantineProvider>
    )
  }

  return (
    <StrictMode>
      <MantineProvider theme={mantineTheme}>
        <RouterProvider router={router} />
        <DevToolbar target={apiTarget} onEdit={() => setEditing(true)} />
      </MantineProvider>
    </StrictMode>
  )
}

export function mountDevApp(rootElement: HTMLElement) {
  createRoot(rootElement).render(<DevAppRoot />)
}
