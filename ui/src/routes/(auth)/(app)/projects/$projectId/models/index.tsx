import {
  ActionIcon,
  Button,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { Models, type Model } from '@matrixhub/api-ts/v1alpha1/model.pb'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { RepoCard } from '@/components/RepoCard'

export const Route = createFileRoute(
  '/(auth)/(app)/projects/$projectId/models/',
)({
  component: ProjectModels,
})

function ProjectModels() {
  const { projectId } = Route.useParams()
  const { t } = useTranslation()

  const [models, setModels] = useState<Model[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(10)

  useEffect(() => {
    let active = true
    const sortParam = sortOrder === 'desc' ? `-${sort}` : sort

    Models.ListModels({
      project: projectId,
      search: search || undefined,
      sort: sortParam,
      page,
      pageSize: perPage,
    }).then((resp) => {
      if (!active) {
        return
      }
      setModels(resp.item ?? [])
      setTotalPages(resp.pagination?.pages ?? 1)
      setTotal(resp.pagination?.total ?? 0)
    }).catch(() => {
      if (!active) {
        return
      }
      setModels([])
    })

    return () => {
      active = false
    }
  }, [projectId, search, sort, sortOrder, page, perPage])

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
    setPage(1)
  }

  return (
    <Stack gap="md">
      {/* Toolbar */}
      <Group justify="space-between">
        <Group gap="sm">
          <Select
            size="sm"
            value={sort}
            onChange={(v) => {
              setSort(v ?? 'updatedAt')
              setPage(1)
            }}
            data={[
              {
                value: 'updatedAt',
                label: t('project.sort.updatedAt'),
              },
              {
                value: 'downloads',
                label: t('project.sort.downloads'),
              },
            ]}
            w={140}
          />
          <ActionIcon variant="subtle" size="input-sm" onClick={toggleSortOrder} title={sortOrder === 'desc' ? t('project.sort.desc') : t('project.sort.asc')}>
            <Text size="xs">{sortOrder === 'desc' ? '↓' : '↑'}</Text>
          </ActionIcon>
          <TextInput
            size="sm"
            placeholder={t('project.search.model')}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            leftSection={<Text size="xs" c="dimmed">🔍</Text>}
            w={240}
          />
        </Group>
        <Button size="sm" component={Link} to={`/projects/${projectId}/models`}>
          +
          {' '}
          {t('project.createModel')}
        </Button>
      </Group>

      {/* Card Grid */}
      <SimpleGrid
        cols={{
          base: 1,
          sm: 2,
        }}
        spacing="md"
      >
        {models.map(model => (
          <RepoCard
            key={model.id ?? model.name}
            project={model.project}
            name={model.name}
            to={`/projects/${projectId}/models/${model.name}`}
            labels={model.labels}
            extraBadge={model.parameterCount
              ? {
                  icon: '⚙',
                  text: model.parameterCount,
                }
              : null}
            size={model.size}
            updatedAt={model.updatedAt}
          />
        ))}
      </SimpleGrid>

      {models.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          {t('project.noModels')}
        </Text>
      )}

      {/* Pagination */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {t('project.totalRecords', { count: total })}
        </Text>
        <Group gap="sm">
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            size="sm"
          />
          <Select
            size="xs"
            value={String(perPage)}
            onChange={(v) => {
              setPerPage(Number(v ?? 10))
              setPage(1)
            }}
            data={[
              {
                value: '6',
                label: t('project.perPage', { count: 6 }),
              },
              {
                value: '10',
                label: t('project.perPage', { count: 10 }),
              },
              {
                value: '20',
                label: t('project.perPage', { count: 20 }),
              },
            ]}
            w={120}
          />
        </Group>
      </Group>
    </Stack>
  )
}
