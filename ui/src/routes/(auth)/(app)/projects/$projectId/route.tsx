import {
  Box,
  Group,
  Select,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/(auth)/(app)/projects/$projectId')({
  component: ProjectDetailLayout,
})

function ProjectDetailLayout() {
  const { projectId } = Route.useParams()
  const { t } = useTranslation()
  const matchRoute = useMatchRoute()

  const isDatasets = !!matchRoute({
    to: '/projects/$projectId/datasets',
    fuzzy: true,
  })
  const isMembers = !!matchRoute({
    to: '/projects/$projectId/members',
    fuzzy: true,
  })
  const isSettings = !!matchRoute({
    to: '/projects/$projectId/settings',
    fuzzy: true,
  })

  const activeTab = isSettings
    ? 'settings'
    : isMembers
      ? 'members'
      : isDatasets
        ? 'datasets'
        : 'models'

  return (
    <Stack className="content-stack-20">
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          {t('project.label')}
          :
        </Text>
        <Select
          size="xs"
          value={projectId}
          data={[{
            value: projectId,
            label: projectId,
          }]}
          readOnly
          styles={{ input: { fontWeight: 500 } }}
        />
        <Text size="sm" c="dimmed">/</Text>
        <Title order={4}>
          {activeTab === 'models' && t('project.tabs.models')}
          {activeTab === 'datasets' && t('project.tabs.datasets')}
          {activeTab === 'members' && t('project.tabs.members')}
          {activeTab === 'settings' && t('project.tabs.settings')}
        </Title>
      </Group>

      <Tabs value={activeTab}>
        <Tabs.List>
          <Tabs.Tab
            value="models"
            component={Link}
            // @ts-expect-error valid route
            to={`/projects/${projectId}/models`}
          >
            {t('project.tabs.models')}
          </Tabs.Tab>
          <Tabs.Tab
            value="datasets"
            component={Link}
            // @ts-expect-error valid route
            to={`/projects/${projectId}/datasets`}
          >
            {t('project.tabs.datasets')}
          </Tabs.Tab>
          <Tabs.Tab
            value="members"
            component={Link}
            // @ts-expect-error valid route
            to={`/projects/${projectId}/members`}
          >
            {t('project.tabs.members')}
          </Tabs.Tab>
          <Tabs.Tab
            value="settings"
            component={Link}
            // @ts-expect-error valid route
            to={`/projects/${projectId}/settings`}
          >
            {t('project.tabs.settings')}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Box>
        <Outlet />
      </Box>
    </Stack>
  )
}
