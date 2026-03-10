import {
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Projects } from '@matrixhub/api-ts/v1alpha1/project.pb'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute(
  '/(auth)/(app)/projects/$projectId/settings/',
)({
  component: ProjectSettings,
})

function ProjectSettings() {
  const { projectId } = Route.useParams()
  const { t } = useTranslation()

  const [deleteOpened, {
    open: openDelete, close: closeDelete,
  }] = useDisclosure(false)

  const handleDelete = async () => {
    try {
      await Projects.DeleteProject({ name: projectId })
      closeDelete()
      window.location.href = '/projects'
    } catch {
      // handle error
    }
  }

  return (
    <Stack gap="lg">
      <Card withBorder padding="lg" style={{ borderColor: 'var(--mantine-color-red-3)' }}>
        <Stack gap="md">
          <Title order={5} c="red">{t('project.settings.dangerZone')}</Title>
          <Text size="sm" c="dimmed">
            {t('project.settings.deleteDesc')}
          </Text>
          <Button color="red" variant="outline" onClick={openDelete} w="fit-content">
            {t('project.settings.delete')}
          </Button>
        </Stack>
      </Card>

      <Modal opened={deleteOpened} onClose={closeDelete} title={t('project.settings.deleteTitle')}>
        <Stack gap="md">
          <Text>{t('project.settings.deleteConfirm', { name: projectId })}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDelete}>{t('common.cancel')}</Button>
            <Button color="red" onClick={handleDelete}>{t('common.confirm')}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
