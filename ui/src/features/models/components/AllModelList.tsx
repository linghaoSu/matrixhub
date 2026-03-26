import {
  Box,
  Center,
  Group,
  Space,
  Stack,
  Text,
} from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { startTransition } from 'react'
import { useTranslation } from 'react-i18next'

import {
  modelsCatalogQueryOptions,
  PAGE_SIZE,
} from '@/features/models/models.query'
import { Pagination } from '@/shared/components/Pagination'
import { ModelCard } from '@/shared/components/resource-card/ModelCard.tsx'
import { ResourceCardGrid } from '@/shared/components/ResourceCardGrid'
import { SearchToolbar } from '@/shared/components/SearchToolbar'
import {
  SortDropdown,
  type SortDropdownOption,
} from '@/shared/components/SortDropdown'

const modelsRouteApi = getRouteApi('/(auth)/(app)/models/')

export function AllModelList() {
  const { t } = useTranslation()
  const navigate = modelsRouteApi.useNavigate()
  const search = modelsRouteApi.useSearch()
  const { data } = useSuspenseQuery(modelsCatalogQueryOptions(search))
  const {
    q: query = '', sort: sortField = 'updatedAt', order: sortOrder = 'desc', page = 1,
  } = search
  const {
    items = [],
    pagination,
  } = data

  const total = pagination?.total ?? 0
  const totalPages = pagination?.pages
    ?? (
      pagination?.total && pagination?.pageSize
        ? Math.ceil(pagination.total / pagination.pageSize)
        : 0
    )

  const sortFieldOptions: SortDropdownOption[] = [
    {
      value: 'updatedAt',
      label: t('projects.detail.modelsPage.sortFieldUpdatedAt'),
      icon: <IconClock size={16} />,
    },
  ]

  const cardElements = items.map((model) => {
    const projectId = model.project?.trim() ?? '-'
    const modelName = model.name?.trim() ?? '-'

    return <ModelCard key={`${projectId}/${modelName}`} model={model} />
  })

  return (
    <Box>
      <Group>
        <Text fz="md" fw={600} lh="20px" mb="sm">
          {t('model.allModels') }
        </Text>
      </Group>

      <Stack gap={0}>
        <SearchToolbar
          searchPlaceholder={t('projects.detail.modelsPage.searchPlaceholder')}
          searchValue={query}
          onSearchChange={(nextQuery) => {
            void navigate({
              replace: true,
              search: prev => ({
                ...prev,
                q: nextQuery,
                page: 1,
              }),
            })
          }}
        >
          <SortDropdown
            fieldOptions={sortFieldOptions}
            fieldValue={sortField}
            order={sortOrder}
            onFieldChange={(nextField) => {
              if (sortFieldOptions.find(o => o.value === nextField)?.disabled) {
                return
              }

              startTransition(() => {
                void navigate({
                  replace: true,
                  search: prev => ({
                    ...prev,
                    sort: nextField === 'updatedAt' ? nextField : prev.sort,
                    order: sortOrder,
                    page: 1,
                  }),
                })
              })
            }}
            onToggleOrder={() => {
              startTransition(() => {
                void navigate({
                  replace: true,
                  search: prev => ({
                    ...prev,
                    order: sortOrder === 'desc' ? 'asc' : 'desc',
                    page: 1,
                  }),
                })
              })
            }}
          />
        </SearchToolbar>

        <Space h="lg" />

        <Box miw={780} maw={1380}>
          <ResourceCardGrid
            loading={false}
            skeletonCount={PAGE_SIZE}
          >
            {cardElements}
          </ResourceCardGrid>

          {items.length === 0 && (
            <Center py="xl">
              <Stack align="center" gap="xs">
                <Text fw={500}>{t('projects.detail.modelsPage.emptyTitle')}</Text>
                <Text size="sm" c="dimmed">
                  {t('projects.detail.modelsPage.emptyDescription')}
                </Text>
              </Stack>
            </Center>
          )}

          <Pagination
            total={total}
            totalPages={totalPages}
            page={page}
            paginationProps={{ withControls: false }}
            onPageChange={(nextPage) => {
              void navigate({
                search: prev => ({
                  ...prev,
                  page: nextPage,
                }),
              })
            }}
          />
        </Box>
      </Stack>
    </Box>
  )
}
