import {
  Box, Collapse, Group, Text, UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { modelsCatalogQueryOptions } from '@/features/models/models.query'
import { ModelCard } from '@/shared/components/resource-card/ModelCard.tsx'
import { ResourceCardGrid } from '@/shared/components/ResourceCardGrid'

const modelsRouteApi = getRouteApi('/(auth)/(app)/models/')

export function HotModelList() {
  const { t } = useTranslation()
  const [opened, { toggle }] = useDisclosure(false)
  const search = modelsRouteApi.useSearch()
  const { data } = useSuspenseQuery(modelsCatalogQueryOptions(search))
  const { items = [] } = data
  const hotModels = items.slice(0, 6)

  const cardElements = hotModels.map((model) => {
    const projectId = model.project?.trim() ?? '-'
    const modelName = model.name?.trim() ?? '-'

    return <ModelCard key={`${projectId}/${modelName}`} model={model} />
  })

  return (
    <Box>
      <Group justify="space-between">
        <Text fz="md" fw={600} lh="20px" mb="sm">
          {t('model.recommend') }
        </Text>
        {hotModels.length > 4 && (
          <UnstyledButton onClick={toggle} fz="sm">
            {t('model.viewMore')}
          </UnstyledButton>
        )}
      </Group>
      <Box miw={780} maw={1380}>
        <ResourceCardGrid>
          {cardElements.slice(0, 4)}
        </ResourceCardGrid>
        <Collapse in={opened}>
          <Box pt="lg">
            <ResourceCardGrid>
              {cardElements.slice(4)}
            </ResourceCardGrid>
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}
