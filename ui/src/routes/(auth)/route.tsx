import {
  AppShell,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/(auth)')({
  component: AppLayout,
})

function AppNavbar() {
  const router = useRouter()
  const activeRouteIds = useRouterState({
    select: state => state.matches.map(match => match.routeId),
  })

  const layoutRoute = router.routesById['/(auth)']

  const navRoutes = useMemo(() => {
    const children = layoutRoute?.children

    if (!children) {
      return []
    }

    return Object.values(children)
      .filter(route => typeof route.options.staticData?.navName === 'string')
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }, [layoutRoute])

  if (!navRoutes.length) {
    return (
      <Text size="sm" c="dimmed">
        No navigation routes available
      </Text>
    )
  }

  return (
    <Group gap={0}>
      {navRoutes.map((route) => {
        const isActive = activeRouteIds.includes(route.id)

        return (
          <NavLink
            key={route.id}
            label={route.options.staticData?.navName ?? route.id}
            component={Link}
            to={route.to}
            active={isActive}
            style={{ width: 'auto' }}
          />
        )
      })}
    </Group>
  )
}

function AppLayout() {
  const { t } = useTranslation()

  return (
    <AppShell
      padding={0}
      header={{
        height: 60,
      }}
    >
      <AppShell.Header px={0}>
        <div className="content-area" style={{ height: '100%' }}>
          <Group justify="space-between" h="100%">
            <Title order={2}>{t('title')}</Title>
            <AppNavbar />
          </Group>
        </div>
      </AppShell.Header>

      <AppShell.Main>
        <Stack className="content-area" pb="xl">
          <Outlet />
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}
