import { MantineProvider } from '@mantine/core'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './i18n/index.ts'
import '@mantine/core/styles.css'
import './index.css'
import { mantineTheme } from './mantineTheme'
import { router } from './router.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

if (import.meta.env.VITE_DEV_DEPLOY) {
  // Dev deploy mode: dynamically import dev app with Service Worker API proxy.
  // This entire branch is dead-code-eliminated in production builds.
  import('./features/dev-deploy/DevApp').then(({ mountDevApp }) => {
    mountDevApp(rootElement)
  })
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <MantineProvider theme={mantineTheme}>
        <RouterProvider router={router} />
      </MantineProvider>
    </StrictMode>,
  )
}
