import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Menu,
  Stack,
  Text,
} from '@mantine/core'
import { Link } from '@tanstack/react-router'

import type { Label } from '@matrixhub/api-ts/v1alpha1/model.pb'

export interface RepoCardProps {
  /** Display as "project / name" */
  project?: string
  name?: string
  /** Link destination */
  to: string
  /** Label items from API */
  labels?: Label[]
  /** Middle badges: e.g. parameterCount for model, downloads for dataset */
  extraBadge?: { icon: string
    text: string } | null
  /** Bottom meta info: project, size, updatedAt */
  size?: string
  updatedAt?: string
}

export function RepoCard({
  project,
  name,
  to,
  labels,
  extraBadge,
  size,
  updatedAt,
}: RepoCardProps) {
  const taskLabels = labels?.filter(l => l.category === 'TASK') ?? []
  const frameLabels = labels?.filter(l => l.category === 'LIBRARY') ?? []

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      component={Link}
      to={to}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <Stack gap="sm">
        {/* Title */}
        <Text fw={600} size="md">
          {project}
          {' '}
          /
          {name}
        </Text>

        {/* Labels row */}
        <Group gap="xs" wrap="wrap">
          {taskLabels.map(label => (
            <Badge key={label.id} variant="light" color="teal" size="sm" leftSection="📋">
              {label.name}
            </Badge>
          ))}
          {extraBadge && (
            <Badge variant="light" color="gray" size="sm" leftSection={extraBadge.icon}>
              {extraBadge.text}
            </Badge>
          )}
          {frameLabels.map(label => (
            <Badge key={label.id} variant="light" color="red" size="sm">
              {label.name}
            </Badge>
          ))}
          <Menu shadow="md" width={160} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="xs" color="gray" onClick={e => e.preventDefault()}>
                <Text size="xs">···</Text>
              </ActionIcon>
            </Menu.Target>
          </Menu>
        </Group>

        {/* Meta row */}
        <Group gap="lg">
          <Group gap={4}>
            <Text size="xs" c="dimmed">📁</Text>
            <Text size="xs" c="dimmed">{project}</Text>
          </Group>
          <Group gap={4}>
            <Text size="xs" c="dimmed">💾</Text>
            <Text size="xs" c="dimmed">{size ?? '-'}</Text>
          </Group>
          <Group gap={4}>
            <Text size="xs" c="dimmed">🕐</Text>
            <Text size="xs" c="dimmed">{updatedAt ?? '-'}</Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  )
}
