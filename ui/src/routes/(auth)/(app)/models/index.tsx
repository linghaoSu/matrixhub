import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { modelsCatalogQueryOptions } from '@/features/models/models.query'
import { ModelsPage } from '@/features/models/pages/ModelsPage'

const modelsSearchSchema = z.object({
  q: z.string().trim().optional(),
  sort: z.literal('updatedAt').optional().catch('updatedAt'),
  order: z.enum(['asc', 'desc']).optional().catch('desc'),
  page: z.coerce.number().int().positive().optional().catch(1),
  task: z.string().optional(),
  library: z.string().optional(),
  project: z.string().optional(),
})

export type ModelsCatalogSearch = z.infer<typeof modelsSearchSchema>

export const Route = createFileRoute('/(auth)/(app)/models/')({
  component: ModelsPage,
  validateSearch: modelsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  async loader({
    context: { queryClient },
    deps: { search },
  }) {
    await queryClient.ensureQueryData(modelsCatalogQueryOptions(search))
  },
})
