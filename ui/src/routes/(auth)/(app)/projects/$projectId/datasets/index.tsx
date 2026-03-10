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
import { Datasets, type Dataset } from '@matrixhub/api-ts/v1alpha1/dataset.pb'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { RepoCard } from '@/components/RepoCard'

export const Route = createFileRoute(
  '/(auth)/(app)/projects/$projectId/datasets/',
)({
  component: ProjectDatasets,
})

function ProjectDatasets() {
  const { projectId } = Route.useParams()
  const { t } = useTranslation()

  const [datasets, setDatasets] = useState<Dataset[]>([])
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

    Datasets.ListDatasets({
      search: search || undefined,
      sort: sortParam,
      page,
      pageSize: perPage,
    }).then((resp) => {
      if (!active) {
        return
      }
      const filtered = (resp.items ?? []).filter(d => d.project === projectId)

      setDatasets(filtered)
      setTotalPages(resp.pagination?.pages ?? 1)
      setTotal(resp.pagination?.total ?? 0)
    }).catch(() => {
      if (!active) {
        return
      }
      setDatasets([])
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
            placeholder={t('project.search.dataset')}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            leftSection={<Text size="xs" c="dimmed">🔍</Text>}
            w={240}
          />
        </Group>
        <Button size="sm" component={Link} to={`/projects/${projectId}/datasets`}>
          +
          {' '}
          {t('project.createDataset')}
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
        {datasets.map(dataset => (
          <RepoCard
            key={dataset.id ?? dataset.name}
            project={dataset.project}
            name={dataset.name}
            to={`/projects/${projectId}/datasets/${dataset.name}`}
            labels={dataset.labels}
            extraBadge={dataset.downloads
              ? {
                  icon: '↓',
                  text: dataset.downloads,
                }
              : null}
            size={dataset.size}
            updatedAt={dataset.updatedAt}
          />
        ))}
      </SimpleGrid>

      {datasets.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          {t('project.noDatasets')}
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
